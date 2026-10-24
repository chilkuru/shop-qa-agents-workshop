import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatPaise } from '@shop/types';
import { api, imageUrl } from '../api/client';

export function CartPage() {
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const { data: cart, isLoading } = useQuery({ queryKey: ['cart'], queryFn: api.cart });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cart'] });

  const updateItem = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      api.updateCartItem(productId, { quantity }),
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: (productId: number) => api.removeCartItem(productId),
    onSuccess: invalidate,
  });

  const applyCoupon = useMutation({
    mutationFn: () => api.applyCoupon(couponCode.trim()),
    onSuccess: () => {
      setCouponError(null);
      invalidate();
    },
    onError: (e: unknown) =>
      setCouponError(e instanceof Error ? e.message : 'That coupon cannot be used'),
  });

  const removeCoupon = useMutation({
    mutationFn: () => api.removeCoupon(),
    onSuccess: () => {
      setCouponCode('');
      setCouponError(null);
      invalidate();
    },
  });

  if (isLoading) return <p data-testid="cart-loading">Loading…</p>;

  const isEmpty = !cart?.items || cart.items.length === 0;

  return (
    <section className="page" data-testid="cart-page">
      <h1 data-testid="cart-heading">Your cart</h1>

      {isEmpty ? (
        <p data-testid="cart-empty">Your cart is empty.</p>
      ) : (
        <>
          <ul className="cart-list" data-testid="cart-list">
            {cart!.items!.map((item) => (
              <li key={item.productId} data-testid={`cart-row-${item.productId}`}>
                <img
                  className="cart-thumb"
                  src={imageUrl(item.imageUrl)}
                  alt={item.name}
                  data-testid={`cart-image-${item.productId}`}
                />
                <span data-testid={`cart-name-${item.productId}`}>{item.name}</span>
                <span data-testid={`cart-unit-price-${item.productId}`}>
                  {formatPaise(item.unitPricePaise ?? 0)}
                </span>

                <button
                  type="button"
                  data-testid={`cart-decrement-${item.productId}`}
                  onClick={() =>
                    updateItem.mutate({
                      productId: item.productId!,
                      quantity: (item.quantity ?? 1) - 1,
                    })
                  }
                >
                  −
                </button>

                <span data-testid={`cart-quantity-${item.productId}`}>{item.quantity}</span>

                <button
                  type="button"
                  data-testid={`cart-increment-${item.productId}`}
                  onClick={() =>
                    updateItem.mutate({
                      productId: item.productId!,
                      quantity: (item.quantity ?? 0) + 1,
                    })
                  }
                >
                  +
                </button>

                <span data-testid={`cart-line-total-${item.productId}`}>
                  {formatPaise(item.lineTotalPaise ?? 0)}
                </span>

                <button
                  type="button"
                  data-testid={`cart-remove-${item.productId}`}
                  onClick={() => removeItem.mutate(item.productId!)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <form
            data-testid="coupon-form"
            onSubmit={(e) => {
              e.preventDefault();
              applyCoupon.mutate();
            }}
          >
            <input
              data-testid="coupon-input"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Coupon code"
            />
            <button type="submit" data-testid="coupon-apply" disabled={applyCoupon.isPending}>
              Apply
            </button>
            {cart!.couponCode ? (
              <button
                type="button"
                data-testid="coupon-remove"
                onClick={() => removeCoupon.mutate()}
              >
                Remove coupon
              </button>
            ) : null}
            {couponError ? <p data-testid="coupon-error">{couponError}</p> : null}
          </form>

          <p data-testid="cart-subtotal">{formatPaise(cart!.subtotalPaise ?? 0)}</p>
          {cart!.couponCode ? (
            <p data-testid="cart-coupon-code">{cart!.couponCode}</p>
          ) : null}
          <p data-testid="cart-discount">{formatPaise(cart!.discountPaise ?? 0)}</p>
          <p data-testid="cart-total">{formatPaise(cart!.totalPaise ?? 0)}</p>
          <p data-testid="cart-total-quantity">{cart!.totalQuantity} items</p>

          <Link to="/checkout" data-testid="checkout-link">
            Proceed to checkout
          </Link>
        </>
      )}
    </section>
  );
}
