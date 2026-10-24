import type {
  AddItemRequest,
  AddressListResponse,
  AdminProductResponse,
  AuthResponse,
  CartResponse,
  CheckoutRequest,
  LoginRequest,
  OrderResponse,
  ProductPageResponse,
  ProductResponse,
  RegisterRequest,
  ReviewListResponse,
  SaveAddressRequest,
  SubmitReviewRequest,
  UpdateItemRequest,
  UserResponse,
  WishlistResponse,
} from '@shop/types';

// Never hardcode the host: injected at build time so the same bundle runs
// against localhost, a Cloudflare tunnel, or a cloud deployment.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081';

const TOKEN_KEY = 'shop.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Product imagery is served by the API, so relative paths resolve against it. */
export function imageUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `${BASE_URL}${path}`;
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.message ?? body.error ?? message;
    } catch {
      // Response had no JSON body; keep the status-based message.
    }
    throw new ApiError(response.status, message);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export const api = {
  register: (body: RegisterRequest) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: LoginRequest) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => request<UserResponse>('/api/auth/me'),

  products: (params: { search?: string; category?: string; page?: number; size?: number }) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.category) qs.set('category', params.category);
    qs.set('page', String(params.page ?? 0));
    qs.set('size', String(params.size ?? 12));
    return request<ProductPageResponse>(`/api/products?${qs.toString()}`);
  },

  product: (id: number) => request<ProductResponse>(`/api/products/${id}`),

  categories: () => request<string[]>('/api/categories'),

  cart: () => request<CartResponse>('/api/cart'),

  addToCart: (body: AddItemRequest) =>
    request<CartResponse>('/api/cart/items', { method: 'POST', body: JSON.stringify(body) }),

  updateCartItem: (productId: number, body: UpdateItemRequest) =>
    request<CartResponse>(`/api/cart/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  removeCartItem: (productId: number) =>
    request<CartResponse>(`/api/cart/items/${productId}`, { method: 'DELETE' }),

  checkout: (body: CheckoutRequest) =>
    request<OrderResponse>('/api/checkout', { method: 'POST', body: JSON.stringify(body) }),

  orders: () => request<OrderResponse[]>('/api/orders'),

  order: (orderNumber: string) => request<OrderResponse>(`/api/orders/${orderNumber}`),

  wishlist: () => request<WishlistResponse>('/api/wishlist'),

  addToWishlist: (productId: number) =>
    request<WishlistResponse>('/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),

  removeFromWishlist: (productId: number) =>
    request<WishlistResponse>(`/api/wishlist/${productId}`, { method: 'DELETE' }),

  addresses: () => request<AddressListResponse>('/api/addresses'),

  saveAddress: (body: SaveAddressRequest) =>
    request<AddressListResponse>('/api/addresses', { method: 'POST', body: JSON.stringify(body) }),

  makeAddressDefault: (addressId: number) =>
    request<AddressListResponse>(`/api/addresses/${addressId}/default`, { method: 'POST' }),

  deleteAddress: (addressId: number) =>
    request<AddressListResponse>(`/api/addresses/${addressId}`, { method: 'DELETE' }),

  reviews: (productId: number) =>
    request<ReviewListResponse>(`/api/products/${productId}/reviews`),

  submitReview: (productId: number, body: SubmitReviewRequest) =>
    request<ReviewListResponse>(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  applyCoupon: (code: string) =>
    request<CartResponse>('/api/cart/coupon', { method: 'POST', body: JSON.stringify({ code }) }),

  removeCoupon: () => request<CartResponse>('/api/cart/coupon', { method: 'DELETE' }),

  adminProducts: () => request<AdminProductResponse[]>('/api/admin/products'),

  adminSetStock: (productId: number, stock: number) =>
    request<AdminProductResponse>(`/api/admin/products/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
    }),

  adminSetActive: (productId: number, active: boolean) =>
    request<AdminProductResponse>(`/api/admin/products/${productId}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
};
