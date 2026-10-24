import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures/test.js';
import { fixtures } from '../fixtures/contractFixtures.js';

Given('I am a registered shopper {string}', async ({ shopApi }, email: string) => {
  await shopApi.ensureUser(fixtures.userByEmail(email));
});

Given('I am signed in as {string}', async ({ shopApi, loginPage, header, state }, email: string) => {
  const user = fixtures.userByEmail(email);
  await shopApi.ensureUser(user);

  await loginPage.open();
  await loginPage.signIn(user.email, user.password);
  await expect(header.logoutButton).toBeVisible();

  state.signedInEmail = user.email;
});

When('I sign in as {string}', async ({ shopApi, loginPage, state }, email: string) => {
  const user = fixtures.userByEmail(email);
  await shopApi.ensureUser(user);

  await loginPage.open();
  await loginPage.signIn(user.email, user.password);

  state.signedInEmail = user.email;
});

When(
  'I attempt to sign in as {string} with the wrong password',
  async ({ loginPage }, email: string) => {
    await loginPage.open();
    await loginPage.signIn(email, fixtures.wrongPassword);
  }
);

When('I sign out', async ({ header }) => {
  await header.logout();
});

Then('I am recognised as {string}', async ({ header, state }, email: string) => {
  // Registration scenarios use a per-run unique address, so the literal in the
  // Gherkin is a placeholder for whichever account was actually created.
  const expected = state.registeredEmail ?? email;
  await expect(header.currentUser).toContainText(expected);
  await expect(header.logoutButton).toBeVisible();
});

Then('I am told the credentials are invalid', async ({ loginPage }) => {
  await expect(loginPage.error).toBeVisible();
});

Then('I am no longer signed in', async ({ header }) => {
  await expect(header.loginLink).toBeVisible();
  await expect(header.logoutButton).toHaveCount(0);
});
