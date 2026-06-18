#!/usr/bin/env pwsh
# SolanaChat Protocol — Integration Test Runner
param(
  [string]$Arch = "v0"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Users\Gagi\Desktop\solana-app"
$ProgramDir = "$ProjectRoot\programs\solanachat-protocol\programs\solanachat-protocol"
$DeployDir = "$ProgramDir\target\deploy"
$LogDir = "$ProjectRoot\target"
$ValidatorLog = "$LogDir\validator.log"

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

# ── Build ──
Write-Host "==> Building for SBF $Arch ..."
Push-Location $ProgramDir
cargo build-sbf --optimize-size --arch $Arch 2>&1 | Out-Null
$ProgramKey = solana-keygen pubkey "$DeployDir\solanachat_protocol-keypair.json"
Write-Host "==> Program: $ProgramKey"
Pop-Location

# ── Start Validator ──
Write-Host "==> Starting solana-test-validator ..."
$ValidatorProcess = Start-Process -NoNewWindow -PassThru -FilePath "solana-test-validator" -ArgumentList @(
  "--reset", "--quiet",
  "--bpf-program", $ProgramKey, "$DeployDir\solanachat_protocol.so"
)

Start-Sleep -Seconds 5

# Wait for validator
for ($i = 0; $i -lt 30; $i++) {
  try {
    $null = solana config get --url http://127.0.0.1:8899 2>&1
    break
  } catch {
    Start-Sleep -Seconds 1
  }
}

# ── Run Tests ──
Write-Host "==> Running tests ..."
Push-Location $ProjectRoot
try {
  npx tsx "programs/solanachat-protocol/tests/solanachat.test.ts"
  $ExitCode = $LASTEXITCODE
} catch {
  $ExitCode = 1
}
Pop-Location

# ── Cleanup ──
Write-Host "==> Stopping validator ..."
Stop-Process -Id $ValidatorProcess.Id -Force -ErrorAction SilentlyContinue

if ($ExitCode -ne 0) {
  Write-Host "`n=== Last 30 lines of validator log ==="
  Get-Content -Tail 30 -Path $ValidatorLog
  Write-Host "========================================"
}

exit $ExitCode
