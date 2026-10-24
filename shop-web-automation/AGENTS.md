# shop-web-automation

Web BDD suite. `bddgen` generates Playwright specs from the shared `.feature` files, so
the Playwright runner is kept — auto-wait, trace viewer, sharding, retries.

```
.feature -> src/steps/*.steps.ts -> src/pages/*.ts -> Playwright
```

Steps assert. Page objects interact and wait.

## Run

```
npx bddgen && npx playwright test
```

Needs the web app on :5173 and the backend on :8081.

## Notes

- Locators bind to `data-testid` only.
- Dependencies come from Playwright fixtures in `src/fixtures/test.ts`.
- `playwright-bdd` 9.2 pairs with Playwright 1.62; v7 breaks on a moved internal path.
- `missingSteps: 'skip-scenario'` lets reserved coverage gaps skip instead of failing
  generation, and they start running automatically once the steps exist.
- Do not pass `--reporter=` on the CLI; it overrides the config and Allure writes nothing.
