import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  get root(): Locator {
    return this.byTestId('login-page');
  }

  get emailInput(): Locator {
    return this.byTestId('email-input');
  }

  get passwordInput(): Locator {
    return this.byTestId('password-input');
  }

  get submitButton(): Locator {
    return this.byTestId('submit-button');
  }

  get error(): Locator {
    return this.byTestId('login-error');
  }

  async open(): Promise<void> {
    await this.goto('/login');
    await this.root.waitFor();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async switchToRegister(): Promise<void> {
    await this.byTestId('toggle-mode-button').click();
    await this.byTestId('fullname-input').waitFor();
  }

  async register(email: string, password: string, fullName: string): Promise<void> {
    await this.byTestId('fullname-input').fill(fullName);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
