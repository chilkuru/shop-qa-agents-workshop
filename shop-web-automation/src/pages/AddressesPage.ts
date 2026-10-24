import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export interface AddressInput {
  label: string;
  recipient: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
}

export class AddressesPage extends BasePage {
  get root(): Locator {
    return this.byTestId('addresses-page');
  }

  get rows(): Locator {
    return this.byTestId('addresses-list').locator('> li');
  }

  get defaultBadges(): Locator {
    return this.page.locator('[data-testid^="address-default-"]');
  }

  async open(): Promise<void> {
    await this.goto('/addresses');
    await this.root.waitFor();
    await this.byTestId('addresses-loading').waitFor({ state: 'detached' }).catch(() => {});
  }

  rowFor(label: string): Locator {
    return this.rows.filter({ has: this.page.getByText(label, { exact: true }) });
  }

  async save(address: AddressInput): Promise<void> {
    for (const [name, value] of Object.entries(address)) {
      await this.byTestId(`address-${name}-input`).fill(value);
    }
    await this.byTestId('address-save-button').click();
  }

  async makeDefault(label: string): Promise<void> {
    await this.rowFor(label).locator('[data-testid^="address-make-default-"]').click();
  }

  async remove(label: string): Promise<void> {
    await this.rowFor(label).locator('[data-testid^="address-delete-"]').click();
  }

  isDefault(label: string): Locator {
    return this.rowFor(label).locator('[data-testid^="address-default-"]');
  }
}
