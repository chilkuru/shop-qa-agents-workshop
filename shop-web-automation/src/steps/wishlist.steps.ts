import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures/test.js';

Given('my wishlist is empty', async ({ shopApi, state }) => {
  await shopApi.clearWishlist(state.signedInEmail!);
});

Given('I have saved {string} for later', async ({ shopApi, state }, product: string) => {
  await shopApi.saveToWishlist(state.signedInEmail!, product);
});

When('I save {string} for later', async ({ catalogPage, productDetailPage }, product: string) => {
  await catalogPage.open();
  await catalogPage.openProduct(product);
  await productDetailPage.awaitScreen();
  await productDetailPage.saveForLater.click();
});

When('I remove {string} from my wishlist', async ({ wishlistPage }, product: string) => {
  await wishlistPage.open();
  await wishlistPage.remove(product);
});

Then('my wishlist holds {int} product', async ({ wishlistPage }, expected: number) => {
  await wishlistPage.open();
  await expect(wishlistPage.rows).toHaveCount(expected);
});

Then('my wishlist includes {string}', async ({ wishlistPage }, product: string) => {
  await expect(wishlistPage.rowFor(product)).toBeVisible();
});

Then('my wishlist is now empty', async ({ wishlistPage }) => {
  await wishlistPage.open();
  await expect(wishlistPage.empty).toBeVisible();
});
