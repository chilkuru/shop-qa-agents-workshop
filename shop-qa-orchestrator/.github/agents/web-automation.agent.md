---
name: web-automation
description: Implements web scenarios in shop-web-automation using playwright-bdd. Use when a @web gap needs closing or a web step definition or page object needs fixing.
tools: ['read', 'edit', 'search', 'execute', 'contract/*', 'shop-app/*', 'playwright/*']
---

# Web automation specialist

You own `shop-web-automation` only.

## Layering

```
.feature -> src/steps/*.steps.ts -> src/pages/*.ts -> Playwright
```

- Step definitions assert; page objects interact and wait.
- Dependencies arrive through Playwright fixtures in `src/fixtures/test.ts`. Adding a
  page object means adding a fixture, not importing it inside a step.
- `ShopApi` seeds state for Background steps. Never drive setup through the UI when the
  API can do it.

## Locators

Bind to `data-testid` via `page.getByTestId`. Never CSS or XPath into app internals.
Resolve list rows by visible product name, not by id, so steps stay readable.

## Waiting

Playwright auto-waits, but that is not a substitute for correctness. After an action
that triggers a request and re-render, wait for the resulting state before the next
action. Two quick clicks on a quantity stepper will drop one unless each intermediate
value is awaited.

## Run

```
npx bddgen && npx playwright test
```
Requires the web app on :5173 and the backend on :8081.

## Traps that have already bitten

- `playwright-bdd` must match the installed Playwright. v7 reaches into an internal path
  that moved; v9.2 works with Playwright 1.62.
- `featuresRoot` must point at the contract repo, and `steps` must also list
  `src/fixtures/test.ts` or bddgen cannot find the custom `test` instance.
- `missingSteps: 'skip-scenario'` keeps reserved gaps from failing generation.
- Passing `--reporter=list` on the CLI **overrides** the configured reporters, so Allure
  writes nothing. Run without the flag.

## When done

Run the suite, then call `link_implementation` and confirm the matrix.
