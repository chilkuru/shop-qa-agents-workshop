import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class CatalogPage extends BasePage {
  get root(): Locator {
    return this.byTestId('catalog-page');
  }

  get productCards(): Locator {
    return this.byTestId('product-list').locator('> li');
  }

  get resultCount(): Locator {
    return this.byTestId('result-count');
  }

  get noResults(): Locator {
    return this.byTestId('no-results');
  }

  get searchInput(): Locator {
    return this.byTestId('search-input');
  }

  get categorySelect(): Locator {
    return this.byTestId('category-select');
  }

  productNames(): Locator {
    return this.page.locator('[data-testid^="product-name-"]');
  }

  productCategories(): Locator {
    return this.page.locator('[data-testid^="product-category-"]');
  }

  async open(): Promise<void> {
    await this.goto('/');
    await this.root.waitFor();
    await this.byTestId('catalog-loading').waitFor({ state: 'detached' }).catch(() => {});
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.byTestId('search-button').click();
  }

  async filterByCategory(category: string): Promise<void> {
    await this.categorySelect.selectOption(category);
  }

  async clearFilters(): Promise<void> {
    await this.byTestId('clear-filters-button').click();
  }

  async addToCart(productName: string): Promise<void> {
    await this.cardFor(productName).getByTestId(/^add-to-cart-/).click();
  }

  async openProduct(productName: string): Promise<void> {
    await this.cardFor(productName).getByTestId(/^product-link-/).click();
  }

  /** Resolves a card by its visible product name so steps never deal with ids. */
  private cardFor(productName: string): Locator {
    return this.productCards.filter({
      has: this.page.getByText(productName, { exact: true }),
    });
  }
}
