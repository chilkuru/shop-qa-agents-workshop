import type { components, paths } from './schema';

export type { components, paths };

type Schemas = components['schemas'];

export type UserResponse = Schemas['UserResponse'];
export type AuthResponse = Schemas['AuthResponse'];
export type RegisterRequest = Schemas['RegisterRequest'];
export type LoginRequest = Schemas['LoginRequest'];

export type ProductResponse = Schemas['ProductResponse'];
export type ProductPageResponse = Schemas['ProductPageResponse'];

export type CartResponse = Schemas['CartResponse'];
export type CartItemResponse = Schemas['CartItemResponse'];
export type AddItemRequest = Schemas['AddItemRequest'];
export type UpdateItemRequest = Schemas['UpdateItemRequest'];

export type OrderResponse = Schemas['OrderResponse'];
export type OrderItemResponse = Schemas['OrderItemResponse'];
export type CheckoutRequest = Schemas['CheckoutRequest'];
export type CardRequest = Schemas['CardRequest'];

export type WishlistResponse = Schemas['WishlistResponse'];
export type WishlistItemResponse = Schemas['WishlistItemResponse'];
export type AddWishlistRequest = Schemas['AddWishlistRequest'];
export type AddressListResponse = Schemas['AddressListResponse'];
export type AddressResponse = Schemas['AddressResponse'];
export type SaveAddressRequest = Schemas['SaveAddressRequest'];
export type ReviewListResponse = Schemas['ReviewListResponse'];
export type ReviewResponse = Schemas['ReviewResponse'];
export type SubmitReviewRequest = Schemas['SubmitReviewRequest'];
export type ApplyCouponRequest = Schemas['ApplyCouponRequest'];
export type AdminProductResponse = Schemas['AdminProductResponse'];

/** Deterministic mock-gateway cards; keep in sync with MockPaymentGateway. */
export const TEST_CARDS = {
  success: '4111111111111111',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
} as const;

export const CURRENCY = 'INR';
export const LOCALE = 'en-IN';

/** Amounts are stored as paise: 1 INR = 100 paise. */
export function formatPaise(paise: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
