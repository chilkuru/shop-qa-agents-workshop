import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [stockDraft, setStockDraft] = useState<Record<number, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-products'],
    queryFn: api.adminProducts,
    // A non-admin gets 403; surface that rather than retrying it.
    retry: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const setStock = useMutation({
    mutationFn: ({ id, stock }: { id: number; stock: number }) => api.adminSetStock(id, stock),
    onSuccess: invalidate,
  });

  const setActive = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => api.adminSetActive(id, active),
    onSuccess: invalidate,
  });

  if (!user || user.role !== 'ADMIN' || error) {
    return (
      <section data-testid="admin-page">
        <h1 data-testid="admin-heading">Catalog administration</h1>
        <p data-testid="admin-forbidden">This area requires the ADMIN role.</p>
      </section>
    );
  }

  if (isLoading) return <p data-testid="admin-loading">Loading&hellip;</p>;

  const products = data ?? [];

  return (
    <section data-testid="admin-page">
      <h1 data-testid="admin-heading">Catalog administration</h1>
      <p data-testid="admin-count">{products.length} products</p>

      <table data-testid="admin-list">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Visible</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} data-testid={`admin-row-${p.id}`}>
              <td data-testid={`admin-name-${p.id}`}>{p.name}</td>
              <td data-testid={`admin-category-${p.id}`}>{p.category}</td>
              <td>
                <span data-testid={`admin-stock-${p.id}`}>{p.stock}</span>
                <input
                  data-testid={`admin-stock-input-${p.id}`}
                  value={stockDraft[p.id!] ?? ''}
                  onChange={(e) => setStockDraft({ ...stockDraft, [p.id!]: e.target.value })}
                />
                <button
                  type="button"
                  data-testid={`admin-stock-save-${p.id}`}
                  onClick={() =>
                    setStock.mutate({ id: p.id!, stock: Number(stockDraft[p.id!] ?? p.stock ?? 0) })
                  }
                >
                  Set stock
                </button>
              </td>
              <td>
                <span data-testid={`admin-active-${p.id}`}>{p.active ? 'Visible' : 'Hidden'}</span>
                <button
                  type="button"
                  data-testid={`admin-toggle-${p.id}`}
                  onClick={() => setActive.mutate({ id: p.id!, active: !p.active })}
                >
                  {p.active ? 'Hide' : 'Show'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
