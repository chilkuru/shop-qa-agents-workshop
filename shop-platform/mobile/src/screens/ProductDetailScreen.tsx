import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api, formatPaise } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ProductImage } from '../components/ProductImage';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route }: Props) {
  const { id } = route.params;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.product(id),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api.reviews(id),
  });

  const addToCart = useMutation({
    mutationFn: () => api.addToCart(id, 1),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const saveForLater = useMutation({
    mutationFn: () => api.addToWishlist(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const submitReview = useMutation({
    mutationFn: () => api.submitReview(id, Number(rating), comment),
    onSuccess: () => {
      setReviewError(null);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
    },
    onError: (e: unknown) =>
      setReviewError(e instanceof Error ? e.message : 'Could not submit review'),
  });

  if (isLoading) return <ActivityIndicator testID="product-loading" style={styles.center} />;
  if (!product) {
    return (
      <Text style={styles.center} testID="product-not-found">
        Product not found.
      </Text>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} testID="product-detail-screen">
      <ProductImage path={product.imageUrl} width={320} height={200} testID="detail-image" />

      <Text style={styles.name} testID="detail-name">
        {product.name}
      </Text>
      <Text style={styles.meta} testID="detail-sku">
        {product.sku}
      </Text>
      <Text style={styles.meta} testID="detail-category">
        {product.category}
      </Text>
      <Text style={styles.description} testID="detail-description">
        {product.description}
      </Text>
      <Text style={styles.price} testID="detail-price">
        {formatPaise(product.pricePaise)}
      </Text>
      <Text style={styles.meta} testID="detail-stock">
        {product.inStock ? 'In stock' : 'Out of stock'}
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          (!user || !product.inStock || addToCart.isPending) && styles.buttonDisabled,
        ]}
        disabled={!user || !product.inStock || addToCart.isPending}
        onPress={() => addToCart.mutate()}
        testID="detail-add-to-cart">
        <Text style={styles.buttonText}>{user ? 'Add to cart' : 'Log in to buy'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, (!user || saveForLater.isPending) && styles.buttonDisabled]}
        disabled={!user || saveForLater.isPending}
        onPress={() => saveForLater.mutate()}
        testID="detail-save-for-later">
        <Text style={styles.buttonText}>
          {saveForLater.isSuccess ? 'Saved' : 'Save for later'}
        </Text>
      </TouchableOpacity>

      <View testID="reviews-panel">
        <Text style={styles.sectionHeading} testID="reviews-heading">
          Reviews
        </Text>
        <Text style={styles.meta} testID="reviews-count">
          {reviews?.count ?? 0} reviews
        </Text>
        <Text style={styles.meta} testID="reviews-average">
          {(reviews?.averageRating ?? 0).toFixed(1)}
        </Text>

        {(reviews?.reviews ?? []).length === 0 ? (
          <Text style={styles.meta} testID="reviews-empty">
            No reviews yet.
          </Text>
        ) : (
          <View testID="reviews-list">
            {(reviews?.reviews ?? []).map((r) => (
              <View key={r.id} style={styles.reviewRow} testID={`review-row-${r.id}`}>
                <Text style={styles.meta} testID={`review-author-${r.id}`}>
                  {r.author}
                </Text>
                <Text style={styles.meta} testID={`review-rating-${r.id}`}>
                  {r.rating}
                </Text>
                <Text style={styles.meta} testID={`review-comment-${r.id}`}>
                  {r.comment}
                </Text>
              </View>
            ))}
          </View>
        )}

        {reviews?.canReview ? (
          <View testID="review-form">
            <TextInput
              style={styles.input}
              value={rating}
              onChangeText={setRating}
              keyboardType="number-pad"
              testID="review-rating-input"
            />
            <TextInput
              style={styles.input}
              value={comment}
              onChangeText={setComment}
              placeholder="What did you think?"
              testID="review-comment-input"
            />
            <TouchableOpacity
              style={styles.button}
              onPress={() => submitReview.mutate()}
              disabled={submitReview.isPending}
              testID="review-submit">
              <Text style={styles.buttonText}>Submit review</Text>
            </TouchableOpacity>
            {reviewError ? (
              <Text style={styles.error} testID="review-error">
                {reviewError}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.meta} testID="review-not-allowed">
            Only shoppers who bought this product can review it.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: theme.bg, flexGrow: 1 },
  sectionHeading: { fontSize: 20, fontWeight: '700', color: theme.text, marginTop: 28 },
  error: { color: theme.danger, marginTop: 8 },
  reviewRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    backgroundColor: '#fff',
  },
  center: { marginTop: 40, textAlign: 'center' },
  name: { fontSize: 24, fontWeight: '700', color: theme.text, marginTop: 16 },
  meta: { color: theme.muted, marginTop: 4 },
  description: { marginTop: 12, color: theme.text, lineHeight: 20 },
  price: { fontSize: 22, fontWeight: '700', marginTop: 14, color: theme.text },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { backgroundColor: theme.muted },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
