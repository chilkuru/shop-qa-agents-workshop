# Merges Allure results from all three surfaces into one report.
# The whole point: 3 frameworks, 2 languages, 1 report.
param(
    [string]$ShopRoot = 'C:\code\Shop',
    [switch]$Open
)

$ErrorActionPreference = 'Stop'

$merged = Join-Path $ShopRoot 'shop-qa-orchestrator\reports\allure-results'
$report = Join-Path $ShopRoot 'shop-qa-orchestrator\reports\allure-report'

$sources = @(
    @{ Name = 'api'; Path = Join-Path $ShopRoot 'shop-api-automation\target\allure-results' },
    @{ Name = 'web'; Path = Join-Path $ShopRoot 'shop-web-automation\allure-results' },
    @{ Name = 'mobile'; Path = Join-Path $ShopRoot 'shop-mobile-automation\target\allure-results' }
)

Remove-Item $merged -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $merged | Out-Null

foreach ($source in $sources) {
    if (-not (Test-Path $source.Path)) {
        Write-Output ("  {0,-7} SKIPPED (no results at {1})" -f $source.Name, $source.Path)
        continue
    }
    $files = Get-ChildItem $source.Path -File
    foreach ($file in $files) {
        # Prefix avoids uuid collisions between independently generated result sets.
        Copy-Item $file.FullName (Join-Path $merged "$($source.Name)-$($file.Name)")
    }
    $results = ($files | Where-Object { $_.Name -like '*result.json' }).Count
    Write-Output ("  {0,-7} {1} files ({2} test results)" -f $source.Name, $files.Count, $results)
}

# Surfaces the run environment on the report's front page.
@"
Surfaces=api, web, mobile
API.Framework=cucumber-jvm + Rest Assured
Web.Framework=playwright-bdd
Mobile.Framework=cucumber-jvm + Appium
Contracts=shop-qa-orchestrator/contracts/features
"@ | Set-Content (Join-Path $merged 'environment.properties') -Encoding ascii

$allure = Get-Command allure -ErrorAction SilentlyContinue
if (-not $allure) {
    Write-Output ''
    Write-Output "Merged into: $merged"
    Write-Output 'Allure CLI not found. Install with: npm i -g allure-commandline'
    exit 0
}

& allure generate $merged --clean -o $report
Write-Output ''
Write-Output "Report: $report"
if ($Open) { & allure open $report }
