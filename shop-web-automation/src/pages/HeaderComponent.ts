import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/** Reusable header fragment shared by every page. */
export class HeaderComponent extends BasePage {
  get loginLink(): Locator {
    return this.byTestId('nav-login');
  }

  get logoutButton(): Locator {
    return this.byTestId('logout-button');
  }

  get currentUser(): Locator {
    return this.byTestId('current-user');
  }

  get cartBadge(): Locator {
    return this.byTestId('cart-badge');
  }

  get cartLink(): Locator {
    return this.byTestId('nav-cart');
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
