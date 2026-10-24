# Shop QA — working agreements

These rules apply to every automation repo in this workspace. They are not style
preferences; violating them breaks the architecture the workshop demonstrates.

## The one sentence
One Gherkin spec, three frameworks, two languages, orchestrated by a fleet of agents.

## Repository roles

| Repo | Role | Agent access |
|---|---|---|
| `shop-platform` | System under test (backend, web, mobile) | **READ-ONLY** |
| `shop-qa-orchestrator` | Contracts, MCP servers, agents, CI | read/write |
| `shop-api-automation` | cucumber-jvm + Rest Assured | read/write |
| `shop-web-automation` | playwright-bdd | read/write |
| `shop-mobile-automation` | cucumber-jvm + Appium | read/write |

**Never edit `shop-platform` to make a test pass.** If a test fails because the app is
wrong, report it — do not work around it and do not "fix" the app.

## The contract layer is the single source of truth

- Feature files live ONLY in `shop-qa-orchestrator/contracts/features`.
  Never copy a `.feature` into a framework repo.
- Test data lives ONLY in `contracts/fixtures/*.json`. Never hardcode an email,
  password, price or card number in a step definition.
- `contracts/coverage/coverage.yaml` is generated. Never hand-edit it; call
  `link_implementation` on the contract MCP instead.

### Gherkin rules
- Steps must be **behavioural, not mechanical**.
  - Good: `When I apply coupon "SAVE10"`
  - Bad: `When I POST to /api/cart/coupon with body {...}`
- **Step text must be globally unique.** Cucumber matches on text alone and ignores the
  Given/Then keyword, so a phrase cannot be both a precondition and an assertion.
  Use distinct wording: `Given my cart is empty` vs `Then my cart is now empty`.
- A surface tag (`@api`, `@web`, `@mobile`) declares intent to cover. An untagged
  surface reports `n/a`; a tagged-but-unlinked surface reports `gap`.

## Layering (strict)

```
.feature -> Step Definitions -> Page/Screen/Service Objects -> Driver/Utils
```

- Step definitions: assertions ONLY. No locators, no raw driver calls, no HTTP paths.
- Page/Screen/Service objects: interactions and waits ONLY. **No assertions.**
- Cross-cutting setup goes through the `ShopApi` facade, never inline.

## Design patterns expected

Page/Screen/Service Object · Component Object · Factory · ThreadLocal singleton for
drivers · Builder for requests and test data · Template Method in base hooks ·
Strategy for waits and reporting · Facade (`ShopApi`) · Dependency Injection
(PicoContainer for Java, Playwright fixtures for TypeScript) · Repository (fixture loader).

## SOLID enforcement

| Principle | What it means here |
|---|---|
| S | One class per page/screen/resource. Step defs hold no locators. |
| O | A new scenario should need a NEW step method, not edits to existing files. |
| L | Concrete pages usable through their abstract base. |
| I | Small interfaces: seedable, report publisher, test-management client. |
| D | Step defs depend on abstractions; the DI container wires implementations. |

## Rejected outright

- Locators inline in step definitions
- `Thread.sleep`, `waitForTimeout`, or any fixed-duration wait
- Assertions inside page/screen objects
- Static mutable state shared across scenarios
- Duplicated locators
- Mechanical Gherkin
- God utility classes
- Editing the app to make a test pass

## Waiting

Always wait for a **condition**, never a duration. After an action that triggers a
network call, wait for the resulting UI state before asserting or acting again.
Rapid successive clicks against a re-rendering list must wait for each intermediate
state, or the second click is sent against stale data.

## Reporting

Allure everywhere. Failure evidence is attached by hooks through a publisher, never by
step definitions calling the reporter directly.

| Surface | Must attach on failure |
|---|---|
| api | full request/response dump |
| web | screenshot + Playwright trace |
| mobile | screenshot + page source + logcat tail |

## Definition of done for a scenario

1. Step definitions written in the correct layer.
2. Suite run locally and green.
3. `link_implementation` called on the contract MCP.
4. `get_coverage_matrix` shows the cell as `covered`.
