import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class CartPage extends BasePage {
  get root(): Locator {
    return this.byTestId('cart-page');
  }

  get rows(): Locator {
    return this.byTestId('cart-list').locator('> li');
  }

  get empty(): Locator {
    return this.byTestId('cart-empty');
  }

  get total(): Locator {
    return this.byTestId('cart-total');
  }

  async open(): Promise<void> {
    await this.goto('/cart');
    await this.root.waitFor();
    await this.byTestId('cart-loading').waitFor({ state: 'detached' }).catch(() => {});
  }

  rowFor(productName: string): Locator {
    return this.rows.filter({ has: this.page.getByText(productName, { exact: true }) });
  }

  quantityOf(productName: string): Locator {
    return this.rowFor(productName).locator('[data-testid^="cart-quantity-"]');
  }

  async increment(productName: string): Promise<void> {
    await this.rowFor(productName).locator('[data-testid^="cart-increment-"]').click();
  }

  async decrement(productName: string): Promise<void> {
    await this.rowFor(productName).locator('[data-testid^="cart-decrement-"]').click();
  }

  async remove(productName: string): Promise<void> {
    await this.rowFor(productName).locator('[data-testid^="cart-remove-"]').click();
  }

  async setQuantity(productName: string, quantity: number): Promise<void> {
    let current = Number(await this.quantityOf(productName).innerText());

    // Each click issues a PATCH and re-renders. Waiting for the row to settle on the
    // intermediate value keeps a fast second click from being sent against stale state.
    while (current !== quantity) {
      const next = current < quantity ? current + 1 : current - 1;
      if (current < quantity) await this.increment(productName);
      else await this.decrement(productName);

      await this.waitForQuantity(productName, next);
      current = next;
    }
  }

  private async waitForQuantity(productName: string, value: number): Promise<void> {
    await this.rowFor(productName)
      .locator(`[data-testid^="cart-quantity-"]:text-is("${value}")`)
      .waitFor();
  }

  get subtotal(): Locator {
    return this.byTestId('cart-subtotal');
  }

  get discount(): Locator {
    return this.byTestId('cart-discount');
  }

  get couponCode(): Locator {
    return this.byTestId('cart-coupon-code');
  }

  get couponError(): Locator {
    return this.byTestId('coupon-error');
  }

  async applyCoupon(code: string): Promise<void> {
    await this.byTestId('coupon-input').fill(code);
    await this.byTestId('coupon-apply').click();
  }

  async removeCoupon(): Promise<void> {
    await this.byTestId('coupon-remove').click();
  }
}
