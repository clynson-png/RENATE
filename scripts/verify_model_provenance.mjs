import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packages = [
  { name: 'Whisper Tiny ONNX', directory: 'public/models/whisper-tiny', manifest: 'public/models/whisper-tiny/PROVENANCE.json' },
  { name: 'ONNX Runtime WASM', directory: 'public/onnxruntime', manifest: 'public/onnxruntime/PROVENANCE.json' },
];
let failures = 0;
let totalFiles = 0;
let totalBytes = 0;

for (const item of packages) {
  const directory = path.resolve(root, item.directory);
  const manifest = JSON.parse(fs.readFileSync(path.resolve(root, item.manifest), 'utf8'));
  for (const entry of manifest.files) {
    const file = path.resolve(directory, entry.path);
    if (!file.startsWith(`${directory}${path.sep}`)) throw new Error(`Unsafe manifest path: ${entry.path}`);
    totalFiles += 1;
    if (!fs.existsSync(file)) {
      console.error(`MISSING ${item.name}: ${entry.path}`);
      failures += 1;
      continue;
    }
    const buffer = fs.readFileSync(file);
    totalBytes += buffer.byteLength;
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    if (buffer.byteLength !== entry.bytes || sha256 !== entry.sha256) {
      console.error(`MISMATCH ${item.name}: ${entry.path}`);
      failures += 1;
    }
  }
}

const result = { state: failures === 0 ? 'PASS' : 'FAIL', packages: packages.length, files: totalFiles, bytes: totalBytes, failures };
console.log(JSON.stringify(result, null, 2));
if (failures) process.exitCode = 1;
