import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures/test.js';

Given('I have reviewed {string} with {int} stars', async ({ shopApi, state }, product: string, rating: number) => {
  await shopApi.submitReview(state.signedInEmail!, product, rating);
});

When('I review {string} with {int} stars', async ({ catalogPage, productDetailPage }, product: string, rating: number) => {
  await catalogPage.open();
  await catalogPage.openProduct(product);
  await productDetailPage.awaitScreen();
  await productDetailPage.submitReview(rating, `A ${rating}-star review`);
});

When('anyone views the reviews for {string}', async ({ page, header, catalogPage, productDetailPage, state }, product: string) => {
  await header.logout();
  state.signedInEmail = null;
  await catalogPage.open();
  await catalogPage.openProduct(product);
  await productDetailPage.awaitScreen();
  await expect(page).toHaveURL(/\/products\//);
});

Then('{string} has {int} review', async ({ productDetailPage }, _product: string, expected: number) => {
  await expect(productDetailPage.reviewRows).toHaveCount(expected);
  await expect(productDetailPage.reviewCount).toContainText(String(expected));
});

Then('{string} has an average rating of {int}', async ({ productDetailPage }, _product: string, expected: number) => {
  await expect(productDetailPage.reviewAverage).toHaveText(expected.toFixed(1));
});

Then('reviewing is not offered', async ({ productDetailPage }) => {
  await expect(productDetailPage.reviewForm).toHaveCount(0);
});
