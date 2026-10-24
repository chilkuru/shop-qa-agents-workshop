import type { Locator, Page } from '@playwright/test';

/** Common locator helpers. Page objects expose intent; they never assert. */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected byTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
