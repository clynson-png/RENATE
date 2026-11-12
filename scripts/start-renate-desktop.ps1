param(
  [switch]$Stop,
  [int]$Port = 4173
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$RuntimeDir = Join-Path $ProjectRoot '.cache\renate-desktop'
$StatePath = Join-Path $RuntimeDir 'server-state.json'
$LogPath = Join-Path $RuntimeDir 'server.log'
$ErrorLogPath = Join-Path $RuntimeDir 'server-error.log'
$Url = "http://127.0.0.1:$Port/"

if ($Stop) {
  if (-not (Test-Path -LiteralPath $StatePath)) {
    Write-Output 'RENATE desktop server is not recorded as running.'
    exit 0
  }
  $State = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
  $Process = Get-Process -Id ([int]$State.serverPid) -ErrorAction SilentlyContinue
  if ($Process) {
    Stop-Process -Id $Process.Id -Force
    Write-Output "RENATE desktop server stopped (PID $($Process.Id))."
  }
  Remove-Item -LiteralPath $StatePath -Force -ErrorAction SilentlyContinue
  exit 0
}

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
if (Test-Path -LiteralPath $StatePath) {
  $OldState = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
  $OldProcess = Get-Process -Id ([int]$OldState.serverPid) -ErrorAction SilentlyContinue
  if ($OldProcess) {
    if ([int]$OldState.port -ne $Port) {
      throw "RENATE desktop is already running at http://127.0.0.1:$($OldState.port)/. Stop it first to change ports."
    }
    Start-Process $Url
    Write-Output "RENATE desktop is already running: $Url"
    exit 0
  }
  Remove-Item -LiteralPath $StatePath -Force -ErrorAction SilentlyContinue
}

$ViteEntry = Join-Path $ProjectRoot 'node_modules\vite\bin\vite.js'
if (-not (Test-Path -LiteralPath $ViteEntry)) {
  throw 'RENATE dependencies are missing. Run npm install in the RENATE folder, then retry.'
}
$NodePath = (Get-Command node -ErrorAction Stop).Source

$Listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
try {
  $Listener.Start()
} catch {
  throw "Port $Port is already in use. Close its process or choose another port with -Port."
} finally {
  $Listener.Stop()
}

$ServerProcess = Start-Process -FilePath $NodePath `
  -ArgumentList ('"{0}" --host 127.0.0.1 --port {1} --strictPort' -f $ViteEntry, $Port) `
  -WorkingDirectory $ProjectRoot -PassThru -WindowStyle Hidden `
  -RedirectStandardOutput $LogPath -RedirectStandardError $ErrorLogPath

$Listening = $false
for ($Attempt = 0; $Attempt -lt 40; $Attempt++) {
  Start-Sleep -Milliseconds 250
  $ServerProcess.Refresh()
  if ($ServerProcess.HasExited) {
    Get-Content -LiteralPath $ErrorLogPath -ErrorAction SilentlyContinue
    throw 'RENATE desktop server stopped during startup.'
  }
  $Client = [System.Net.Sockets.TcpClient]::new()
  try { $Client.Connect('127.0.0.1', $Port); $Listening = $true; break } catch {} finally { $Client.Dispose() }
}
if (-not $Listening) {
  Stop-Process -Id $ServerProcess.Id -Force -ErrorAction SilentlyContinue
  throw "RENATE did not start listening on port $Port. See $ErrorLogPath"
}

[ordered]@{
  serverPid = $ServerProcess.Id
  port = $Port
  startedAt = (Get-Date).ToString('o')
} | ConvertTo-Json | Set-Content -LiteralPath $StatePath -Encoding utf8

Start-Process $Url
Write-Output 'RENATE desktop local mode is running.'
Write-Output "URL: $Url"
Write-Output "Stop: powershell -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Stop"
