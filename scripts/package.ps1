# Builds the client-ready zip.
#
# PowerShell 5.1's Compress-Archive writes Windows path separators into the
# entry names, which breaks extraction on Linux and macOS. This walks the tree
# and writes each entry by hand with forward slashes instead.

param(
  [string]$Out = "..\Strivers Hub - production bundle.zip"
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = (Resolve-Path ".").Path
$outPath = [System.IO.Path]::GetFullPath((Join-Path $root $Out))
if (Test-Path $outPath) { Remove-Item $outPath -Force }

$skipDirs = @('node_modules', '.next', '.git', '.vercel', 'out', '.turbo', '.claude')
# AGENTS.md and CLAUDE.md are written by tooling, not by this project
$skipFiles = @('.env', 'next-env.d.ts', 'tsconfig.tsbuildinfo',
               'AGENTS.md', 'CLAUDE.md',
               # public/wireframes.html is the wireframe deliverable, kept at
               # its old address on the preview host so the link we already
               # sent still resolves. It is not part of the platform and has
               # no business being served from strivershub.com.
               'wireframes.html')

# Any .env*.local holds this machine's secrets - the Sanity write token, the
# auth signing key - and must never reach the client. Matched by pattern, not
# by name, so a new one (.env.production.local, say) is covered the day it is
# created rather than the day somebody remembers to add it here.
$files = Get-ChildItem -Path $root -Recurse -File | Where-Object {
  $rel = $_.FullName.Substring($root.Length + 1)
  $parts = $rel -split '\\'
  (-not ($parts | Where-Object { $skipDirs -contains $_ })) -and
  ($skipFiles -notcontains $_.Name) -and
  ($_.Name -notlike '.env*.local') -and
  ($_.Name -notlike '*.tsbuildinfo')
}

$zip = [System.IO.Compression.ZipFile]::Open($outPath, 'Create')
try {
  foreach ($f in $files) {
    $rel = $f.FullName.Substring($root.Length + 1).Replace('\', '/')
    $entry = "strivers-hub/$rel"
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip, $f.FullName, $entry, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally {
  $zip.Dispose()
}

$size = (Get-Item $outPath).Length / 1MB
Write-Output ("{0} files -> {1} ({2:N2} MB)" -f $files.Count, $outPath, $size)
