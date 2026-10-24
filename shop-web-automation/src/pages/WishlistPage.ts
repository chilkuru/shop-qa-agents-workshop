import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class WishlistPage extends BasePage {
  get root(): Locator {
    return this.byTestId('wishlist-page');
  }

  get rows(): Locator {
    return this.byTestId('wishlist-list').locator('> li');
  }

  get empty(): Locator {
    return this.byTestId('wishlist-empty');
  }

  get count(): Locator {
    return this.byTestId('wishlist-count');
  }

  async open(): Promise<void> {
    await this.goto('/wishlist');
    await this.root.waitFor();
    await this.byTestId('wishlist-loading').waitFor({ state: 'detached' }).catch(() => {});
  }

  rowFor(productName: string): Locator {
    return this.rows.filter({ has: this.page.getByText(productName, { exact: true }) });
  }

  async remove(productName: string): Promise<void> {
    await this.rowFor(productName).locator('[data-testid^="wishlist-remove-"]').click();
  }
}
