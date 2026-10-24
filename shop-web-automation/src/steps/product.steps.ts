import { expect } from '@playwright/test';
import { Then, When } from '../fixtures/test.js';
import { fixtures } from '../fixtures/contractFixtures.js';

function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

When('I open the product {string}', async ({ catalogPage, productDetailPage }, name: string) => {
  await catalogPage.open();
  await catalogPage.openProduct(name);
  await productDetailPage.awaitScreen();
});

Then('I see the product details for {string}', async ({ productDetailPage }, name: string) => {
  await expect(productDetailPage.name).toHaveText(name);
  await expect(productDetailPage.sku).not.toBeEmpty();
});

Then(
  'the product shows the price of {int} {string}',
  async ({ productDetailPage }, quantity: number, name: string) => {
    await expect(productDetailPage.price).toHaveText(
      formatPaise(fixtures.pricePaise(name) * quantity)
    );
  }
);

Then('the product belongs to category {string}', async ({ productDetailPage }, category: string) => {
  await expect(productDetailPage.category).toHaveText(category);
});

Then('the product is shown as in stock', async ({ productDetailPage }) => {
  await expect(productDetailPage.stock).toHaveText('In stock');
});
