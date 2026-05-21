$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$zipPath = Join-Path $root "ogrodzenia-do-github.zip"
$tempPath = Join-Path $root ".zip-temp"

if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

if (Test-Path $tempPath) {
  Remove-Item -LiteralPath $tempPath -Recurse -Force
}

New-Item -ItemType Directory -Path $tempPath | Out-Null

$exclude = @(
  "node_modules",
  ".npm-cache",
  ".expo",
  ".expo-home",
  ".expo-export",
  ".expo-export-ios",
  ".appdata",
  ".localappdata",
  ".zip-temp",
  "logs",
  "expo.log",
  "expo.err.log"
)

Get-ChildItem -Path $root -Force | Where-Object {
  $exclude -notcontains $_.Name -and $_.Name -ne "ogrodzenia-do-github.zip"
} | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $tempPath -Recurse -Force
}

Compress-Archive -Path (Join-Path $tempPath "*") -DestinationPath $zipPath -Force
Remove-Item -LiteralPath $tempPath -Recurse -Force

Write-Host "Gotowe: $zipPath"
