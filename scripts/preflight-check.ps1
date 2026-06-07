$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "[1/4] Lint"
pnpm lint

Write-Host "[2/4] Build"
pnpm build

Write-Host "[3/4] Backend health"
$env:CULTURAL_VEIN_BACKEND_PORT = "4321"
$job = Start-Job -ScriptBlock {
  $env:CULTURAL_VEIN_BACKEND_PORT = "4321"
  Set-Location "d:\Projects\cultural-vein"
  pnpm backend:dev
}

try {
  Start-Sleep -Seconds 6
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:4321/health" -TimeoutSec 5
  if ($health.status -ne "ok") {
    throw "Backend health check did not return status ok."
  }

  Write-Host "Backend routes:" ($health.routes -join ", ")
  Write-Host "[4/4] Source atlas smoke check"
  Start-Sleep -Seconds 6
  $atlasResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4321/source-atlas?theme=%E4%BA%BA%E7%89%A9%E6%94%AF%E6%B5%81&limit=1" -UseBasicParsing -TimeoutSec 5
  $atlas = $atlasResponse.Content | ConvertFrom-Json
  $entries = @($atlas.sourceAtlas)
  if ($entries.Count -lt 1) {
    throw "Source atlas smoke check returned no entries."
  }

  Write-Host "Source atlas sample:" $entries[0].name
} finally {
  Stop-Job $job -ErrorAction SilentlyContinue | Out-Null
  Remove-Job $job -Force -ErrorAction SilentlyContinue | Out-Null
}

Write-Host "Preflight complete."
