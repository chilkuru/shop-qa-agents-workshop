# shop-api-automation

API BDD suite. Gherkin lives in `../shop-qa-orchestrator/contracts/features` — this repo
owns step definitions only.

```
.feature -> steps/*Steps.java -> support/ShopApi -> services/*Api.java -> Rest Assured
```

Steps assert. Services build requests. Neither does the other's job.

## Run

```
mvn -B test
```

Needs the backend on :8081 with `SPRING_PROFILES_ACTIVE=test`.

Override anything by env var: `SHOP_API_BASE_URL`, `TEST_SUPPORT_TOKEN`, `CONTRACTS_DIR`.

## Notes

- Test data comes from `Fixtures`, never from literals.
- Assertions must not assume a clean account; capture a baseline and assert the delta.
- The Allure plugin is registered in `junit-platform.properties`. Moving it to
  `@ConfigurationParameter` silently produces zero test results.
