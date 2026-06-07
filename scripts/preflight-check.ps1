$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "[1/4] Lint"
pnpm lint

Write-Host "[2/4] Build"
pnpm build

Write-Host "[3/6] Backend health"
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
  Write-Host "[4/6] Source atlas smoke check"
  Start-Sleep -Seconds 6
  $atlasResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4321/source-atlas?theme=%E4%BA%BA%E7%89%A9%E6%94%AF%E6%B5%81&limit=1" -UseBasicParsing -TimeoutSec 5
  $atlas = $atlasResponse.Content | ConvertFrom-Json
  $entries = @($atlas.sourceAtlas)
  if ($entries.Count -lt 1) {
    throw "Source atlas smoke check returned no entries."
  }

  Write-Host "Source atlas sample:" $entries[0].name
  Write-Host "[5/6] Branch book smoke check"
  $familyResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4321/books/zhuzi-jiali" -UseBasicParsing -TimeoutSec 5
  $familyBook = $familyResponse.Content | ConvertFrom-Json
  if ($familyBook.book.slug -ne "zhuzi-jiali") {
    throw "Family ritual branch payload did not return zhuzi-jiali."
  }
  if ((@($familyBook.detail.timeline)).Count -lt 3) {
    throw "Family ritual branch timeline is incomplete."
  }

  $nanhuResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4321/books/nanhu-jinian" -UseBasicParsing -TimeoutSec 5
  $nanhuBook = $nanhuResponse.Content | ConvertFrom-Json
  if ($nanhuBook.book.slug -ne "nanhu-jinian") {
    throw "Nanhu memorial branch payload did not return nanhu-jinian."
  }
  if ((@($nanhuBook.sourceEvidence)).Count -lt 2) {
    throw "Nanhu memorial branch source evidence is incomplete."
  }

  Write-Host "Branch books:" $familyBook.book.title "," $nanhuBook.book.title
  Write-Host "[6/6] Source branch linkage check"
  $genealogyResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4321/source-atlas/genealogy-archive" -UseBasicParsing -TimeoutSec 5
  $genealogyAtlas = $genealogyResponse.Content | ConvertFrom-Json
  if (-not (@($genealogyAtlas.relatedBooks) | Where-Object { $_.slug -eq "zhuzi-jiali" })) {
    throw "Genealogy source atlas entry does not link to zhuzi-jiali."
  }

  $redResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4321/source-atlas/red-archive" -UseBasicParsing -TimeoutSec 5
  $redAtlas = $redResponse.Content | ConvertFrom-Json
  if (-not (@($redAtlas.relatedBooks) | Where-Object { $_.slug -eq "nanhu-jinian" })) {
    throw "Red archive source atlas entry does not link to nanhu-jinian."
  }

  Write-Host "Source linkage:" $genealogyAtlas.entry.name "-> zhuzi-jiali," $redAtlas.entry.name "-> nanhu-jinian"
} finally {
  Stop-Job $job -ErrorAction SilentlyContinue | Out-Null
  Remove-Job $job -Force -ErrorAction SilentlyContinue | Out-Null
}

Write-Host "Preflight complete."
