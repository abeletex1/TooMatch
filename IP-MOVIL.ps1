# ============================================================================
# IP-MOVIL.ps1
# ----------------------------------------------------------------------------
# Detecta tu IP local, genera una pagina HTML con codigo QR + URL, y la abre
# en el navegador. Escaneas el QR con el movil (misma WiFi) y entras directo
# a Too Match sin tener que teclear nada.
# ============================================================================

$ErrorActionPreference = 'SilentlyContinue'

# 1. Detectar IP local en rango privado (192.168.* o 10.*)
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
       Where-Object { $_.IPAddress -match '^(192\.168\.|10\.)' } |
       Select-Object -First 1).IPAddress

if (-not $ip) {
  Write-Host ""
  Write-Host "  No se pudo detectar tu IP local." -ForegroundColor Yellow
  Write-Host "  Comprueba que estas conectado a una red WiFi." -ForegroundColor Yellow
  Write-Host ""
  Read-Host "Pulsa Enter para salir"
  exit 1
}

$url   = "http://${ip}:3000"
$qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${url}&color=1E1B17&bgcolor=FAF7F2&margin=10"

# 2. Comprobar si el servidor de Next esta corriendo
$serverRunning = $false
try {
  $tcp = New-Object System.Net.Sockets.TcpClient
  $tcp.ConnectAsync('127.0.0.1', 3000).Wait(500) | Out-Null
  if ($tcp.Connected) { $serverRunning = $true }
  $tcp.Close()
} catch {}

$serverWarning = ''
if (-not $serverRunning) {
  $serverWarning = '<div class="warn">Atencion: parece que el servidor no esta corriendo. Doble clic en INICIAR.bat primero.</div>'
}

# 3. Generar HTML estilo Too Match
$html = @"
<!DOCTYPE html>
<html lang='es'>
<head>
<meta charset='UTF-8'>
<meta name='viewport' content='width=device-width, initial-scale=1'>
<title>Too Match - Acceso movil</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; background: #E8E0D4; color: #1E1B17; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.card { background: #FAF7F2; max-width: 460px; width: 100%; padding: 40px 32px; border-radius: 24px; text-align: center; box-shadow: 0 8px 32px rgba(30,27,23,0.06); border: 0.5px solid rgba(30,27,23,0.18); }
.brand { font-family: Georgia, 'Times New Roman', serif; font-weight: 500; font-size: 56px; line-height: 1; margin-bottom: 4px; }
.brand .inf { color: #6B8C7E; margin-left: 2px; }
.tag { color: #A8A099; font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase; margin-bottom: 32px; padding-left: 0.32em; }
h2 { font-size: 13px; font-weight: 500; color: #6B6258; margin-bottom: 14px; letter-spacing: 0.05em; }
.url { background: #F2EDE4; padding: 14px 16px; border-radius: 12px; font-family: ui-monospace, 'SF Mono', monospace; font-size: 15px; word-break: break-all; color: #1E1B17; border: 0.5px solid rgba(30,27,23,0.10); margin-bottom: 24px; }
.qr { display: block; margin: 0 auto 24px; border-radius: 12px; max-width: 280px; width: 100%; }
ol { text-align: left; color: #6B6258; line-height: 1.8; font-size: 13px; padding-left: 22px; max-width: 340px; margin: 0 auto; }
ol li { margin-bottom: 4px; font-weight: 300; }
.note { margin-top: 22px; font-size: 11px; color: #A8A099; font-weight: 300; }
.warn { background: rgba(196,115,90,0.10); border: 0.5px solid #E8B4A0; color: #8C4A35; border-radius: 12px; padding: 12px 14px; margin-bottom: 24px; font-size: 13px; font-weight: 300; }
</style>
</head>
<body>
<div class='card'>
  <div class='brand'>T<span class='inf'>&#8734;</span></div>
  <div class='tag'>Match</div>
  $serverWarning
  <h2>Escanea con la camara del movil</h2>
  <img class='qr' src='$qrUrl' alt='QR para acceso movil'>
  <h2>O teclea manualmente</h2>
  <div class='url'>$url</div>
  <ol>
    <li>Conecta el movil a la misma WiFi que el PC.</li>
    <li>Escanea el QR con la camara (o abre la URL en el navegador).</li>
    <li>Asegurate de que INICIAR.bat esta corriendo.</li>
  </ol>
  <div class='note'>Si Windows pregunta por el firewall, marca redes privadas.</div>
</div>
</body>
</html>
"@

# 4. Escribir y abrir
$tmpFile = Join-Path $env:TEMP 'toomatch-mobile.html'
Set-Content -Path $tmpFile -Value $html -Encoding UTF8
Start-Process $tmpFile

Write-Host ""
Write-Host "  Pagina abierta en el navegador." -ForegroundColor Cyan
Write-Host "  URL: $url" -ForegroundColor Cyan
Write-Host ""
Start-Sleep -Seconds 2
