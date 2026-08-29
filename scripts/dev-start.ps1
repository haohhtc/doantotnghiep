# Khoi dong toan bo moi truong dev: Docker (MySQL OLTP/DW) + Backend Spring Boot + Frontend Vite.
# Chay: cd vao thu muc goc project roi go  .\scripts\dev-start.ps1
# (Neu bi chan boi execution policy: powershell -ExecutionPolicy Bypass -File scripts\dev-start.ps1)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

Write-Host "== 1. Kiem tra Docker Desktop ==" -ForegroundColor Cyan
$dockerReady = $false
try {
    docker ps *> $null
    if ($LASTEXITCODE -eq 0) { $dockerReady = $true }
} catch {}

if (-not $dockerReady) {
    Write-Host "Docker Desktop chua chay, dang khoi dong..." -ForegroundColor Yellow
    $dockerExe = "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe"
    if (Test-Path $dockerExe) {
        Start-Process $dockerExe
    } else {
        Write-Host "Khong tim thay Docker Desktop tai '$dockerExe'. Hay mo Docker Desktop thu cong." -ForegroundColor Red
        exit 1
    }
    Write-Host "Dang cho Docker daemon san sang (toi da 90s)..."
    $waited = 0
    while ($waited -lt 90) {
        Start-Sleep -Seconds 3
        $waited += 3
        docker ps *> $null
        if ($LASTEXITCODE -eq 0) { $dockerReady = $true; break }
    }
    if (-not $dockerReady) {
        Write-Host "Docker van chua san sang sau 90s. Thu chay lai script sau khi Docker Desktop hien 'Running'." -ForegroundColor Red
        exit 1
    }
}
Write-Host "Docker daemon san sang." -ForegroundColor Green

Write-Host "`n== 2. Khoi dong container MySQL (OLTP/DW) + Adminer ==" -ForegroundColor Cyan
Push-Location $root
docker compose up -d
Pop-Location

Write-Host "`n== 3. Khoi dong Backend (Spring Boot, port 8080) trong cua so moi ==" -ForegroundColor Cyan
$backendDir = Join-Path $root "backend"
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$backendDir'; `$env:OLTP_DB_PORT='3308'; .\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=dev'"
)

Write-Host "`n== 4. Khoi dong Frontend (Vite, port 5173) trong cua so moi ==" -ForegroundColor Cyan
$frontendDir = Join-Path $root "frontend"
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$frontendDir'; npm run dev"
)

Write-Host "`nDa khoi dong xong. Doi khoang 10-15s roi mo http://localhost:5173" -ForegroundColor Green
Write-Host "Backend: http://localhost:8080 | Adminer: http://localhost:8081"
