param(
    [string]$PublisherId = $env:CWS_PUBLISHER_ID,
    [string]$ExtensionId = $env:CWS_EXTENSION_ID,
    [string]$ServiceAccountJsonPath = $env:CWS_SERVICE_ACCOUNT_JSON_PATH,
    [string]$ServiceAccountJson = $env:CWS_SERVICE_ACCOUNT_JSON,
    [string]$ZipPath,
    [switch]$SkipPublish
)

$ErrorActionPreference = "Stop"

function Get-RequiredValue {
    param(
        [string]$Value,
        [string]$Name
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Missing required value: $Name"
    }

    return $Value
}

function Get-Base64UrlValue {
    param(
        [byte[]]$Bytes
    )

    return [Convert]::ToBase64String($Bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function Get-ServiceAccount {
    param(
        [string]$JsonPath,
        [string]$InlineJson
    )

    if (-not [string]::IsNullOrWhiteSpace($InlineJson)) {
        return $InlineJson | ConvertFrom-Json
    }

    if (-not [string]::IsNullOrWhiteSpace($JsonPath)) {
        if (-not (Test-Path $JsonPath)) {
            throw "Service account JSON file not found at $JsonPath"
        }

        return Get-Content $JsonPath -Raw | ConvertFrom-Json
    }

    throw "Provide service account credentials with CWS_SERVICE_ACCOUNT_JSON or CWS_SERVICE_ACCOUNT_JSON_PATH."
}

function New-ServiceAccountAccessToken {
    param(
        [pscustomobject]$ServiceAccount
    )

    $scope = "https://www.googleapis.com/auth/chromewebstore"
    $tokenEndpoint = Get-RequiredValue $ServiceAccount.token_uri "service account token_uri"
    $clientEmail = Get-RequiredValue $ServiceAccount.client_email "service account client_email"
    $privateKey = Get-RequiredValue $ServiceAccount.private_key "service account private_key"

    $issuedAt = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $expiresAt = $issuedAt + 3600

    $headerJson = '{"alg":"RS256","typ":"JWT"}'
    $claimSetJson = @{
        iss = $clientEmail
        scope = $scope
        aud = $tokenEndpoint
        exp = $expiresAt
        iat = $issuedAt
    } | ConvertTo-Json -Compress

    $header = Get-Base64UrlValue ([System.Text.Encoding]::UTF8.GetBytes($headerJson))
    $payload = Get-Base64UrlValue ([System.Text.Encoding]::UTF8.GetBytes($claimSetJson))
    $unsignedJwt = "$header.$payload"

    $rsa = [System.Security.Cryptography.RSA]::Create()

    try {
        if (-not $rsa.GetType().GetMethod("ImportFromPem", [Type[]]@([string]))) {
            throw "This script requires PowerShell 7+ for service-account key import. Run it in pwsh or use the GitHub Actions workflow."
        }

        $rsa.ImportFromPem($privateKey)
        $signatureBytes = $rsa.SignData(
            [System.Text.Encoding]::UTF8.GetBytes($unsignedJwt),
            [System.Security.Cryptography.HashAlgorithmName]::SHA256,
            [System.Security.Cryptography.RSASignaturePadding]::Pkcs1
        )
    }
    finally {
        $rsa.Dispose()
    }

    $signedJwt = "$unsignedJwt.$(Get-Base64UrlValue $signatureBytes)"

    $tokenResponse = Invoke-RestMethod `
        -Method Post `
        -Uri $tokenEndpoint `
        -ContentType "application/x-www-form-urlencoded" `
        -Body @{
            grant_type = "urn:ietf:params:oauth:grant-type:jwt-bearer"
            assertion = $signedJwt
        }

    return Get-RequiredValue $tokenResponse.access_token "access token"
}

function Get-ZipPath {
    param(
        [string]$RequestedZipPath
    )

    if (-not [string]::IsNullOrWhiteSpace($RequestedZipPath)) {
        if (-not (Test-Path $RequestedZipPath)) {
            throw "Zip file not found at $RequestedZipPath"
        }

        return (Resolve-Path $RequestedZipPath).Path
    }

    $scriptDir = Split-Path -Parent $PSCommandPath
    $zipScriptPath = Join-Path $scriptDir "zip-extension.ps1"

    & $zipScriptPath | Out-Null

    $latestZip = Get-ChildItem (Join-Path $scriptDir "..\artifacts\*.zip") |
        Sort-Object LastWriteTimeUtc -Descending |
        Select-Object -First 1

    if (-not $latestZip) {
        throw "No zip archive found in artifacts after packaging."
    }

    return $latestZip.FullName
}

$publisherId = Get-RequiredValue $PublisherId "CWS_PUBLISHER_ID"
$extensionId = Get-RequiredValue $ExtensionId "CWS_EXTENSION_ID"
$serviceAccount = Get-ServiceAccount -JsonPath $ServiceAccountJsonPath -InlineJson $ServiceAccountJson
$resolvedZipPath = Get-ZipPath -RequestedZipPath $ZipPath
$accessToken = New-ServiceAccountAccessToken -ServiceAccount $serviceAccount

$headers = @{
    Authorization = "Bearer $accessToken"
}

$uploadUri = "https://chromewebstore.googleapis.com/upload/v2/publishers/$publisherId/items/$extensionId`:upload"
$publishUri = "https://chromewebstore.googleapis.com/v2/publishers/$publisherId/items/$extensionId`:publish"
$statusUri = "https://chromewebstore.googleapis.com/v2/publishers/$publisherId/items/$extensionId`:fetchStatus"

Write-Host "Uploading $resolvedZipPath"
$uploadResponse = Invoke-RestMethod `
    -Method Post `
    -Uri $uploadUri `
    -Headers $headers `
    -InFile $resolvedZipPath `
    -ContentType "application/zip"

Write-Host "Upload response:"
$uploadResponse | ConvertTo-Json -Depth 10

if (-not $SkipPublish) {
    Write-Host "Submitting item for review"
    $publishResponse = Invoke-RestMethod `
        -Method Post `
        -Uri $publishUri `
        -Headers $headers

    Write-Host "Publish response:"
    $publishResponse | ConvertTo-Json -Depth 10
}

Write-Host "Fetching latest item status"
$statusResponse = Invoke-RestMethod `
    -Method Get `
    -Uri $statusUri `
    -Headers $headers

Write-Host "Status response:"
$statusResponse | ConvertTo-Json -Depth 10

