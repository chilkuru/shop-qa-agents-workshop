import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatPaise } from '@shop/types';
import { api } from '../api/client';

export function ConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => api.order(orderNumber!),
    enabled: Boolean(orderNumber),
  });

  if (isLoading) return <p data-testid="confirmation-loading">Loading…</p>;
  if (!order) return <p data-testid="confirmation-not-found">Order not found.</p>;

  return (
    <section className="page" data-testid="confirmation-page">
      <h1 data-testid="confirmation-heading">Thank you for your order</h1>

      <p data-testid="confirmation-order-number">{order.orderNumber}</p>
      <p data-testid="confirmation-status">{order.status}</p>
      <p data-testid="confirmation-total">{formatPaise(order.totalPaise ?? 0)}</p>
      <p data-testid="confirmation-shipping-name">{order.shippingName}</p>
      <p data-testid="confirmation-shipping-address">{order.shippingAddress}</p>

      <ul data-testid="confirmation-items">
        {order.items?.map((item) => (
          <li key={item.productId} data-testid={`confirmation-item-${item.productId}`}>
            {item.productName} × {item.quantity} — {formatPaise(item.lineTotalPaise ?? 0)}
          </li>
        ))}
      </ul>

      <Link to="/orders" data-testid="view-orders-link">
        View all orders
      </Link>
    </section>
  );
}
