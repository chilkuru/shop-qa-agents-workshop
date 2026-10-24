import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatPaise } from '@shop/types';
import { api, imageUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.product(productId),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => api.reviews(productId),
  });

  const addToCart = useMutation({
    mutationFn: () => api.addToCart({ productId, quantity: 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const saveForLater = useMutation({
    mutationFn: () => api.addToWishlist(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const submitReview = useMutation({
    mutationFn: () => api.submitReview(productId, { rating: Number(rating), comment }),
    onSuccess: () => {
      setReviewError(null);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
    onError: (e: unknown) =>
      setReviewError(e instanceof Error ? e.message : 'Could not submit review'),
  });

  if (isLoading) return <p data-testid="product-loading">Loading…</p>;
  if (!product) return <p data-testid="product-not-found">Product not found.</p>;

  return (
    <section className="page product-detail" data-testid="product-detail-page">
      <img
        className="detail-image"
        src={imageUrl(product.imageUrl)}
        alt={product.name}
        data-testid="detail-image"
      />

      <div>
        <h1 data-testid="detail-name">{product.name}</h1>
        <p data-testid="detail-sku">{product.sku}</p>
        <p data-testid="detail-category">{product.category}</p>
        <p data-testid="detail-description">{product.description}</p>
        <p data-testid="detail-price">{formatPaise(product.pricePaise ?? 0)}</p>
        <p data-testid="detail-stock">{product.inStock ? 'In stock' : 'Out of stock'}</p>

        <button
          type="button"
          data-testid="detail-add-to-cart"
          disabled={!user || !product.inStock || addToCart.isPending}
          onClick={() => addToCart.mutate()}
        >
          {user ? 'Add to cart' : 'Log in to buy'}
        </button>

        <button
          type="button"
          data-testid="detail-save-for-later"
          disabled={!user || saveForLater.isPending}
          onClick={() => saveForLater.mutate()}
        >
          {saveForLater.isSuccess ? 'Saved' : 'Save for later'}
        </button>
      </div>

      <section data-testid="reviews-panel">
        <h2 data-testid="reviews-heading">Reviews</h2>
        <p data-testid="reviews-count">{reviews?.count ?? 0} reviews</p>
        <p data-testid="reviews-average">{(reviews?.averageRating ?? 0).toFixed(1)}</p>

        {(reviews?.reviews ?? []).length === 0 ? (
          <p data-testid="reviews-empty">No reviews yet.</p>
        ) : (
          <ul data-testid="reviews-list">
            {(reviews?.reviews ?? []).map((r) => (
              <li key={r.id} data-testid={`review-row-${r.id}`}>
                <span data-testid={`review-author-${r.id}`}>{r.author}</span>
                <span data-testid={`review-rating-${r.id}`}>{r.rating}</span>
                <span data-testid={`review-comment-${r.id}`}>{r.comment}</span>
              </li>
            ))}
          </ul>
        )}

        {reviews?.canReview ? (
          <form
            data-testid="review-form"
            onSubmit={(e) => {
              e.preventDefault();
              submitReview.mutate();
            }}
          >
            <select
              data-testid="review-rating-select"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <input
              data-testid="review-comment-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think?"
            />
            <button type="submit" data-testid="review-submit" disabled={submitReview.isPending}>
              Submit review
            </button>
            {reviewError ? <p data-testid="review-error">{reviewError}</p> : null}
          </form>
        ) : (
          <p data-testid="review-not-allowed">Only shoppers who bought this product can review it.</p>
        )}
      </section>
    </section>
  );
}
