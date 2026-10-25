import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatPaise } from '@shop/types';
import { api, imageUrl } from '../api/client';

export function WishlistPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['wishlist'], queryFn: api.wishlist });

  const remove = useMutation({
    mutationFn: (productId: number) => api.removeFromWishlist(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const moveToCart = useMutation({
    mutationFn: async (productId: number) => {
      await api.addToCart({ productId, quantity: 1 });
      return api.removeFromWishlist(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  if (isLoading) return <p data-testid="wishlist-loading">Loading&hellip;</p>;

  const items = data?.items ?? [];

  return (
    <section data-testid="wishlist-page">
      <h1 data-testid="wishlist-heading">Saved for later</h1>
      <p data-testid="wishlist-count">{items.length} saved</p>

      {items.length === 0 ? (
        <p data-testid="wishlist-empty">You have not saved anything yet.</p>
      ) : (
        <ul className="product-grid" data-testid="wishlist-list">
          {items.map((item) => (
            <li key={item.productId} className="product-card" data-testid={`wishlist-row-${item.productId}`}>
              <Link to={`/products/${item.productId}`} data-testid={`wishlist-link-${item.productId}`}>
                <img
                  className="product-image"
                  src={imageUrl(item.imageUrl)}
                  alt={item.name}
                  loading="lazy"
                  data-testid={`wishlist-image-${item.productId}`}
                />
                <h2 data-testid={`wishlist-name-${item.productId}`}>{item.name}</h2>
              </Link>
              <p data-testid={`wishlist-price-${item.productId}`}>
                {formatPaise(item.pricePaise ?? 0)}
              </p>

              <button
                type="button"
                data-testid={`wishlist-move-${item.productId}`}
                disabled={!item.inStock || moveToCart.isPending}
                onClick={() => moveToCart.mutate(item.productId!)}
              >
                Move to cart
              </button>
              <button
                type="button"
                data-testid={`wishlist-remove-${item.productId}`}
                disabled={remove.isPending}
                onClick={() => remove.mutate(item.productId!)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
