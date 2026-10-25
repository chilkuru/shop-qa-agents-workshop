# Shop QA Workshop

One Gherkin spec, three test frameworks, two languages, orchestrated by a fleet of Copilot agents.

The system under test is a custom shop app (Spring Boot backend, React web app, React Native Android app). It runs locally from this repo, so no public website is needed.

## Layout

| Folder | Role |
|---|---|
| `shop-platform/` | The shop app (backend, web, mobile). **Read-only for agents.** |
| `shop-qa-orchestrator/` | Gherkin contracts, fixtures, coverage matrix, MCP servers, agent definitions, CI |
| `shop-api-automation/` | cucumber-jvm + Rest Assured |
| `shop-web-automation/` | playwright-bdd |
| `shop-mobile-automation/` | cucumber-jvm + Appium |
| `docker-compose.yml`, `docker/` | One-command local stack (Postgres, backend, web) |

Open `shop-qa.code-workspace` in VS Code so all five folders load as one workspace.

## Prerequisites

- Docker Desktop
- JDK 21 and Maven
- Node.js 20+
- VS Code with GitHub Copilot (agent mode)
- Mobile only: Android SDK with an emulator, and Appium 3 with the `uiautomator2` driver

## Get the code

```
git clone https://github.com/chilkuru/shop-qa-agents-workshop.git
cd shop-qa-agents-workshop
```

Run every command in this README from that folder (the repo root).

## One command for everything (Windows)

**Recommended.** This is the preferred way to get started.

```
powershell -ExecutionPolicy Bypass -File shop-qa-orchestrator/scripts/start-env.ps1
```

Use forward slashes as shown; they work in PowerShell, cmd and Git Bash. Backslashes are swallowed by Git Bash.

It starts the Docker stack, installs the npm dependencies for the MCP servers and the web suite if they are missing, seeds the demo users, boots the emulator and Appium, downloads the released APK (checked against a SHA-256) and installs it. It is safe to re-run: anything already healthy is left alone. Options:

| Option | Effect |
|---|---|
| `-SkipMobile` | API and web only: no emulator, Appium or APK |
| `-Avd <name>` | Use a different emulator (default `shop_test`) |
| `-ReinstallApk` | Install the APK even if it is already on the emulator |
| `-Native` | Run backend and web from source instead of Docker (needs JDK 21, Maven, and `npm ci` in `shop-platform/web`) |
| `-BuildApk` | Build the APK with Gradle instead of downloading it |

For mobile it expects `adb` and `appium` on your PATH and an Android Virtual Device named `shop_test` (create a Pixel device in Android Studio's Device Manager, or pass `-Avd`).

The script checks prerequisites first and lists everything that is missing, with where to get it, before starting anything. Docker, `adb`, the emulator, Appium and its `uiautomator2` driver are required (the last four unless you pass `-SkipMobile`). JDK 21, Maven and Node.js 20+ only produce a warning, because they are needed to run the suites rather than to start the stack; with `-Native` they are required.

> **Not using the script?** Skip it and follow [Quick start](#quick-start) below, then continue with the sections after it. Without the script you must seed the demo users, install the MCP server dependencies and set up the mobile environment yourself; the sections below cover each.

## Quick start

Docker stack only, without the script (any OS). Use this if you do not want to run `start-env.ps1`.

```
docker compose up -d --build
```

| Service | URL |
|---|---|
| Web app | http://localhost:5173 |
| Backend API | http://localhost:8081 |
| Backend health | http://localhost:8081/actuator/health |

Seed the demo user (no migration creates it), then sign in with `demo@shop.in` / `Demo@12345`. All test users live in `shop-qa-orchestrator/contracts/fixtures/users.json`.

```
curl -X POST http://localhost:8081/api/test-support/seed-user -H "X-Test-Token: local-test-token" -H "Content-Type: application/json" -d '{"email":"demo@shop.in","password":"Demo@12345","fullName":"Demo Shopper","role":"CUSTOMER"}'
```

Repeat for the other users in that file if you need them (`start-env.ps1` seeds all of them).

Stop with `docker compose down` (add `-v` to wipe the database).

> Every credential in `docker-compose.yml` and `.vscode/mcp.json` is a **demo value for local use only**. Do not reuse them, and do not deploy this stack publicly as-is: the `test` profile exposes seed and reset endpoints guarded only by a shared token.

## Install the MCP servers

`start-env.ps1` does this for you. Otherwise:

```
cd shop-qa-orchestrator/mcp/contract-mcp && npm ci
cd ../shop-app-mcp && npm ci
cd ../android-mcp && npm ci
```

VS Code starts them from `shop-qa-orchestrator/.vscode/mcp.json`.

## Run the suites

```
# API
cd shop-api-automation
mvn -B test

# Web
cd shop-web-automation
npm ci
npx playwright install chromium
npx bddgen && npx playwright test
```

Run a single feature by tag, for example `mvn -B test "-Dcucumber.filter.tags=@api and @ORDERS-01"`. Use the tag for the surface you are running (`@api`, `@web`, `@mobile`); a mismatched tag selects scenarios that have no steps in that suite.

### Mobile

If you ran `start-env.ps1`, the emulator, Appium and APK are ready: skip to step 5. Otherwise:

1. Download `app-release.apk` from this repo's **Releases** page.
2. Start an emulator and wait until it has booted: `adb shell getprop sys.boot_completed` returns `1`.
3. `adb install -r app-release.apk` (package `com.shop.mobile`).
4. Start Appium on port 4723.
5. `cd shop-mobile-automation` then `mvn -B test`.

Use the **release** APK. A debug build renders an empty shell without Metro.

#### Rebuild the APK (optional)

The prebuilt APK is enough for the tests. To rebuild it you need Node.js 20+, a JDK, and the Android SDK (`ANDROID_HOME` set). The native `android/` folder is not in the repo; Expo generates it from `app.json`.

```
cd shop-platform/mobile
npm ci
npx expo prebuild --platform android
cd android
./gradlew assembleRelease        # gradlew.bat on Windows
```

The APK is written to `shop-platform/mobile/android/app/build/outputs/apk/release/app-release.apk`. Install it with `adb install -r`.

The app calls `http://10.0.2.2:8081` by default, which is the emulator's alias for your machine's port 8081, where the Docker stack publishes the backend. To point it elsewhere, set `EXPO_PUBLIC_API_BASE_URL` before running `gradlew`; the value is baked into the bundle at build time.

`shop-qa-orchestrator/scripts/start-env.ps1` is the Windows helper described above; `-Native` makes it start the stack from source instead of Docker.

## Using the agents

Agent definitions are in `shop-qa-orchestrator/.github/agents`. Ask the orchestrator in Copilot chat, for example:

> What are the coverage gaps?

then

> Close the gaps for CHECKOUT-01 on web.

It reads the traceability matrix from the contract MCP server, hands each gap to the web, mobile or API specialist, and records the result with `link_implementation`.

The repo starts with open gaps on purpose: two mobile cart scenarios and the checkout scenarios on web and mobile.

## Ground rules

Working agreements are in `shop-qa-orchestrator/.github/copilot-instructions.md`. In short: Gherkin lives only in `contracts/features`, steps assert and page objects interact, never use fixed waits, and never edit `shop-platform` to make a test pass.
