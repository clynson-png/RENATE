$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$SourcePath = Join-Path $PSScriptRoot 'renate_launcher.cs'
$OutputPath = Join-Path $ProjectRoot 'RENATE Local.exe'
$CompilerCandidates = @(
  (Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'),
  (Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe')
)
$Compiler = $CompilerCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $Compiler) { throw 'Compilador C# do .NET Framework nao encontrado neste Windows.' }
if (-not (Test-Path -LiteralPath $SourcePath)) { throw "Fonte do executavel nao encontrada: $SourcePath" }
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'start-renate-desktop.ps1'))) {
  throw 'O script de inicializacao local esta ausente.'
}

Push-Location $ProjectRoot
try {
  & $Compiler /nologo /target:winexe /reference:System.dll /reference:System.Windows.Forms.dll "/out:$OutputPath" $SourcePath
  if ($LASTEXITCODE -ne 0) { throw "Falha ao compilar RENATE Local.exe (codigo $LASTEXITCODE)." }
} finally {
  Pop-Location
}

Write-Output "Executavel criado: $OutputPath"
Write-Output 'Clique duas vezes em RENATE Local.exe para abrir o RENATE neste computador.'
Write-Output 'Para encerrar, execute RENATE Local.exe -Stop.'
