# Brings up everything the three suites need. Safe to re-run: anything already healthy is left alone.
# Default: the Docker stack (backend + web + Postgres) from the repo-root docker-compose.yml, and the
# released APK downloaded from GitHub. Windows only.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\start-env.ps1 [-SkipMobile] [-Native] [-BuildApk] [-ReinstallApk] [-Avd <name>]
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

function Assert-Command($name, $hint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { throw "$name not found on PATH. $hint" }
}

Write-Host "Shop environment ($ShopRoot)" -ForegroundColor Cyan

try {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Docker is not reachable. Start Docker Desktop and re-run.' }

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

    if (-not $SkipMobile) {
        Assert-Command 'adb' 'Install the Android SDK platform-tools and add them to PATH.'
        Assert-Command 'appium' 'Install with: npm i -g appium ; appium driver install uiautomator2'
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
