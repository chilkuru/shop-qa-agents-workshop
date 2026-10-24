import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures/test.js';

Given('I have already placed an order for {string}', async ({ shopApi, state }, product: string) => {
  // Seeded through the API on purpose: order history must not re-test checkout.
  state.lastOrderNumber = await shopApi.placeOrder(state.signedInEmail!, product);
});

Given('I have no order history', async ({ shopApi, state }) => {
  await shopApi.resetOrders(state.signedInEmail!);
});

When('I open my order history', async ({ ordersPage }) => {
  await ordersPage.open();
});

Then('my most recent order is listed as confirmed', async ({ ordersPage, state }) => {
  const orderNumber = state.lastOrderNumber!;
  await expect(ordersPage.rowFor(orderNumber)).toBeVisible();
  await expect(ordersPage.statusOf(orderNumber)).toHaveText('CONFIRMED');
});

Then('I am told I have no orders', async ({ ordersPage }) => {
  await expect(ordersPage.empty).toBeVisible();
  await expect(ordersPage.rows).toHaveCount(0);
});
