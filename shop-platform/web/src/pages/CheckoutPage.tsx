import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatPaise } from '@shop/types';
import { api } from '../api/client';

export function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: api.cart });

  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [error, setError] = useState<string | null>(null);

  const checkout = useMutation({
    mutationFn: () =>
      api.checkout({
        shippingName,
        shippingAddress,
        card: { number: cardNumber, expiry, cvc },
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate(`/confirmation/${order.orderNumber}`);
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Payment failed'),
  });

  return (
    <section className="page" data-testid="checkout-page">
      <h1 data-testid="checkout-heading">Checkout</h1>

      <p data-testid="checkout-total">{formatPaise(cart?.totalPaise ?? 0)}</p>

      <form
        className="form"
        data-testid="checkout-form"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          checkout.mutate();
        }}
      >
        <label>
          Full name
          <input
            type="text"
            value={shippingName}
            onChange={(e) => setShippingName(e.target.value)}
            data-testid="shipping-name-input"
            required
          />
        </label>

        <label>
          Shipping address
          <input
            type="text"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            data-testid="shipping-address-input"
            required
          />
        </label>

        <label>
          Card number
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            data-testid="card-number-input"
            required
          />
        </label>

        <label>
          Expiry
          <input
            type="text"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            data-testid="card-expiry-input"
            required
          />
        </label>

        <label>
          CVC
          <input
            type="text"
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            data-testid="card-cvc-input"
            required
          />
        </label>

        {error && (
          <p className="error" data-testid="checkout-error">
            {error}
          </p>
        )}

        <button type="submit" disabled={checkout.isPending} data-testid="place-order-button">
          Place order
        </button>
      </form>
    </section>
  );
}
