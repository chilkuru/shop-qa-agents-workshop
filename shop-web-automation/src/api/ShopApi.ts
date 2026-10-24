import type { APIRequestContext } from '@playwright/test';
import { fixtures, type FixtureUser } from '../fixtures/contractFixtures.js';

const API_BASE_URL = process.env.SHOP_API_BASE_URL ?? 'http://localhost:8081';
const TEST_TOKEN = process.env.TEST_SUPPORT_TOKEN ?? 'local-test-token';

export interface AddressPayload {
  label: string;
  recipient: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
}

/**
 * Facade over the backend, used only to put the system into a known state.
 * Never used to assert — UI outcomes are asserted through the page objects.
 */
export class ShopApi {
  constructor(private readonly request: APIRequestContext) {}

  private testHeaders() {
    return { 'X-Test-Token': TEST_TOKEN };
  }

  async health(): Promise<boolean> {
    const response = await this.request.get(`${API_BASE_URL}/api/test-support/health`, {
      headers: this.testHeaders(),
    });
    return response.ok();
  }

  async ensureUser(user: FixtureUser): Promise<void> {
    const response = await this.request.post(`${API_BASE_URL}/api/test-support/seed-user`, {
      headers: this.testHeaders(),
      data: {
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        role: user.role,
      },
    });
    if (!response.ok()) {
      throw new Error(`seed-user failed: ${response.status()} ${await response.text()}`);
    }
  }

  async token(user: FixtureUser): Promise<string> {
    const response = await this.request.post(`${API_BASE_URL}/api/auth/login`, {
      data: { email: user.email, password: user.password },
    });
    if (!response.ok()) {
      throw new Error(`login failed: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()).token as string;
  }

  async productId(name: string): Promise<number> {
    const response = await this.request.get(
      `${API_BASE_URL}/api/products?search=${encodeURIComponent(name)}&size=50`
    );
    const body = await response.json();
    const match = (body.items as { id: number; name: string }[]).find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (!match) throw new Error(`No product named '${name}'`);
    return match.id;
  }

  async seedCart(
    email: string,
    lines: { product: string; quantity: number }[]
  ): Promise<void> {
    const items = [];
    for (const line of lines) {
      items.push({ productId: await this.productId(line.product), quantity: line.quantity });
    }
    const response = await this.request.post(`${API_BASE_URL}/api/test-support/seed-cart`, {
      headers: this.testHeaders(),
      data: { email, items },
    });
    if (!response.ok()) {
      throw new Error(`seed-cart failed: ${response.status()} ${await response.text()}`);
    }
  }

  async emptyCart(email: string): Promise<void> {
    await this.seedCart(email, []);
  }

  /** Places a real order through the API so UI journeys can start from one. */
  async placeOrder(email: string, product: string): Promise<string> {
    const user = fixtures.userByEmail(email);
    await this.seedCart(email, [{ product, quantity: 1 }]);

    const token = await this.token(user);
    const card = fixtures.card('approved');
    const response = await this.request.post(`${API_BASE_URL}/api/checkout`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        shippingName: fixtures.shipping.name,
        shippingAddress: fixtures.shipping.address,
        card: { number: card.number, expiry: card.expiry, cvc: card.cvc },
      },
    });
    if (!response.ok()) {
      throw new Error(`checkout failed: ${response.status()} ${await response.text()}`);
    }
    return (await response.json()).orderNumber as string;
  }

  async resetOrders(email: string): Promise<void> {
    const token = await this.token(fixtures.userByEmail(email));
    const response = await this.request.post(`${API_BASE_URL}/api/test-support/reset`, {
      headers: { ...this.testHeaders(), Authorization: `Bearer ${token}` },
    });
    if (!response.ok()) {
      throw new Error(`reset failed: ${response.status()} ${await response.text()}`);
    }
  }

  private async authHeaders(email: string): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${await this.token(fixtures.userByEmail(email))}` };
  }

  private async expectOk(
    label: string,
    run: () => Promise<import('@playwright/test').APIResponse>
  ): Promise<import('@playwright/test').APIResponse> {
    const response = await run();
    if (!response.ok()) {
      throw new Error(`${label} failed: ${response.status()} ${await response.text()}`);
    }
    return response;
  }

  async clearWishlist(email: string): Promise<void> {
    const headers = await this.authHeaders(email);
    const current = await this.expectOk('wishlist read', () =>
      this.request.get(`${API_BASE_URL}/api/wishlist`, { headers })
    );
    const body = (await current.json()) as { items: { productId: number }[] };
    for (const item of body.items) {
      await this.expectOk('wishlist delete', () =>
        this.request.delete(`${API_BASE_URL}/api/wishlist/${item.productId}`, { headers })
      );
    }
  }

  async saveToWishlist(email: string, product: string): Promise<void> {
    const headers = await this.authHeaders(email);
    const productId = await this.productId(product);
    await this.expectOk('wishlist add', () =>
      this.request.post(`${API_BASE_URL}/api/wishlist`, { headers, data: { productId } })
    );
  }

  async clearAddresses(email: string): Promise<void> {
    const headers = await this.authHeaders(email);
    const current = await this.expectOk('addresses read', () =>
      this.request.get(`${API_BASE_URL}/api/addresses`, { headers })
    );
    const body = (await current.json()) as { addresses: { id: number }[] };
    for (const address of body.addresses) {
      await this.expectOk('address delete', () =>
        this.request.delete(`${API_BASE_URL}/api/addresses/${address.id}`, { headers })
      );
    }
  }

  async saveAddress(email: string, address: AddressPayload): Promise<void> {
    const headers = await this.authHeaders(email);
    await this.expectOk('address save', () =>
      this.request.post(`${API_BASE_URL}/api/addresses`, { headers, data: address })
    );
  }

  async submitReview(email: string, product: string, rating: number): Promise<void> {
    const headers = await this.authHeaders(email);
    const productId = await this.productId(product);
    await this.expectOk('review submit', () =>
      this.request.post(`${API_BASE_URL}/api/products/${productId}/reviews`, {
        headers,
        data: { rating, comment: `Seeded ${rating}-star review` },
      })
    );
  }

  /** Restores a product to visible with healthy stock, so admin journeys are repeatable. */
  async restoreProduct(product: string, stock: number): Promise<void> {
    const headers = await this.authHeaders('admin@shop.in');
    const productId = await this.productId(product);
    await this.expectOk('admin stock', () =>
      this.request.patch(`${API_BASE_URL}/api/admin/products/${productId}/stock`, {
        headers,
        data: { stock },
      })
    );
    await this.expectOk('admin activate', () =>
      this.request.patch(`${API_BASE_URL}/api/admin/products/${productId}/active`, {
        headers,
        data: { active: true },
      })
    );
  }
}
