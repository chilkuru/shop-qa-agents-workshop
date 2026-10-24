import { expect } from '@playwright/test';
import { Before, Then, When } from '../fixtures/test.js';

// A run that dies mid-scenario can leave a product hidden or short-stocked.
Before({ tags: '@ADMIN-01' }, async ({ shopApi }) => {
  await shopApi.restoreProduct('Wireless Mouse', 40);
  await shopApi.restoreProduct('Mechanical Keyboard', 40);
});

When('I open the product administration list', async ({ adminPage }) => {
  await adminPage.open();
});

Then('I see all {int} products including hidden ones', async ({ adminPage }, expected: number) => {
  await expect(adminPage.rows).toHaveCount(expected);
});

Then('the request is refused as forbidden', async ({ adminPage }) => {
  await expect(adminPage.forbidden).toBeVisible();
});

When('I set the stock of {string} to {int}', async ({ adminPage }, product: string, stock: number) => {
  await adminPage.open();
  await adminPage.setStock(product, stock);
});

Then('{string} reports {int} in stock', async ({ adminPage }, product: string, expected: number) => {
  await expect(adminPage.stockOf(product)).toHaveText(String(expected));
});

When('I hide {string} from the catalog', async ({ adminPage }, product: string) => {
  await adminPage.open();
  await adminPage.toggleVisibility(product);
  await expect(adminPage.activeOf(product)).toHaveText('Hidden');
});

Then('the shopper catalog holds {int} products', async ({ catalogPage }, expected: number) => {
  await catalogPage.open();
  await expect(catalogPage.productCards).toHaveCount(expected);
});

Then(
  'restoring {string} brings the catalog back to {int}',
  async ({ adminPage, catalogPage }, product: string, expected: number) => {
    await adminPage.open();
    await adminPage.toggleVisibility(product);
    await expect(adminPage.activeOf(product)).toHaveText('Visible');

    await catalogPage.open();
    await expect(catalogPage.productCards).toHaveCount(expected);
  }
);
