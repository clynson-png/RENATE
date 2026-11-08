import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packageManifest = JSON.parse(fs.readFileSync(path.join(root, 'public/renate-pack/manifest.json'), 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const sourceFiles = ['src/App.jsx', 'src/atlasSearch.worker.js', 'src/atlasSearchClient.js', 'src/localHistory.js'];
const sourceText = sourceFiles.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
const packagedLeadPaths = packageManifest.files.filter((file) => /\bleads?\b/i.test(file.path));
const forbiddenClientReferences = ['@supabase/supabase-js', 'service_role', 'SUPABASE_SERVICE_ROLE_KEY'].filter((needle) =>
  sourceText.includes(needle) || JSON.stringify(packageJson).includes(needle));
const hasSupabaseClientDependency = Boolean(packageJson.dependencies?.['@supabase/supabase-js']);
const hasEnvironmentSecretFile = ['.env', '.env.local', '.env.production'].some((file) => fs.existsSync(path.join(root, file)));

const report = {
  generatedAt: new Date().toISOString(),
  staticClientAudit: packagedLeadPaths.length === 0 && forbiddenClientReferences.length === 0 && !hasSupabaseClientDependency && !hasEnvironmentSecretFile ? 'PASS_NO_LEAD_DATA_OR_ADMIN_SECRET_IN_CLIENT_PACKAGE' : 'FAIL',
  packagedLeadPaths,
  forbiddenClientReferences,
  hasSupabaseClientDependency,
  hasEnvironmentSecretFile,
  leadPersistence: 'NOT_IMPLEMENTED; initial lead registration remains deferred until local acceptance passes',
  supabaseRlsReadDenial: 'PENDING; Supabase is not configured, so client read denial has not been exercised against a database',
  acceptance: 'BLOCKED_FOR_RLS_CLAIM_UNTIL_SUPABASE_INSERT_ONLY_POLICY_IS_RUNTIME_TESTED',
};
fs.writeFileSync(path.join(root, 'docs/beta-offline/LEAD_PRIVACY_ACCEPTANCE_2026-11-06.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.staticClientAudit !== 'PASS_NO_LEAD_DATA_OR_ADMIN_SECRET_IN_CLIENT_PACKAGE') process.exitCode = 1;
