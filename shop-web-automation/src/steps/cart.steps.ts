import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures/test.js';
import { fixtures } from '../fixtures/contractFixtures.js';

function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

Given('my cart is empty', async ({ shopApi, state }) => {
  await shopApi.emptyCart(state.signedInEmail!);
});

Given('my cart contains {int} of {string}', async ({ shopApi, state }, quantity: number, product: string) => {
  await shopApi.seedCart(state.signedInEmail!, [{ product, quantity }]);
});

When('I add {string} to my cart', async ({ catalogPage }, product: string) => {
  await catalogPage.open();
  await catalogPage.addToCart(product);
});

When('I change the quantity of {string} to {int}', async ({ cartPage }, product: string, quantity: number) => {
  await cartPage.open();
  await cartPage.setQuantity(product, quantity);
});

When('I remove {string} from my cart', async ({ cartPage }, product: string) => {
  await cartPage.open();
  await cartPage.remove(product);
});

Then('my cart contains {int} line', async ({ cartPage }, expected: number) => {
  await cartPage.open();
  await expect(cartPage.rows).toHaveCount(expected);
});

Then('my cart contains {int} lines', async ({ cartPage }, expected: number) => {
  await cartPage.open();
  await expect(cartPage.rows).toHaveCount(expected);
});

Then('my cart shows {int} of {string}', async ({ cartPage }, quantity: number, product: string) => {
  await cartPage.open();
  await expect(cartPage.quantityOf(product)).toHaveText(String(quantity));
});

Then('my cart is now empty', async ({ cartPage }) => {
  await cartPage.open();
  await expect(cartPage.empty).toBeVisible();
});

Then(
  'my cart total is the price of {int} {string}',
  async ({ cartPage }, quantity: number, product: string) => {
    await cartPage.open();
    await expect(cartPage.total).toHaveText(formatPaise(fixtures.pricePaise(product) * quantity));
  }
);
