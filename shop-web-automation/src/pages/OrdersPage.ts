import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class OrdersPage extends BasePage {
  get root(): Locator {
    return this.byTestId('orders-page');
  }

  get rows(): Locator {
    return this.byTestId('orders-list').locator('> li');
  }

  get empty(): Locator {
    return this.byTestId('orders-empty');
  }

  async open(): Promise<void> {
    await this.goto('/orders');
    await this.root.waitFor();
    await this.byTestId('orders-loading').waitFor({ state: 'detached' }).catch(() => {});
  }

  rowFor(orderNumber: string): Locator {
    return this.byTestId(`order-row-${orderNumber}`);
  }

  statusOf(orderNumber: string): Locator {
    return this.byTestId(`order-status-${orderNumber}`);
  }
}
