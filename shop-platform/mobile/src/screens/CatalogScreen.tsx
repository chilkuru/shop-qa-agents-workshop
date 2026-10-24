import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api, formatPaise, type Product } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ProductImage } from '../components/ProductImage';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Catalog'>;

const CARD_IMAGE_WIDTH = 280;
const CARD_IMAGE_HEIGHT = 160;

export function CatalogScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.categories });

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, category],
    queryFn: () => api.products({ search, category }),
  });

  const addToCart = useMutation({
    mutationFn: (productId: number) => api.addToCart(productId, 1),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  function renderProduct({ item }: { item: Product }) {
    return (
      <View style={styles.card} testID={`product-card-${item.id}`}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
          testID={`product-link-${item.id}`}>
          <ProductImage
            path={item.imageUrl}
            width={CARD_IMAGE_WIDTH}
            height={CARD_IMAGE_HEIGHT}
            testID={`product-image-${item.id}`}
          />
          <Text style={styles.name} testID={`product-name-${item.id}`}>
            {item.name}
          </Text>
        </TouchableOpacity>

        <Text style={styles.meta} testID={`product-category-${item.id}`}>
          {item.category}
        </Text>
        <Text style={styles.price} testID={`product-price-${item.id}`}>
          {formatPaise(item.pricePaise)}
        </Text>
        <Text style={styles.meta} testID={`product-stock-${item.id}`}>
          {item.inStock ? 'In stock' : 'Out of stock'}
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            (!user || !item.inStock || addToCart.isPending) && styles.buttonDisabled,
          ]}
          disabled={!user || !item.inStock || addToCart.isPending}
          onPress={() => addToCart.mutate(item.id)}
          testID={`add-to-cart-${item.id}`}>
          <Text style={styles.buttonText}>{user ? 'Add to cart' : 'Log in to buy'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="catalog-screen">
      <Text style={styles.heading} testID="catalog-heading">
        Catalog
      </Text>

      <View style={styles.filters}>
        <TextInput
          style={styles.input}
          placeholder="Search products"
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={() => setSearch(searchInput)}
          testID="search-input"
        />
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => setSearch(searchInput)}
          testID="search-button">
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.smallButtonSecondary}
          onPress={() => {
            setSearchInput('');
            setSearch('');
            setCategory('');
          }}
          testID="clear-filters-button">
          <Text style={styles.smallButtonSecondaryText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chips} testID="category-filters">
        <TouchableOpacity
          style={[styles.chip, category === '' && styles.chipActive]}
          onPress={() => setCategory('')}
          testID="category-all">
          <Text style={category === '' ? styles.chipTextActive : styles.chipText}>
            All categories
          </Text>
        </TouchableOpacity>

        {categories?.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && styles.chipActive]}
            onPress={() => setCategory(c)}
            testID={`category-${c}`}>
            <Text style={category === c ? styles.chipTextActive : styles.chipText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.count} testID="result-count">
        {data?.totalItems ?? 0} products
      </Text>

      {isLoading ? (
        <ActivityIndicator testID="catalog-loading" />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderProduct}
          testID="product-list"
          ListEmptyComponent={
            <Text style={styles.meta} testID="no-results">
              No products matched your search.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.bg },
  heading: { fontSize: 26, fontWeight: '700', marginBottom: 16, color: theme.text },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { color: theme.text },
  chipTextActive: { color: '#fff' },
  count: { color: theme.muted, marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 10,
  },
  name: { fontSize: 17, fontWeight: '600', color: theme.text, marginTop: 10 },
  meta: { color: theme.muted, marginTop: 2 },
  price: { fontSize: 16, fontWeight: '700', marginTop: 6, color: theme.text },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  smallButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  smallButtonSecondary: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.muted,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  smallButtonSecondaryText: { color: theme.text, fontWeight: '600' },
  buttonDisabled: { backgroundColor: theme.muted },
  buttonText: { color: '#fff', fontWeight: '600' },
});
