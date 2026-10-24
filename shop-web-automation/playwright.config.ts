import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const WEB_BASE_URL = process.env.WEB_BASE_URL ?? 'http://localhost:5173';

// bddgen turns the shared .feature files into Playwright specs, so the Playwright
// runner (auto-wait, trace viewer, sharding, retries) is kept rather than replaced.
// featuresRoot must cover the contract repo, which lives outside this package.
const testDir = defineBddConfig({
  featuresRoot: '../shop-qa-orchestrator/contracts/features',
  features: '../shop-qa-orchestrator/contracts/features/*.feature',
  // The fixtures file must be listed too, or bddgen cannot find the custom `test` instance.
  steps: ['src/steps/**/*.ts', 'src/fixtures/test.ts'],
  outputDir: '.features-gen',
  tags: '@web',
  // CHECKOUT-01 is a reserved coverage gap: tagged @web, deliberately unimplemented.
  // Skipping keeps generation green, and the scenarios start running the moment an
  // agent adds the steps — no config change needed.
  missingSteps: 'skip-scenario',
});

export default defineConfig({
  testDir,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Scenarios share the seeded demo account, so parallel workers would interleave
  // cart and order state for the same user. The suite is short; serialising is cheaper
  // than per-worker accounts.
  workers: 1,
  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: 'allure-results', detail: false }],
  ],
  use: {
    baseURL: WEB_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
