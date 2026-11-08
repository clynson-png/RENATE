param(
  [switch]$Stop,
  [switch]$ConfigureFirewallOnly,
  [int]$AppPort = 4173,
  [int]$CertificatePort = 4174
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$RuntimeDir = Join-Path $ProjectRoot '.cache\device-asr-preview'
$StatePath = Join-Path $RuntimeDir 'server-state.json'
$FirewallRuleName = 'RENATE Offline Preview LAN 4173-4174'
New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

function Test-Administrator {
  $Identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  return [Security.Principal.WindowsPrincipal]::new($Identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Add-RenateLanFirewallRule {
  Get-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
  New-NetFirewallRule -DisplayName $FirewallRuleName -Description 'Permite dispositivos da sub-rede local acessar a prévia HTTPS offline do RENATE e obter o certificado temporário.' -Direction Inbound -Action Allow -Protocol TCP -LocalPort @([int]$AppPort, [int]$CertificatePort) -RemoteAddress LocalSubnet -Profile Any | Out-Null
  Write-Output "Firewall pronto: TCP $AppPort e $CertificatePort, limitado à sub-rede local."
}

if ($ConfigureFirewallOnly) {
  $SetupLog = Join-Path $RuntimeDir 'firewall-setup.log'
  $IsAdmin = Test-Administrator
  [System.IO.File]::WriteAllText($SetupLog, "isAdministrator=$IsAdmin`r`nuser=$([Security.Principal.WindowsIdentity]::GetCurrent().Name)`r`n", [System.Text.UTF8Encoding]::new($false))
  if (-not $IsAdmin) { throw "Execute esta opção em um terminal elevado. Ver: $SetupLog" }
  try {
    Add-RenateLanFirewallRule
    exit 0
  } catch {
    [System.IO.File]::AppendAllText($SetupLog, "error=$($_.Exception.Message)`r`n", [System.Text.UTF8Encoding]::new($false))
    throw
  }
}

if ($Stop) {
  if (-not (Test-Path -LiteralPath $StatePath)) {
    Write-Output 'RENATE preview is not recorded as running.'
    exit 0
  }
  $State = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
  $Process = Get-Process -Id ([int]$State.serverPid) -ErrorAction SilentlyContinue
  if ($Process) {
    Stop-Process -Id $Process.Id -Force
    Write-Output "Stopped RENATE local preview process $($Process.Id)."
  }
  Remove-Item -LiteralPath $StatePath -Force -ErrorAction SilentlyContinue
  exit 0
}

$FirewallRule = Get-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue
if (-not $FirewallRule) {
  if (Test-Administrator) {
    Add-RenateLanFirewallRule
  } else {
    try {
      $ElevatedCommand = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -ConfigureFirewallOnly -AppPort $AppPort -CertificatePort $CertificatePort"
      $ElevatedProcess = Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -PassThru -ArgumentList $ElevatedCommand
    } catch {
      throw "O Windows não concluiu a elevação necessária para liberar a sub-rede local. $($_.Exception.Message)"
    }
    $FirewallRule = Get-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue
    if (-not $FirewallRule) {
      throw "A regra de firewall não foi instalada (processo elevado $($ElevatedProcess.ExitCode)); liberação restrita à sub-rede local necessária para o acesso pelo celular."
    }
  }
}

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
if (Test-Path -LiteralPath $StatePath) {
  $OldState = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
  if (Get-Process -Id ([int]$OldState.serverPid) -ErrorAction SilentlyContinue) {
    Write-Output "RENATE already running: https://localhost:$($OldState.appPort)/"
    Write-Output "Device URL (open exactly this HTTPS address): https://$($OldState.lanIp):$($OldState.appPort)/"
    exit 0
  }
  Remove-Item -LiteralPath $StatePath -Force
}

$LanAddress = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notin @('127.0.0.1', '0.0.0.0') -and $_.IPAddress -notlike '169.254*' -and $_.InterfaceAlias -match 'Wi-Fi|Wireless|WLAN' } |
  Select-Object -First 1 -ExpandProperty IPAddress
if (-not $LanAddress) {
  $LanAddress = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notin @('127.0.0.1', '0.0.0.0') -and $_.IPAddress -notlike '169.254*' } |
    Select-Object -First 1 -ExpandProperty IPAddress
}
if (-not $LanAddress) { throw 'No LAN IPv4 address found. Connect this computer to the same Wi-Fi as the test phones.' }

$PfxPath = Join-Path $RuntimeDir 'renate-local.pfx'
$PublicCertPath = Join-Path $RuntimeDir 'renate-local.cer'
$PasswordPath = Join-Path $RuntimeDir 'renate-local.pwd'
$ThumbprintPath = Join-Path $RuntimeDir 'certificate-thumbprint.txt'
$Cert = $null
$CertificateThumbprint = $null
if ((Test-Path -LiteralPath $PfxPath) -and (Test-Path -LiteralPath $PublicCertPath) -and (Test-Path -LiteralPath $PasswordPath) -and (Test-Path -LiteralPath $ThumbprintPath)) {
  $CertificateThumbprint = (Get-Content -LiteralPath $ThumbprintPath -Raw).Trim()
}
if (-not $CertificateThumbprint) {
  $RandomBytes = New-Object byte[] 24
  $Random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $Random.GetBytes($RandomBytes)
  $Random.Dispose()
  $Password = [Convert]::ToBase64String($RandomBytes)
  $PasswordSecure = New-Object System.Security.SecureString
  foreach ($Character in $Password.ToCharArray()) { $PasswordSecure.AppendChar($Character) }
  $PasswordSecure.MakeReadOnly()
  $San = "2.5.29.17={text}IPAddress=$LanAddress&DNS=localhost"
  $BasicConstraints = '2.5.29.19={critical}{text}ca=TRUE&pathlength=0'
  $ServerAuth = '2.5.29.37={text}1.3.6.1.5.5.7.3.1'
  $Cert = New-SelfSignedCertificate -Subject 'CN=RENATE Local Device Test' -Type Custom -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 -KeyExportPolicy Exportable -KeyUsage DigitalSignature,KeyEncipherment,CertSign -TextExtension @($BasicConstraints, $San, $ServerAuth) -NotAfter (Get-Date).AddDays(30) -CertStoreLocation Cert:\CurrentUser\My
  Export-PfxCertificate -Cert $Cert -FilePath $PfxPath -Password $PasswordSecure | Out-Null
  Export-Certificate -Cert $Cert -FilePath $PublicCertPath -Type CERT | Out-Null
  [System.IO.File]::WriteAllText($PasswordPath, $Password, [System.Text.UTF8Encoding]::new($false))
  [System.IO.File]::WriteAllText($ThumbprintPath, $Cert.Thumbprint, [System.Text.UTF8Encoding]::new($false))
  $CertificateThumbprint = $Cert.Thumbprint
}

Push-Location $ProjectRoot
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "RENATE build failed with exit code $LASTEXITCODE." }
} finally {
  Pop-Location
}

$env:RENATE_BIND_HOST = '0.0.0.0'
$env:RENATE_HTTPS_PORT = "$AppPort"
$env:RENATE_CERT_PORT = "$CertificatePort"
$env:RENATE_PFX_PATH = $PfxPath
$env:RENATE_PFX_PASSWORD_PATH = $PasswordPath
$env:RENATE_PUBLIC_CERT_PATH = $PublicCertPath
$LogPath = Join-Path $RuntimeDir 'server.log'
$ErrorLogPath = Join-Path $RuntimeDir 'server-error.log'
$NodePath = (Get-Command node -ErrorAction Stop).Source
$ServerProcess = Start-Process -FilePath $NodePath -ArgumentList 'scripts/serve_device_preview.mjs' -WorkingDirectory $ProjectRoot -PassThru -WindowStyle Hidden -RedirectStandardOutput $LogPath -RedirectStandardError $ErrorLogPath
Remove-Item Env:\RENATE_BIND_HOST,Env:\RENATE_HTTPS_PORT,Env:\RENATE_CERT_PORT,Env:\RENATE_PFX_PATH,Env:\RENATE_PFX_PASSWORD_PATH,Env:\RENATE_PUBLIC_CERT_PATH -ErrorAction SilentlyContinue

$Listening = $false
for ($Attempt = 0; $Attempt -lt 40; $Attempt++) {
  Start-Sleep -Milliseconds 250
  $ServerProcess.Refresh()
  if ($ServerProcess.HasExited) { Get-Content -LiteralPath $ErrorLogPath -ErrorAction SilentlyContinue; throw 'RENATE local preview stopped during startup.' }
  $Client = [System.Net.Sockets.TcpClient]::new()
  try { $Client.Connect('127.0.0.1', $AppPort); $Listening = $true; break } catch {} finally { $Client.Dispose() }
}
if (-not $Listening) { Stop-Process -Id $ServerProcess.Id -Force -ErrorAction SilentlyContinue; throw "RENATE preview did not listen on port $AppPort." }

$State = [ordered]@{
  serverPid = $ServerProcess.Id
  appPort = $AppPort
  certificatePort = $CertificatePort
  lanIp = $LanAddress
  certificateThumbprint = $CertificateThumbprint
  startedAt = (Get-Date).ToString('o')
}
$State | ConvertTo-Json | Set-Content -LiteralPath $StatePath -Encoding utf8

Write-Output 'RENATE local offline preview is running.'
Write-Output "Desktop: https://localhost:$AppPort/"
Write-Output "Android/iPhone (same Wi-Fi; use HTTPS and this IP): https://$LanAddress`:$AppPort/"
Write-Output "Android certificate: http://$LanAddress`:$CertificatePort/renate-local.cer"
Write-Output "iPhone profile: http://$LanAddress`:$CertificatePort/renate-local.mobileconfig"
Write-Output 'Install the Android certificate or iPhone profile and enable full trust before opening the HTTPS address; microphone capture requires a secure context.'
Write-Output "Stop: powershell -ExecutionPolicy Bypass -File `"$PSScriptRoot\start-renate.ps1`" -Stop"

Start-Process "https://localhost:$AppPort/"
