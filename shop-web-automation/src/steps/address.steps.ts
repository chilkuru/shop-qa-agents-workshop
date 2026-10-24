import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures/test.js';
import type { AddressInput } from '../pages/AddressesPage.js';

const ADDRESSES: Record<string, AddressInput> = {
  Home: {
    label: 'Home', recipient: 'Demo Shopper', line1: '42 MG Road',
    city: 'Bengaluru', state: 'Karnataka', postalCode: '560001',
  },
  Office: {
    label: 'Office', recipient: 'Demo Shopper', line1: '9 Residency Road',
    city: 'Bengaluru', state: 'Karnataka', postalCode: '560025',
  },
};

Given('I have no saved addresses', async ({ shopApi, state }) => {
  await shopApi.clearAddresses(state.signedInEmail!);
});

Given('I have saved my {string} address', async ({ shopApi, state }, label: string) => {
  await shopApi.saveAddress(state.signedInEmail!, ADDRESSES[label]);
});

When('I save my {string} address', async ({ addressesPage }, label: string) => {
  await addressesPage.open();
  await addressesPage.save(ADDRESSES[label]);
});

When('I make {string} my default address', async ({ addressesPage }, label: string) => {
  await addressesPage.open();
  await addressesPage.makeDefault(label);
});

When('I delete my {string} address', async ({ addressesPage }, label: string) => {
  await addressesPage.open();
  await addressesPage.remove(label);
});

Then('I have {int} saved address', async ({ addressesPage }, expected: number) => {
  await addressesPage.open();
  await expect(addressesPage.rows).toHaveCount(expected);
});

Then('I have {int} saved addresses', async ({ addressesPage }, expected: number) => {
  await addressesPage.open();
  await expect(addressesPage.rows).toHaveCount(expected);
});

Then('{string} is my default address', async ({ addressesPage }, label: string) => {
  await expect(addressesPage.isDefault(label)).toBeVisible();
});

Then('exactly one address is marked default', async ({ addressesPage }) => {
  await expect(addressesPage.defaultBadges).toHaveCount(1);
});
