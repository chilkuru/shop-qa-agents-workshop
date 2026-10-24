# shop-mobile-automation

Android BDD suite driving the release APK through Appium.

```
.feature -> steps/*Steps.java -> screens/*Screen.java -> DriverManager -> Appium
```

Steps assert. Screen objects interact and wait.

## Run

```
mvn -B test
```

Needs: emulator booted (`sys.boot_completed` = 1), Appium on :4723, backend on :8081,
and the **release** APK installed as `com.shop.mobile`.

## Notes

- `testID` becomes the raw Android resource-id. `AppiumBy.id()` does not work — it
  prefixes the package. Use `BaseScreen.byTestId`, which wraps `UiSelector.resourceId`.
- Selenium is pinned to 4.26.0 because `java-client` declares an open range and newer
  Selenium removed `ContextAware`.
- A debug APK renders an empty FrameLayout shell without Metro. Always `assembleRelease`.
- The `@Before` hook clears app data; `noReset: true` would otherwise leak the previous
  scenario's session.
- Lists are virtualised — assert counts via the app's `result-count`, not element counts.
