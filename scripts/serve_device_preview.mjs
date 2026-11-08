import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { preview } from 'vite';

const host = process.env.RENATE_BIND_HOST || '0.0.0.0';
const appPort = Number(process.env.RENATE_HTTPS_PORT || 4173);
const certPort = Number(process.env.RENATE_CERT_PORT || 4174);
const pfxPath = process.env.RENATE_PFX_PATH;
const passwordPath = process.env.RENATE_PFX_PASSWORD_PATH;
const certPath = process.env.RENATE_PUBLIC_CERT_PATH;
if (!pfxPath || !passwordPath || !certPath) throw new Error('Missing local RENATE device-test certificate settings.');

const pfx = readFileSync(pfxPath);
const passphrase = readFileSync(passwordPath, 'utf8').trim();
const certificateBase64 = readFileSync(certPath).toString('base64');
const mobileConfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>PayloadContent</key><array><dict>
<key>PayloadCertificateFileName</key><string>renate-local.cer</string>
<key>PayloadContent</key><data>${certificateBase64}</data>
<key>PayloadDescription</key><string>Certificado raiz temporario para teste local do RENATE.</string>
<key>PayloadDisplayName</key><string>RENATE Local Test Certificate</string>
<key>PayloadIdentifier</key><string>br.renate.localtest.root</string>
<key>PayloadOrganization</key><string>RENATE offline device test</string>
<key>PayloadType</key><string>com.apple.security.root</string>
<key>PayloadUUID</key><string>${randomUUID().toUpperCase()}</string>
<key>PayloadVersion</key><integer>1</integer>
</dict></array>
<key>PayloadDescription</key><string>Confere HTTPS local para validar ASR no RENATE.</string>
<key>PayloadDisplayName</key><string>RENATE ASR local</string>
<key>PayloadIdentifier</key><string>br.renate.localtest.profile</string>
<key>PayloadOrganization</key><string>RENATE offline device test</string>
<key>PayloadRemovalDisallowed</key><false/>
<key>PayloadType</key><string>Configuration</string>
<key>PayloadUUID</key><string>${randomUUID().toUpperCase()}</string>
<key>PayloadVersion</key><integer>1</integer>
</dict></plist>`;
const certServer = createServer((request, response) => {
  if (request.method !== 'GET') {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ state: 'RENATE_DEVICE_CERT_SERVER_READY' }));
    return;
  }
  if (request.url === '/renate-local.mobileconfig') {
    response.writeHead(200, {
      'content-type': 'application/x-apple-aspen-config',
      'content-disposition': 'attachment; filename="renate-local.mobileconfig"',
      'cache-control': 'no-store',
    });
    response.end(mobileConfig);
    return;
  }
  if (request.url !== '/renate-local.cer') {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, {
    'content-type': 'application/pkix-cert',
    'content-disposition': 'attachment; filename="renate-local.cer"',
    'cache-control': 'no-store',
  });
  response.end(readFileSync(certPath));
});
certServer.listen(certPort, host);

const server = await preview({
  preview: {
    host,
    port: appPort,
    strictPort: true,
    https: { pfx, passphrase },
  },
});

console.log(`RENATE local device preview: ${server.resolvedUrls?.local?.[0] ?? `https://localhost:${appPort}/`}`);
console.log(`Local iPhone profile: http://<LAN-IP>:${certPort}/renate-local.mobileconfig`);
console.log(`Local Android certificate: http://<LAN-IP>:${certPort}/renate-local.cer`);

async function shutdown() {
  certServer.close();
  await server.close();
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
