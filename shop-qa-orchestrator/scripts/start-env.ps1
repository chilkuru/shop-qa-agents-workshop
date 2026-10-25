# Brings up everything the three suites need. Safe to re-run: anything already healthy is left alone.
# Default: the Docker stack (backend + web + Postgres) from the repo-root docker-compose.yml, and the
# released APK downloaded from GitHub. Windows only.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/start-env.ps1 [-SkipMobile] [-Native] [-BuildApk] [-ReinstallApk] [-Avd <name>]
#   -SkipMobile    API and web only: no emulator, Appium or APK.
#   -Native        Run backend and web app from source (needs JDK 21, Maven, Node, `npm ci` in shop-platform/web).
#   -BuildApk      Build the APK with Gradle instead of downloading it (needs the generated android/ folder).
#   -ReinstallApk  Install the APK even if com.shop.mobile is already on the emulator.
param(
    [string]$ShopRoot = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent),
    [string]$Avd = 'shop_test',
    [switch]$SkipMobile,
    [switch]$Native,
    [switch]$BuildApk,
    [switch]$ReinstallApk,
    [string]$ApkUrl = 'https://github.com/chilkuru/shop-qa-agents-workshop/releases/download/v1/app-release.apk',
    [string]$ApkSha256 = '4B78131C227E7ABA1F266684C2AA51747C975ED44D6106581F3D99C077668E83',
    [int]$TimeoutSec = 240
)

$platform = Join-Path $ShopRoot 'shop-platform'
$backendUrl = 'http://localhost:8081/actuator/health'
$webUrl = 'http://localhost:5173'
$appiumUrl = 'http://127.0.0.1:4723/status'
$builtApk = Join-Path $platform 'mobile\android\app\build\outputs\apk\release\app-release.apk'
$downloadedApk = Join-Path $ShopRoot 'downloads\app-release.apk'

function Write-Step($name, $state, $color = 'Gray') { Write-Host ("  {0,-10} {1}" -f $name, $state) -ForegroundColor $color }

function Test-Http($url) {
    try { (Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200 } catch { $false }
}

function Wait-Until($name, [scriptblock]$condition) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while (-not (& $condition)) {
        if ((Get-Date) -gt $deadline) { throw "$name did not become ready within $TimeoutSec s" }
        Start-Sleep -Seconds 2
    }
}

# Opens a titled PowerShell window so each long-running process keeps its own visible log.
function Start-ServiceWindow($title, $dir, $command) {
    $script = "`$host.UI.RawUI.WindowTitle = '$title'; Set-Location '$dir'; $command"
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
    Start-Process powershell -ArgumentList "-NoExit -ExecutionPolicy Bypass -EncodedCommand $encoded"
}

function Get-EmulatorSerial {
    (adb devices) -match '^emulator-\d+\s+device$' | ForEach-Object { ($_ -split '\s+')[0] } | Select-Object -First 1
}

function Get-EmulatorExe {
    $cmd = Get-Command emulator -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    foreach ($sdk in @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, "$env:LOCALAPPDATA\Android\Sdk")) {
        if ($sdk -and (Test-Path "$sdk\emulator\emulator.exe")) { return "$sdk\emulator\emulator.exe" }
    }
    throw 'emulator.exe not found; add the Android SDK emulator folder to PATH or set ANDROID_HOME'
}

# Users are not seeded by any migration, so upsert them from the contract fixtures on every start.
function Initialize-Users {
    $token = if ($env:TEST_SUPPORT_TOKEN) { $env:TEST_SUPPORT_TOKEN } else { 'local-test-token' }
    $fixture = Join-Path $PSScriptRoot '..\contracts\fixtures\users.json'
    $users = (Get-Content $fixture -Raw | ConvertFrom-Json).users.PSObject.Properties.Value
    foreach ($u in $users) {
        $body = @{ email = $u.email; password = $u.password; fullName = $u.fullName; role = $u.role } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri 'http://localhost:8081/api/test-support/seed-user' -Headers @{ 'X-Test-Token' = $token } -ContentType 'application/json' -Body $body | Out-Null
    }
    Write-Step 'Users' "seeded $(@($users).Count) fixture users" Green
}

function Test-Command($name) { [bool](Get-Command $name -ErrorAction SilentlyContinue) }

# java and appium write version text to stderr, so run them through cmd to capture it.
function Get-MajorVersion($commandLine) {
    $text = (cmd /c "$commandLine 2>&1" | Select-Object -First 1) -join ''
    if ($text -match '(\d+)(\.\d+)*') { [int]$Matches[1] } else { 0 }
}

# Reports every missing prerequisite at once, with where to get it, instead of failing on the first.
function Test-Prerequisites {
    $missing = New-Object System.Collections.Generic.List[string]
    $warnings = New-Object System.Collections.Generic.List[string]
    # JDK, Maven and Node are only needed to start the stack with -Native; otherwise they are for running the suites.
    $toolBucket = $warnings
    if ($Native) { $toolBucket = $missing }

    if (-not (Test-Command 'docker')) {
        $missing.Add('Docker Desktop not found. Install it from https://www.docker.com/products/docker-desktop/ and start it.')
    } else {
        docker info *> $null
        if ($LASTEXITCODE -ne 0) { $missing.Add('Docker Desktop is installed but not running. Start it, wait until it reports running, and re-run.') }
    }

    if (-not (Test-Command 'java')) {
        $toolBucket.Add('JDK 21 not found (needed to run the API and mobile suites). Install Temurin 21 from https://adoptium.net and make sure java is on PATH.')
    } elseif ((Get-MajorVersion 'java -version') -lt 21) {
        $toolBucket.Add("JDK 21 is required but java reports version $(Get-MajorVersion 'java -version'). Install Temurin 21 and put it first on PATH.")
    }
    if (-not (Test-Command 'mvn')) {
        $toolBucket.Add('Maven not found (needed to run the API and mobile suites). Install it from https://maven.apache.org/download.cgi and add its bin folder to PATH.')
    }
    if (-not (Test-Command 'node')) {
        $toolBucket.Add('Node.js 20+ not found (needed for the web suite and the MCP servers). Install it from https://nodejs.org.')
    } elseif ((Get-MajorVersion 'node --version') -lt 20) {
        $toolBucket.Add("Node.js 20 or newer is required but node reports version $(Get-MajorVersion 'node --version'). Upgrade from https://nodejs.org.")
    }

    if (-not $SkipMobile) {
        $hasAdb = Test-Command 'adb'
        if (-not $hasAdb) { $missing.Add('adb not found. Install Android SDK platform-tools (Android Studio > SDK Manager) and add them to PATH.') }

        try {
            $emulatorExe = Get-EmulatorExe
            $emulatorRunning = $hasAdb -and (Get-EmulatorSerial)
            if (-not $emulatorRunning) {
                $avds = @(& $emulatorExe -list-avds)
                if ($avds -notcontains $Avd) {
                    $found = if ($avds.Count) { $avds -join ', ' } else { 'none' }
                    $missing.Add("Android emulator '$Avd' not found (available: $found). Create a Pixel device named $Avd in Android Studio's Device Manager, or pass -Avd <name>.")
                }
            }
        } catch {
            $missing.Add('Android emulator not found. Install the Emulator in Android Studio > SDK Manager, then add its folder to PATH or set ANDROID_HOME.')
        }

        if (-not (Test-Command 'appium')) {
            $missing.Add('Appium not found. Install it with: npm i -g appium')
        } else {
            if ((Get-MajorVersion 'appium --version') -lt 3) { $warnings.Add('Appium 3 is recommended; update with: npm i -g appium') }
            if (-not ((cmd /c 'appium driver list --installed 2>&1') -match 'uiautomator2')) {
                $missing.Add('Appium uiautomator2 driver not installed. Install it with: appium driver install uiautomator2')
            }
        }
    }

    foreach ($warning in $warnings) { Write-Host "  WARNING    $warning" -ForegroundColor Yellow }
    if ($missing.Count) {
        throw ("Missing prerequisites:`n  - " + ($missing -join "`n  - ") + "`nInstall them and re-run this script.")
    }
    Write-Step 'Checks' 'prerequisites present' Green
}

Write-Host "Shop environment ($ShopRoot)" -ForegroundColor Cyan

try {
    Test-Prerequisites

    if (-not $Native) {
        # Backend + web + Postgres in containers; the first run builds the images, which takes a few minutes.
        if ((Test-Http $backendUrl) -and (Test-Http $webUrl)) {
            Write-Step 'Stack' 'already running (backend :8081, web :5173)' Green
        } else {
            Write-Step 'Stack' 'docker compose up -d --build ...'
            Push-Location $ShopRoot
            docker compose up -d --build
            $composeExit = $LASTEXITCODE
            Pop-Location
            if ($composeExit -ne 0) { throw 'docker compose failed (see output above). Is something else using port 8081 or 5173?' }
            Wait-Until 'Backend' { Test-Http $backendUrl }
            Write-Step 'Backend' 'up on :8081' Green
            Wait-Until 'Web app' { Test-Http $webUrl }
            Write-Step 'Web app' 'up on :5173' Green
        }
    } else {
        # Only Postgres in Docker; backend and web run from source in their own windows.
        Push-Location $platform
        docker compose up -d postgres *> $null
        Pop-Location
        Wait-Until 'Postgres' { (docker inspect -f '{{.State.Health.Status}}' shop-postgres 2>$null) -eq 'healthy' }
        Write-Step 'Postgres' 'healthy' Green

        if (Test-Http $backendUrl) {
            Write-Step 'Backend' 'already running on :8081' Green
        } else {
            Write-Step 'Backend' 'starting...'
            Start-ServiceWindow 'Shop backend :8081' "$platform\backend" '$env:SPRING_PROFILES_ACTIVE = ''test''; mvn spring-boot:run'
            Wait-Until 'Backend' { Test-Http $backendUrl }
            Write-Step 'Backend' 'up on :8081' Green
        }

        if (Test-Http $webUrl) {
            Write-Step 'Web app' 'already running on :5173' Green
        } else {
            Write-Step 'Web app' 'starting...'
            Start-ServiceWindow 'Shop web :5173' "$platform\web" '$env:VITE_API_BASE_URL = ''http://localhost:8081''; npx vite dev --port 5173'
            Wait-Until 'Web app' { Test-Http $webUrl }
            Write-Step 'Web app' 'up on :5173' Green
        }
    }

    Initialize-Users

    if (-not $SkipMobile) {
        # Emulator: host keyboard enabled in the AVD config so you can type from the PC keyboard.
        $avdConfig = Join-Path $env:USERPROFILE ".android\avd\$Avd.avd\config.ini"
        $keyboardChanged = $false
        if ((Test-Path $avdConfig) -and (Select-String -Path $avdConfig -Pattern '^hw.keyboard\s*=\s*no' -Quiet)) {
            (Get-Content $avdConfig) -replace '^hw.keyboard\s*=\s*no', 'hw.keyboard = yes' | Set-Content $avdConfig
            $keyboardChanged = $true
        }

        if (Get-EmulatorSerial) {
            Write-Step 'Emulator' 'already running' Green
            if ($keyboardChanged) { Write-Step 'Emulator' 'hw.keyboard enabled - cold boot (adb emu kill, then re-run) to apply' Yellow }
        } else {
            $emulatorExe = Get-EmulatorExe
            $avds = @(& $emulatorExe -list-avds)
            if ($avds -notcontains $Avd) {
                throw "AVD '$Avd' not found (available: $($avds -join ', ')). Create a Pixel AVD named $Avd in Android Studio's Device Manager, or pass -Avd <name>."
            }
            Write-Step 'Emulator' "starting $Avd..."
            Start-Process $emulatorExe -ArgumentList "-avd $Avd -no-boot-anim -gpu swiftshader_indirect" -WindowStyle Minimized
            Wait-Until 'Emulator' { [bool](Get-EmulatorSerial) }
        }
        Wait-Until 'Emulator boot' { (adb shell getprop sys.boot_completed 2>$null) -match '1' }
        # Stops Gboard showing the stylus toolbar instead of the keyboard when clicking with a mouse.
        adb shell settings put secure stylus_handwriting_enabled 0
        Write-Step 'Emulator' "booted ($(Get-EmulatorSerial))" Green

        # Appium
        if (Test-Http $appiumUrl) {
            Write-Step 'Appium' 'already running on :4723' Green
        } else {
            Write-Step 'Appium' 'starting...'
            Start-ServiceWindow 'Appium :4723' $ShopRoot 'appium --port 4723'
            Wait-Until 'Appium' { Test-Http $appiumUrl }
            Write-Step 'Appium' 'up on :4723' Green
        }

        # Release APK: a local Gradle build if there is one, otherwise the published release asset.
        if ($BuildApk) {
            if (-not (Test-Path "$platform\mobile\android")) {
                throw 'shop-platform/mobile/android is not in the repo. Run `npx expo prebuild --platform android` in shop-platform/mobile first (see README), or drop -BuildApk to download the released APK.'
            }
            Write-Step 'APK' 'building release...'
            Push-Location "$platform\mobile\android"
            $previousNodeEnv = $env:NODE_ENV
            $env:NODE_ENV = 'production'
            .\gradlew.bat assembleRelease
            $gradleExit = $LASTEXITCODE
            $env:NODE_ENV = $previousNodeEnv
            Pop-Location
            if ($gradleExit -ne 0) { throw 'APK build failed (see Gradle output above)' }
            $apk = $builtApk
        } elseif (Test-Path $builtApk) {
            $apk = $builtApk
        } else {
            $apk = $downloadedApk
            if (-not (Test-Path $apk)) {
                Write-Step 'APK' 'downloading release...'
                New-Item -ItemType Directory -Force -Path (Split-Path $apk) | Out-Null
                Invoke-WebRequest -UseBasicParsing -Uri $ApkUrl -OutFile $apk
            }
            if ((Get-FileHash $apk -Algorithm SHA256).Hash -ne $ApkSha256) {
                Remove-Item $apk -Force
                throw 'Downloaded APK failed its SHA-256 check and was deleted. Re-run, or pass -ApkSha256 if you published a new release.'
            }
        }
        Write-Step 'APK' "ready ($apk)" Green

        $installed = [bool](adb shell pm list packages com.shop.mobile 2>$null | Select-String 'package:com.shop.mobile\s*$')
        if ($ReinstallApk -or -not $installed) {
            Write-Step 'APK' 'installing on the emulator...'
            adb install -r $apk
            if ($LASTEXITCODE -ne 0) { throw 'adb install failed (see output above)' }
        }
        Write-Step 'APK' 'com.shop.mobile installed' Green
    }

    Write-Host "`nReady. Web app: $webUrl   Swagger: http://localhost:8081/swagger-ui.html" -ForegroundColor Cyan
} catch {
    Write-Host "`nFAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
