import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const staged = process.argv.includes('--staged');

function readProjectFile(path) {
  if (!staged) return readFileSync(path, 'utf8');
  return execFileSync('git', ['show', `:${path}`], { encoding: 'utf8' });
}

function readPreviousApp() {
  try {
    return execFileSync('git', ['show', staged ? 'HEAD:src/App.jsx' : 'HEAD^:src/App.jsx'], { encoding: 'utf8' });
  } catch {
    return '';
  }
}

function requireText(source, text, description) {
  if (!source.includes(text)) throw new Error(`Protecao de login ausente: ${description}`);
}

const app = readProjectFile('src/App.jsx');
const localBypassImplemented = app.includes('canSkipLocalAuth');
const previousApp = readPreviousApp();
if (previousApp.includes('canSkipLocalAuth') && !localBypassImplemented) {
  throw new Error('O bypass local seguro foi removido; a regra local deve permanecer ativa.');
}

const loginRequirements = [
  ['function LeadRegistrationGate(', 'cadastro inicial hospedado'],
  ['function InstallGate(', 'gate de instalacao hospedada'],
  ['function PinGate(', 'PIN local hospedado'],
  ['hasLocalPin(), hasLeadRegistration()', 'validacao do PIN e cadastro existente'],
  ['submitLead({ fullName, email, phone }, turnstileToken)', 'envio protegido do cadastro'],
  ['isLeadRegistrationConfigured()', 'configuracao do cadastro hospedado'],
];
for (const [text, label] of loginRequirements) requireText(app, text, label);

if (localBypassImplemented) {
  const boundary = readProjectFile('src/localDevelopmentAuth.js');
  const spec = readProjectFile('RENATE_BETA_OFFLINE_SPEC_V1.md');
  const packageJson = JSON.parse(readProjectFile('package.json'));
  const vercelConfig = JSON.parse(readProjectFile('vercel.json'));

  const expectedBoundary = [
    "const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);",
    '',
    'export function canSkipLocalAuth({ developmentBuild, hostname }) {',
    '  return developmentBuild === true',
    "    && LOCAL_HOSTNAMES.has(String(hostname ?? '').toLowerCase());",
    '}',
  ].join('\n');
  if (boundary.trim() !== expectedBoundary) {
    throw new Error('O bypass local deixou de estar restrito a DEV e aos tres hostnames loopback permitidos.');
  }
  requireText(app, [
    'const localDevelopmentNoLogin = canSkipLocalAuth({',
    '    developmentBuild: import.meta.env.DEV,',
    '    hostname: window.location.hostname,',
    '  });',
  ].join('\n'), 'bypass derivado do build Vite e do hostname real');
  requireText(app, "if (!localDevelopmentNoLogin && pinState === 'lead') return <LeadRegistrationGate", 'gate de cadastro ativo fora do local');
  requireText(app, "if (!localDevelopmentNoLogin && pinState === 'install') return <InstallGate", 'gate de instalacao ativo fora do local');
  requireText(app, "if (!localDevelopmentNoLogin && !unlocked) return <PinGate", 'PIN ativo fora do local');
  if (/if\s*\(\s*pinState === '(lead|install)'\s*\)/.test(app) || /if\s*\(\s*!unlocked\s*\)\s*return\s*<PinGate/.test(app)) {
    throw new Error('Foi encontrado um gate sem a condicao do ambiente local.');
  }
  requireText(app, 'useState(localDevelopmentNoLogin)', 'entrada direta apenas no loopback de desenvolvimento');
  requireText(app, "if (!localDevelopmentNoLogin && pinState === 'checking')", 'estado de verificacao protegido');
  requireText(app, "if (!localDevelopmentNoLogin && pinState === 'error')", 'erro de armazenamento protegido');

  if (!String(packageJson.scripts?.build ?? '').includes('guard-login-boundary.mjs')) {
    throw new Error('Protecao de login ausente: o build do RENATE nao executa o guard.');
  }
  if (!String(vercelConfig.buildCommand ?? '').includes('guard-login-boundary.mjs')) {
    throw new Error('Protecao de login ausente: o build command do Vercel nao executa o guard.');
  }
  requireText(spec, '### 12.3 Aditivo — acesso local de desenvolvimento', 'regra de ambiente registrada na SPEC');
  requireText(spec, 'Vercel Production e Preview', 'protecao explicita dos ambientes Vercel');
  requireText(spec, 'pre-commit', 'regra de preservacao no commit');

  if (staged) {
    const hook = readProjectFile('.githooks/pre-commit');
    requireText(hook, 'guard-login-boundary.mjs --staged', 'hook pre-commit registrado');
  }
} else {
  requireText(app, "if (pinState === 'lead') return <LeadRegistrationGate", 'gate de cadastro hospedado');
  requireText(app, "if (pinState === 'install') return <InstallGate", 'gate de instalacao hospedado');
  requireText(app, "if (!unlocked) return <PinGate", 'PIN hospedado');
}

console.log(`Protecao de login preservada (${staged ? 'conteudo staged para commit' : 'build local/hosting'}).`);
