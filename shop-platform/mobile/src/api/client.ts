import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 10.0.2.2 is the Android emulator's alias for the host machine — `localhost`
 * inside the emulator refers to the emulator itself. Override via
 * EXPO_PUBLIC_API_BASE_URL for a physical device or a tunnelled URL.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:8081';

const TOKEN_KEY = 'shop.token';

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken !== null) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Product imagery is served by the API, so relative paths resolve against it. */
export function absoluteImageUrl(path?: string): string | undefined {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `${BASE_URL}${path}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
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
      // No JSON body; keep the status-based message.
    }
    throw new ApiError(response.status, message);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  pricePaise: number;
  imageUrl: string;
  stock: number;
  inStock: boolean;
}

export interface ProductPage {
  items: Product[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface CartItem {
  productId: number;
  sku: string;
  name: string;
  imageUrl: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
}

export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  subtotalPaise: number;
  couponCode?: string;
  discountPaise: number;
  totalPaise: number;
}

export interface OrderItem {
  productId: number;
  productName: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
}

export interface Order {
  orderNumber: string;
  status: string;
  totalPaise: number;
  shippingName: string;
  shippingAddress: string;
  items: OrderItem[];
  placedAt: string;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthResult {
  token: string;
  expiresInSeconds: number;
  user: User;
}

export interface WishlistItem {
  productId: number;
  sku: string;
  name: string;
  category: string;
  imageUrl: string;
  pricePaise: number;
  inStock: boolean;
}

export interface Wishlist {
  items: WishlistItem[];
  count: number;
}

export interface Address {
  id: number;
  label: string;
  recipient: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  formatted: string;
  isDefault: boolean;
}

export interface AddressList {
  addresses: Address[];
  count: number;
}

export type SaveAddress = Omit<Address, 'id' | 'formatted' | 'isDefault'>;

export interface Review {
  id: number;
  productId: number;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewList {
  productId: number;
  reviews: Review[];
  count: number;
  averageRating: number;
  canReview: boolean;
}

export interface AdminProduct {
  id: number;
  sku: string;
  name: string;
  category: string;
  pricePaise: number;
  stock: number;
  active: boolean;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, fullName: string) =>
    request<AuthResult>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    }),

  me: () => request<User>('/api/auth/me'),

  products: (params: { search?: string; category?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.category) qs.set('category', params.category);
    qs.set('size', '50');
    return request<ProductPage>(`/api/products?${qs.toString()}`);
  },

  product: (id: number) => request<Product>(`/api/products/${id}`),

  categories: () => request<string[]>('/api/categories'),

  cart: () => request<Cart>('/api/cart'),

  addToCart: (productId: number, quantity = 1) =>
    request<Cart>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),

  updateCartItem: (productId: number, quantity: number) =>
    request<Cart>(`/api/cart/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),

  removeCartItem: (productId: number) =>
    request<Cart>(`/api/cart/items/${productId}`, { method: 'DELETE' }),

  checkout: (body: {
    shippingName: string;
    shippingAddress: string;
    card: { number: string; expiry: string; cvc: string };
  }) => request<Order>('/api/checkout', { method: 'POST', body: JSON.stringify(body) }),

  orders: () => request<Order[]>('/api/orders'),

  order: (orderNumber: string) => request<Order>(`/api/orders/${orderNumber}`),

  wishlist: () => request<Wishlist>('/api/wishlist'),

  addToWishlist: (productId: number) =>
    request<Wishlist>('/api/wishlist', { method: 'POST', body: JSON.stringify({ productId }) }),

  removeFromWishlist: (productId: number) =>
    request<Wishlist>(`/api/wishlist/${productId}`, { method: 'DELETE' }),

  addresses: () => request<AddressList>('/api/addresses'),

  saveAddress: (body: SaveAddress) =>
    request<AddressList>('/api/addresses', { method: 'POST', body: JSON.stringify(body) }),

  makeAddressDefault: (addressId: number) =>
    request<AddressList>(`/api/addresses/${addressId}/default`, { method: 'POST' }),

  deleteAddress: (addressId: number) =>
    request<AddressList>(`/api/addresses/${addressId}`, { method: 'DELETE' }),

  reviews: (productId: number) => request<ReviewList>(`/api/products/${productId}/reviews`),

  submitReview: (productId: number, rating: number, comment: string) =>
    request<ReviewList>(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),

  applyCoupon: (code: string) =>
    request<Cart>('/api/cart/coupon', { method: 'POST', body: JSON.stringify({ code }) }),

  removeCoupon: () => request<Cart>('/api/cart/coupon', { method: 'DELETE' }),

  adminProducts: () => request<AdminProduct[]>('/api/admin/products'),

  adminSetStock: (productId: number, stock: number) =>
    request<AdminProduct>(`/api/admin/products/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
    }),

  adminSetActive: (productId: number, active: boolean) =>
    request<AdminProduct>(`/api/admin/products/${productId}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
};

/** Amounts are stored as paise: 1 INR = 100 paise. */
export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
