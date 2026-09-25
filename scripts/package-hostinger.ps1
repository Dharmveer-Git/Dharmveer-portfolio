$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$archivePath = Join-Path (Split-Path $projectRoot -Parent) 'portfolio-hostinger-ready.zip'

Push-Location $projectRoot
try {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Build failed; archive was not updated.' }

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $rootFiles = @('package.json', 'package-lock.json', 'server.js', '.env.example', 'HOSTINGER_DEPLOY.md')
    $files = @($rootFiles | ForEach-Object { Get-Item -LiteralPath $_ })
    $files += @(Get-ChildItem -LiteralPath client, server, scripts -Recurse -File | Where-Object {
        $_.FullName -notmatch '[\\/](node_modules|\.git|data)[\\/]' -and
        ($_.Name -notlike '.env*' -or $_.Name -eq '.env.example') -and
        $_.Extension -ne '.log'
    })
    $stream = [System.IO.File]::Open($archivePath, [System.IO.FileMode]::Create)
    $zip = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($file in $files) {
            $relative = $file.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relative) | Out-Null
        }
    } finally { $zip.Dispose(); $stream.Dispose() }

    $check = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
    try {
        foreach ($required in @('package.json', 'package-lock.json', 'server.js', 'client/index.html', 'client/dist/index.html', 'server/app.js')) {
            if (-not $check.GetEntry($required)) { throw "Archive missing required file: $required" }
        }
        if ($check.Entries.FullName -match '(^|/)\.env$|(^|/)node_modules/|(^|/)\.git/') {
            throw 'Archive contains an excluded private or generated directory.'
        }
        Write-Output "Verified $($check.Entries.Count) archive entries; package.json is at archive root."
    } finally { $check.Dispose() }
    Write-Output "Ready to upload: $archivePath"
} finally { Pop-Location }
