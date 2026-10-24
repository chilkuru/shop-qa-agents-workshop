import { expect, type Locator } from '@playwright/test';
import { Given, Then, When } from '../fixtures/test.js';
import { fixtures } from '../fixtures/contractFixtures.js';

function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

Given('I have applied coupon {string}', async ({ cartPage }, code: string) => {
  await cartPage.open();
  await cartPage.applyCoupon(code);
  await expect(cartPage.couponCode).toHaveText(code);
});

When('I apply coupon {string}', async ({ cartPage }, code: string) => {
  await cartPage.open();
  await cartPage.applyCoupon(code);
});

When('I remove the coupon', async ({ cartPage }) => {
  await cartPage.removeCoupon();
});

Then('my cart shows a {int} percent discount', async ({ cartPage }, percent: number) => {
  const subtotal = fixtures.pricePaise('Espresso Machine');
  await expect(cartPage.discount).toHaveText(formatPaise(Math.round(subtotal * (percent / 100))));
});

Then('my cart total is the subtotal minus the discount', async ({ cartPage }) => {
  const paise = async (locator: Locator) =>
    Number((await locator.innerText()).replace(/[^\d]/g, ''));

  const subtotal = await paise(cartPage.subtotal);
  const discount = await paise(cartPage.discount);
  const total = await paise(cartPage.total);

  expect(total).toBe(subtotal - discount);
});

Then('I am told the coupon cannot be used', async ({ cartPage }) => {
  await expect(cartPage.couponError).toBeVisible();
});

Then('my cart has no discount', async ({ cartPage }) => {
  await expect(cartPage.discount).toHaveText(formatPaise(0));
  await expect(cartPage.couponCode).toHaveCount(0);
});
