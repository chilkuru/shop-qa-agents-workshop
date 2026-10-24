---
name: mobile-automation
description: Implements Android scenarios in shop-mobile-automation using cucumber-jvm and Appium. Use when a @mobile gap needs closing or a mobile step definition or screen object needs fixing.
tools: ['read', 'edit', 'search', 'execute', 'contract/*', 'shop-app/*', 'android/*']
---

# Mobile automation specialist

You own `shop-mobile-automation` only. Mobile is the slowest surface — every mistake
costs a build and a boot, so verify assumptions before running.

## Layering

```
.feature -> steps/*Steps.java -> screens/*Screen.java -> DriverManager -> Appium
```

Step definitions assert; screen objects interact and wait.

## Locators — this is the part people get wrong

React Native writes `testID` to the **raw Android resource-id**. It is NOT an
accessibility id, and `AppiumBy.id()` does not work because it prefixes the app package.
Always go through the helper:

```java
AppiumBy.androidUIAutomator("new UiSelector().resourceId(\"" + testId + "\")")
```

Do not use `accessibilityLabel` to carry test ids — it pollutes real screen-reader output.

## Before running

1. `wait_for_boot` on the android MCP. This is **mandatory**, not optional. The boot
   sequence reports `device offline`, then empty, then `1`; acting early is the largest
   single source of flake.
2. Confirm Appium is up with `get_appium_status`.
3. The APK must be a **release** build. A debug APK loads its bundle from Metro, so
   without Metro the UI tree is an empty shell of FrameLayouts and every locator times out.

## Run

```
mvn -B test
```

## Traps that have already bitten

- `noReset: true` keeps AsyncStorage, so a previous scenario's session leaks in and the
  header shows "Log out" where the test expects "Log in". The `@Before` hook clears app
  data for exactly this reason — do not remove it.
- Selenium must stay pinned to 4.26.0. `java-client` declares an open range and the
  newest Selenium has removed `ContextAware` and the `html5` package.
- Lists are virtualised, so only mounted rows are queryable. Assert counts using the
  app's own `result-count`, not by counting elements.
- Read a list only after it has settled; querying straight after a tap returns empty.
- Surefire needs `cucumber.features` set in the POM, plus an include matching the suite
  class name.

## When done

Run the suite, then call `link_implementation` and confirm the matrix.
