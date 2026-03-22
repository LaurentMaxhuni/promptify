param(
    [string]$ExtensionDir = (Join-Path $PSScriptRoot "..\extension"),
    [string]$OutputDir = (Join-Path $PSScriptRoot "..\artifacts")
)

$ErrorActionPreference = "Stop"

$resolvedExtensionDir = (Resolve-Path $ExtensionDir).Path
$manifestPath = Join-Path $resolvedExtensionDir "manifest.json"

if (-not (Test-Path $manifestPath)) {
    throw "Could not find manifest.json at $manifestPath"
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$extensionName = if ([string]::IsNullOrWhiteSpace($manifest.name)) { "extension" } else { $manifest.name }
$version = if ([string]::IsNullOrWhiteSpace($manifest.version)) { "0.0.0" } else { $manifest.version }
$slug = (($extensionName -replace "[^A-Za-z0-9._-]+", "-").Trim("-")).ToLowerInvariant()

if ([string]::IsNullOrWhiteSpace($slug)) {
    $slug = "extension"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$resolvedOutputDir = (Resolve-Path $OutputDir).Path
$archivePath = Join-Path $resolvedOutputDir "$slug-v$version.zip"
$stagingDir = Join-Path ([System.IO.Path]::GetTempPath()) ("promptify-package-" + [System.Guid]::NewGuid().ToString("N"))

New-Item -ItemType Directory -Force -Path $stagingDir | Out-Null

try {
    Copy-Item -Path (Join-Path $resolvedExtensionDir "*") -Destination $stagingDir -Recurse -Force

    if (Test-Path $archivePath) {
        Remove-Item $archivePath -Force
    }

    Compress-Archive -Path (Join-Path $stagingDir "*") -DestinationPath $archivePath -CompressionLevel Optimal
    Write-Host "Created $archivePath"
}
finally {
    Remove-Item $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
}
