import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class AdminPage extends BasePage {
  get root(): Locator {
    return this.byTestId('admin-page');
  }

  get forbidden(): Locator {
    return this.byTestId('admin-forbidden');
  }

  get rows(): Locator {
    return this.byTestId('admin-list').locator('tbody > tr');
  }

  get count(): Locator {
    return this.byTestId('admin-count');
  }

  async open(): Promise<void> {
    await this.goto('/admin');
    await this.root.waitFor();
    await this.byTestId('admin-loading').waitFor({ state: 'detached' }).catch(() => {});
  }

  rowFor(productName: string): Locator {
    return this.rows.filter({ has: this.page.getByText(productName, { exact: true }) });
  }

  stockOf(productName: string): Locator {
    return this.rowFor(productName).locator(
      '[data-testid^="admin-stock-"]:not([data-testid*="-input-"]):not([data-testid*="-save-"])'
    );
  }

  activeOf(productName: string): Locator {
    return this.rowFor(productName).locator('[data-testid^="admin-active-"]');
  }

  async setStock(productName: string, stock: number): Promise<void> {
    const row = this.rowFor(productName);
    await row.locator('[data-testid^="admin-stock-input-"]').fill(String(stock));
    await row.locator('[data-testid^="admin-stock-save-"]').click();
  }

  async toggleVisibility(productName: string): Promise<void> {
    await this.rowFor(productName).locator('[data-testid^="admin-toggle-"]').click();
  }
}
