import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures/test.js';

const NEW_PASSWORD = 'Newcomer@12345';

/** The suite must be re-runnable, so each run registers a distinct address. */
function uniqueVariantOf(email: string): string {
  const at = email.indexOf('@');
  return `${email.slice(0, at)}+${Date.now()}${email.slice(at)}`;
}

Given('{string} has no account', async ({ state }, email: string) => {
  state.registeredEmail = uniqueVariantOf(email);
});

When('I register as {string}', async ({ loginPage, header, state }, email: string) => {
  const target = state.registeredEmail ?? email;

  await loginPage.open();
  await loginPage.switchToRegister();
  await loginPage.register(target, NEW_PASSWORD, 'New Comer');

  await expect(header.logoutButton).toBeVisible();
  state.signedInEmail = target;
});

When('I attempt to register as {string}', async ({ loginPage }, email: string) => {
  await loginPage.open();
  await loginPage.switchToRegister();
  await loginPage.register(email, NEW_PASSWORD, 'Duplicate');
});

Then('I am told the email is already registered', async ({ loginPage }) => {
  await expect(loginPage.error).toBeVisible();
});
