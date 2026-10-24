[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$candidates = @($env:DASHBOARD_NODE)
if ($env:NVM_HOME) { $candidates += Join-Path $env:NVM_HOME 'v24.19.0/node.exe' }
$candidates += Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
$candidates += (Get-Command node -ErrorAction SilentlyContinue).Source
$runtime = $null
foreach ($candidate in $candidates) {
  if ($candidate -and (Test-Path -LiteralPath $candidate)) {
    $version = & $candidate -p 'process.versions.node'
    if ($version -match '^24\.' -or $version -match '^(2[6-9]|[3-9][0-9])\.') { $runtime = $candidate; break }
  }
}
if (-not $runtime) { throw '需要 Node 24.11+（24 LTS）或 26+。可通过 DASHBOARD_NODE 指定 node.exe。' }
$pnpmEntry = Join-Path $projectRoot '.tools/pnpm/bin/pnpm.mjs'
if (-not (Test-Path -LiteralPath $pnpmEntry)) { throw '请先运行 scripts/bootstrap.ps1 安装项目内 pnpm。' }
$env:PATH = (Split-Path $runtime -Parent) + [IO.Path]::PathSeparator + $env:PATH
$env:pnpm_config_manage_package_manager_versions = 'false'
Push-Location $projectRoot
try { & $runtime $pnpmEntry @args; exit $LASTEXITCODE } finally { Pop-Location }
