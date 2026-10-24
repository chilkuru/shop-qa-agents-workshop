import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api, formatPaise, type WishlistItem } from '../api/client';
import { ProductImage } from '../components/ProductImage';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Wishlist'>;

export function WishlistScreen({ navigation }: Props) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['wishlist'], queryFn: api.wishlist });

  const remove = useMutation({
    mutationFn: (productId: number) => api.removeFromWishlist(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const moveToCart = useMutation({
    mutationFn: async (productId: number) => {
      await api.addToCart(productId, 1);
      return api.removeFromWishlist(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  if (isLoading) return <ActivityIndicator testID="wishlist-loading" style={styles.center} />;

  const items = data?.items ?? [];

  function renderRow({ item }: { item: WishlistItem }) {
    return (
      <View style={styles.row} testID={`wishlist-row-${item.productId}`}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductDetail', { id: item.productId })}
          testID={`wishlist-link-${item.productId}`}>
          <ProductImage
            path={item.imageUrl}
            width={72}
            height={54}
            testID={`wishlist-image-${item.productId}`}
          />
        </TouchableOpacity>

        <View style={styles.rowText}>
          <Text style={styles.name} testID={`wishlist-name-${item.productId}`}>
            {item.name}
          </Text>
          <Text style={styles.meta} testID={`wishlist-price-${item.productId}`}>
            {formatPaise(item.pricePaise)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => moveToCart.mutate(item.productId)}
          disabled={!item.inStock || moveToCart.isPending}
          testID={`wishlist-move-${item.productId}`}>
          <Text style={styles.action}>Move to cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => remove.mutate(item.productId)}
          testID={`wishlist-remove-${item.productId}`}>
          <Text style={styles.remove}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="wishlist-screen">
      <Text style={styles.heading} testID="wishlist-heading">
        Saved for later
      </Text>
      <Text style={styles.meta} testID="wishlist-count">
        {items.length} saved
      </Text>

      {items.length === 0 ? (
        <Text style={styles.center} testID="wishlist-empty">
          You have not saved anything yet.
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.productId)}
          renderItem={renderRow}
          testID="wishlist-list"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.bg },
  heading: { fontSize: 26, fontWeight: '700', marginBottom: 8, color: theme.text },
  center: { marginTop: 24, textAlign: 'center', color: theme.muted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  rowText: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: theme.text },
  meta: { color: theme.muted, fontSize: 13 },
  action: { color: theme.primary, fontWeight: '600', fontSize: 13 },
  remove: { color: theme.danger, fontWeight: '600', fontSize: 13 },
});
