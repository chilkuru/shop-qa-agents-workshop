import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatPaise } from '@shop/types';
import { api } from '../api/client';

export function OrdersPage() {
  const { data: orders, isLoading } = useQuery({ queryKey: ['orders'], queryFn: api.orders });

  if (isLoading) return <p data-testid="orders-loading">Loading…</p>;

  return (
    <section className="page" data-testid="orders-page">
      <h1 data-testid="orders-heading">Your orders</h1>

      {!orders || orders.length === 0 ? (
        <p data-testid="orders-empty">You have no orders yet.</p>
      ) : (
        <ul className="order-list" data-testid="orders-list">
          {orders.map((order) => (
            <li key={order.orderNumber} data-testid={`order-row-${order.orderNumber}`}>
              <Link to={`/confirmation/${order.orderNumber}`} data-testid={`order-link-${order.orderNumber}`}>
                {order.orderNumber}
              </Link>
              <span className="order-status" data-testid={`order-status-${order.orderNumber}`}>{order.status}</span>
              <span className="order-total" data-testid={`order-total-${order.orderNumber}`}>
                {formatPaise(order.totalPaise ?? 0)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
