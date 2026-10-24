$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$toolDir = Join-Path $projectRoot '.tools/pnpm'
New-Item -ItemType Directory -Path $toolDir -Force | Out-Null
$archive = Join-Path $projectRoot '.tools/pnpm.tgz'
Invoke-WebRequest 'https://registry.npmjs.org/pnpm/-/pnpm-12.15.0.tgz' -OutFile $archive
tar -xzf $archive -C $toolDir --strip-components=1
if ($LASTEXITCODE -ne 0) { throw 'pnpm 解压失败' }
& (Join-Path $PSScriptRoot 'pnpm.ps1') install
