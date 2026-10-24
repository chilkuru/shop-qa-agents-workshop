const BASE_URL = (process.env.SHOP_API_BASE_URL ?? 'http://localhost:8081').replace(/\/$/, '');
const TEST_TOKEN = process.env.TEST_SUPPORT_TOKEN ?? 'local-test-token';

export class ShopApiError extends Error {
  constructor(status, body, method, path) {
    super(`${method} ${path} -> ${status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
    this.status = status;
    this.body = body;
  }
}

async function request(method, path, { body, token, testToken = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (testToken) headers['X-Test-Token'] = TEST_TOKEN;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let parsed = text;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      /* non-JSON responses (health, plain errors) pass through as text */
    }
  }

  if (!response.ok) throw new ShopApiError(response.status, parsed, method, path);
  return parsed;
}

export const shopApi = {
  baseUrl: BASE_URL,

  health: () => request('GET', '/api/test-support/health', { testToken: true }),

  actuatorHealth: () => request('GET', '/actuator/health'),

  login: (email, password) =>
    request('POST', '/api/auth/login', { body: { email, password } }),

  seedUser: (user) =>
    request('POST', '/api/test-support/seed-user', {
      testToken: true,
      body: {
        email: user.email,
        password: user.password,
        fullName: user.fullName ?? 'Seeded Shopper',
        role: user.role ?? 'CUSTOMER',
      },
    }),

  seedCart: (email, items) =>
    request('POST', '/api/test-support/seed-cart', { testToken: true, body: { email, items } }),

  resetMine: (token) =>
    request('POST', '/api/test-support/reset', { testToken: true, token }),

  products: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    query.set('size', String(params.size ?? 50));
    return request('GET', `/api/products?${query}`);
  },

  cart: (token) => request('GET', '/api/cart', { token }),

  orders: (token) => request('GET', '/api/orders', { token }),

  openapi: () => request('GET', '/v3/api-docs'),
};

/** Resolves a product name to its id so callers can seed carts by name. */
export async function findProductByName(name) {
  const page = await shopApi.products({ search: name });
  const items = page.items ?? [];
  const exact = items.find((p) => p.name.toLowerCase() === name.toLowerCase());
  const product = exact ?? items[0];
  if (!product) throw new Error(`No product matching '${name}'`);
  return product;
}
