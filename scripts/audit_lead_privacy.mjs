import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packageManifest = JSON.parse(fs.readFileSync(path.join(root, 'public/renate-pack/manifest.json'), 'utf8'));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
const edgeEvidencePath = path.join(root, 'docs/beta-offline/SUPABASE_LEAD_EDGE_RUNTIME_2026-11-09.json');
const edgeEvidence = fs.existsSync(edgeEvidencePath) ? JSON.parse(fs.readFileSync(edgeEvidencePath, 'utf8')) : null;
const sourceFiles = ['src/App.jsx', 'src/atlasSearch.worker.js', 'src/atlasSearchClient.js', 'src/localHistory.js', 'src/leadRegistration.js'];
const sourceText = sourceFiles.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
const packagedLeadPaths = packageManifest.files.filter((file) => /\bleads?\b/i.test(file.path));
const forbiddenClientReferences = ['service_role', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY'].filter((needle) =>
  sourceText.toLowerCase().includes(needle.toLowerCase()) || JSON.stringify(packageJson).toLowerCase().includes(needle.toLowerCase()));
const hasSupabaseClientDependency = Boolean(packageJson.dependencies?.['@supabase/supabase-js']);
const envFiles = ['.env', '.env.local', '.env.production'].filter((file) => fs.existsSync(path.join(root, file)));
const ignoredEnvFiles = envFiles.filter((file) => gitignore.split(/\r?\n/).some((line) => [file, '.env*', '.env.*'].includes(line.trim())));
const envFilesAreIgnored = envFiles.length === ignoredEnvFiles.length;

const report = {
  generatedAt: new Date().toISOString(),
  staticClientAudit: packagedLeadPaths.length === 0 && forbiddenClientReferences.length === 0 && !hasSupabaseClientDependency && envFilesAreIgnored ? 'PASS_NO_LEAD_DATA_OR_ADMIN_SECRET_IN_CLIENT_PACKAGE' : 'FAIL',
  packagedLeadPaths,
  forbiddenClientReferences,
  hasSupabaseClientDependency,
  envFilesPresent: envFiles,
  envFilesAreIgnored,
  clientLeadFlow: 'EDGE_FUNCTION_TURNSTILE_REQUIRED; THREE_CONTACT_FIELDS_ONLY; PRODUCTION_SITE_KEY_PENDING',
  supabaseRlsReadDenial: edgeEvidence?.remoteMigration?.remoteGrants?.anonSelect === false ? 'PASS; ANON_SELECT_DENIED' : 'PENDING_REMOTE_GRANT_CHECK',
  supabaseRlsWriteDenial: edgeEvidence?.remoteMigration?.remoteGrants?.anonInsert === false && edgeEvidence?.remoteMigration?.remoteGrants?.anonUpdate === false && edgeEvidence?.remoteMigration?.remoteGrants?.anonDelete === false
    ? 'PASS; ANON_DIRECT_WRITES_DENIED'
    : 'PENDING_REMOTE_GRANT_CHECK',
  leadFormRuntime: edgeEvidence?.localTests?.browserForm === 'PASS' && edgeEvidence?.localTests?.edgeFunctionUnitTests === '6/6_PASS'
    ? 'PASS_LOCAL; SYNTHETIC_TURNSTILE_TOKEN; NO_LEAD_WRITTEN'
    : 'PENDING',
  abuseMitigation: edgeEvidence?.remoteDeployment?.functionDeployed === true
    ? 'TURNSTILE_SERVER_VALIDATION_DEPLOYED; NO_PER_IP_RATE_LIMIT'
    : 'LOCAL_IMPLEMENTATION_AND_TESTS_PASS; REMOTE_FUNCTION_DEPLOYMENT_AND_SECRETS_PENDING; NO_PER_IP_RATE_LIMIT',
  retentionAndDeletionPolicy: 'APPROVED_UNTIL_DELETION_REQUEST; PUBLIC_PRIVACY_CONTACT_PENDING',
  acceptance: 'BLOCKED_UNTIL_FUNCTION_DEPLOYMENT_SECRETS_SITEKEY_PRIVACY_CONTACT_AND_HOSTED_ACCEPTANCE',
};
fs.writeFileSync(path.join(root, 'docs/beta-offline/LEAD_PRIVACY_ACCEPTANCE_2026-11-09.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.staticClientAudit !== 'PASS_NO_LEAD_DATA_OR_ADMIN_SECRET_IN_CLIENT_PACKAGE') process.exitCode = 1;
