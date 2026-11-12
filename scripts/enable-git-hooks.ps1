$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Push-Location $ProjectRoot
try {
  git config --local core.hooksPath .githooks
  if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel ativar o hook pre-commit do RENATE.' }
} finally {
  Pop-Location
}
Write-Output 'Hook pre-commit do RENATE ativado para este checkout.'
