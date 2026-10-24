import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures/test.js';

When('I open the catalog', async ({ catalogPage }) => {
  await catalogPage.open();
});

When('I search the catalog for {string}', async ({ catalogPage, state }, term: string) => {
  await catalogPage.open();
  await catalogPage.search(term);
  state.lastSearchTerm = term;
});

Given('I have searched the catalog for {string}', async ({ catalogPage, state }, term: string) => {
  await catalogPage.open();
  await catalogPage.search(term);
  state.lastSearchTerm = term;
});

When('I filter the catalog by category {string}', async ({ catalogPage }, category: string) => {
  await catalogPage.open();
  await catalogPage.filterByCategory(category);
});

When('I clear the catalog filters', async ({ catalogPage }) => {
  await catalogPage.clearFilters();
});

Then('I see {int} products', async ({ catalogPage }, expected: number) => {
  await expect(catalogPage.productCards).toHaveCount(expected);
});

Then('I see {int} product', async ({ catalogPage }, expected: number) => {
  await expect(catalogPage.productCards).toHaveCount(expected);
});

Then('the results include {string}', async ({ catalogPage }, name: string) => {
  await expect(catalogPage.productNames()).toContainText([name]);
});

Then('every result belongs to category {string}', async ({ catalogPage }, category: string) => {
  const categories = catalogPage.productCategories();
  await expect(categories).not.toHaveCount(0);

  const values = await categories.allInnerTexts();
  expect(values.every((value) => value.trim() === category)).toBe(true);
});

Then('I am told no products matched', async ({ catalogPage }) => {
  await expect(catalogPage.noResults).toBeVisible();
  await expect(catalogPage.productCards).toHaveCount(0);
});
