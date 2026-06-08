$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)

function Assert-PathExists {
  param(
    [string]$PathValue
  )

  if (-not (Test-Path -LiteralPath $PathValue)) {
    throw ("Missing required file: " + $PathValue)
  }
}

function Assert-TextContains {
  param(
    [string]$Text,
    [string]$Needle,
    [string]$Label
  )

  if (-not $Text.Contains($Needle)) {
    throw ($Label + ": " + $Needle)
  }
}

function Assert-Condition {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

Write-Host "[1/4] Run preflight"
pnpm preflight

Write-Host "[2/5] Verify documentation artifacts"
$requiredDocs = @(
  "README.md",
  "DELIVERY.md",
  "ARCHITECTURE.md",
  "FINAL_AUDIT.md",
  "REQUIREMENTS_MATRIX.md"
)

foreach ($doc in $requiredDocs) {
  Assert-PathExists -PathValue $doc
}

Write-Host ("Docs: " + ($requiredDocs -join ", "))

Write-Host "[3/5] Verify requirements evidence anchors"
$matrix = Get-Content -LiteralPath "REQUIREMENTS_MATRIX.md" -Raw -Encoding utf8
$requiredAnchors = @(
  [string]([char]0x8BBA + [char]0x8BED),
  [string]([char]0x5468 + [char]0x6613),
  [string]([char]0x6731 + [char]0x5B50 + [char]0x5BB6 + [char]0x793C),
  [string]([char]0x5357 + [char]0x6E56 + [char]0x7EAA + [char]0x5FF5 + [char]0x6587 + [char]0x732E),
  [string]([char]0x5BB6 + [char]0x8C31 + [char]0x6587 + [char]0x732E + " -> " + [char]0x6731 + [char]0x5B50 + [char]0x5BB6 + [char]0x793C),
  [string]([char]0x7EA2 + [char]0x8272 + [char]0x6587 + [char]0x732E + " -> " + [char]0x5357 + [char]0x6E56 + [char]0x7EAA + [char]0x5FF5 + [char]0x6587 + [char]0x732E)
)

foreach ($anchor in $requiredAnchors) {
  Assert-TextContains -Text $matrix -Needle $anchor -Label "Missing requirements matrix anchor"
}

Write-Host ("Evidence anchors: " + ($requiredAnchors -join ", "))

Write-Host "[4/5] Verify UI surface accessibility"
pnpm ui:audit

Write-Host "[5/5] Verify source atlas themes"
$env:CULTURAL_VEIN_BACKEND_PORT = "4321"
$job = Start-Job -ScriptBlock {
  $env:CULTURAL_VEIN_BACKEND_PORT = "4321"
  Set-Location "d:\Projects\cultural-vein"
  pnpm backend:dev
}

try {
  Start-Sleep -Seconds 6
  $response = Invoke-WebRequest -Uri "http://127.0.0.1:4321/source-atlas?limit=20" -UseBasicParsing -TimeoutSec 5
  $atlas = $response.Content | ConvertFrom-Json
  $entries = @($atlas.sourceAtlas)
  if ($entries.Count -lt 5) {
    throw "Source atlas returned too few entries."
  }

  $themeOptions = @($atlas.atlasMeta.filterOptions.themes)
  $eraOptions = @($atlas.atlasMeta.filterOptions.eras)
  Assert-Condition ($themeOptions.Count -ge 5) "Source atlas filter options should expose multiple themes."
  Assert-Condition ($eraOptions.Count -ge 2) "Source atlas filter options should expose multiple eras."

  $themeLabels = $themeOptions | ForEach-Object { $_.label }
  $eraLabels = $eraOptions | ForEach-Object { $_.label }
  Assert-Condition ($themeLabels -contains [string]([char]0x4EBA + [char]0x7269 + [char]0x652F + [char]0x6D41)) "Source atlas filter options missing 人物支流."
  Assert-Condition ($themeLabels -contains [string]([char]0x7EA2 + [char]0x8272 + [char]0x652F + [char]0x6D41)) "Source atlas filter options missing 红色支流."
  Assert-Condition ($eraLabels -contains [string]([char]0x8FD1 + [char]0x73B0 + [char]0x4EE3)) "Source atlas filter options missing 近现代."

  $requiredNames = @(
    [string]([char]0x5BB6 + [char]0x8C31 + [char]0x6587 + [char]0x732E),
    [string]([char]0x7EA2 + [char]0x8272 + [char]0x6587 + [char]0x732E),
    [string]([char]0x57CE + [char]0x5E02 + [char]0x4E13 + [char]0x9898 + [char]0x7247)
  )

  foreach ($name in $requiredNames) {
    $match = $entries | Where-Object { $_.name -eq $name }
    if (-not $match) {
      throw ("Missing source atlas entry: " + $name)
    }

    Assert-Condition (-not [string]::IsNullOrWhiteSpace($match[0].theme)) ("Source atlas entry missing theme: " + $name)
    if ($name -ne [string]([char]0x5BB6 + [char]0x8C31 + [char]0x6587 + [char]0x732E)) {
      Assert-Condition (-not [string]::IsNullOrWhiteSpace($match[0].era)) ("Source atlas entry missing era: " + $name)
    }
  }
} finally {
  Stop-Job $job -ErrorAction SilentlyContinue | Out-Null
  Remove-Job $job -Force -ErrorAction SilentlyContinue | Out-Null
}

Write-Host ("Source entries: " + ($requiredNames -join ", "))
Write-Host ("Source filters: " + ($themeLabels -join ", ") + " | " + ($eraLabels -join ", "))
Write-Host "Final audit complete."
