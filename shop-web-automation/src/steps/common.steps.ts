import { expect } from '@playwright/test';
import { Given } from '../fixtures/test.js';

Given('the shop is available', async ({ shopApi }) => {
  expect(
    await shopApi.health(),
    'test-support health; is the backend running with SPRING_PROFILES_ACTIVE=test?'
  ).toBe(true);
});

Given('the catalog is seeded with the demo products', async ({ shopApi }) => {
  // Resolving a known product proves the catalog is populated.
  await shopApi.productId('Espresso Machine');
});

Given('I am not signed in', async ({ page, header }) => {
  await page.goto('/');
  if (await header.logoutButton.isVisible()) {
    await header.logout();
  }
});
