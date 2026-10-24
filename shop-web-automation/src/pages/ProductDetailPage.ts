import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ProductDetailPage extends BasePage {
  get root(): Locator {
    return this.byTestId('product-detail-page');
  }

  get name(): Locator {
    return this.byTestId('detail-name');
  }

  get category(): Locator {
    return this.byTestId('detail-category');
  }

  get price(): Locator {
    return this.byTestId('detail-price');
  }

  get stock(): Locator {
    return this.byTestId('detail-stock');
  }

  get sku(): Locator {
    return this.byTestId('detail-sku');
  }

  async awaitScreen(): Promise<void> {
    await this.root.waitFor();
    await this.byTestId('product-loading').waitFor({ state: 'detached' }).catch(() => {});
  }

  get saveForLater(): Locator {
    return this.byTestId('detail-save-for-later');
  }

  get reviewCount(): Locator {
    return this.byTestId('reviews-count');
  }

  get reviewAverage(): Locator {
    return this.byTestId('reviews-average');
  }

  get reviewRows(): Locator {
    return this.byTestId('reviews-list').locator('> li');
  }

  get reviewNotAllowed(): Locator {
    return this.byTestId('review-not-allowed');
  }

  get reviewForm(): Locator {
    return this.byTestId('review-form');
  }

  async submitReview(rating: number, comment: string): Promise<void> {
    await this.byTestId('review-rating-select').selectOption(String(rating));
    await this.byTestId('review-comment-input').fill(comment);
    await this.byTestId('review-submit').click();
  }
}
