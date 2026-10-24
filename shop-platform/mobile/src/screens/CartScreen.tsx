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
import { api, formatPaise, type CartItem } from '../api/client';
import { ProductImage } from '../components/ProductImage';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const { data: cart, isLoading } = useQuery({ queryKey: ['cart'], queryFn: api.cart });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cart'] });

  const updateItem = useMutation({
    mutationFn: (v: { productId: number; quantity: number }) =>
      api.updateCartItem(v.productId, v.quantity),
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

  if (isLoading) return <ActivityIndicator testID="cart-loading" style={styles.center} />;

  const isEmpty = !cart?.items || cart.items.length === 0;

  function renderRow({ item }: { item: CartItem }) {
    return (
      <View style={styles.row} testID={`cart-row-${item.productId}`}>
        <View style={styles.rowHeader}>
          <ProductImage
            path={item.imageUrl}
            width={72}
            height={54}
            testID={`cart-image-${item.productId}`}
          />
          <View style={styles.rowHeaderText}>
            <Text style={styles.name} testID={`cart-name-${item.productId}`}>
              {item.name}
            </Text>
            <Text style={styles.meta} testID={`cart-unit-price-${item.productId}`}>
              {formatPaise(item.unitPricePaise)}
            </Text>
          </View>
        </View>

        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() =>
              updateItem.mutate({ productId: item.productId, quantity: item.quantity - 1 })
            }
            testID={`cart-decrement-${item.productId}`}>
            <Text style={styles.qtyText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.qty} testID={`cart-quantity-${item.productId}`}>
            {item.quantity}
          </Text>

          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() =>
              updateItem.mutate({ productId: item.productId, quantity: item.quantity + 1 })
            }
            testID={`cart-increment-${item.productId}`}>
            <Text style={styles.qtyText}>+</Text>
          </TouchableOpacity>

          <Text style={styles.lineTotal} testID={`cart-line-total-${item.productId}`}>
            {formatPaise(item.lineTotalPaise)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => removeItem.mutate(item.productId)}
          testID={`cart-remove-${item.productId}`}>
          <Text style={styles.remove}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="cart-screen">
      <Text style={styles.heading} testID="cart-heading">
        Your cart
      </Text>

      {isEmpty ? (
        <Text style={styles.center} testID="cart-empty">
          Your cart is empty.
        </Text>
      ) : (
        <>
          <FlatList
            data={cart!.items}
            keyExtractor={(i) => String(i.productId)}
            renderItem={renderRow}
            testID="cart-list"
          />

          <View testID="coupon-form" style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Coupon code"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
              testID="coupon-input"
            />
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => applyCoupon.mutate()}
              disabled={applyCoupon.isPending}
              testID="coupon-apply">
              <Text style={styles.buttonText}>Apply</Text>
            </TouchableOpacity>
            {cart!.couponCode ? (
              <TouchableOpacity onPress={() => removeCoupon.mutate()} testID="coupon-remove">
                <Text style={styles.remove}>Remove coupon</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {couponError ? (
            <Text style={styles.error} testID="coupon-error">
              {couponError}
            </Text>
          ) : null}

          <Text style={styles.meta} testID="cart-subtotal">
            {formatPaise(cart!.subtotalPaise)}
          </Text>
          {cart!.couponCode ? (
            <Text style={styles.meta} testID="cart-coupon-code">
              {cart!.couponCode}
            </Text>
          ) : null}
          <Text style={styles.meta} testID="cart-discount">
            {formatPaise(cart!.discountPaise)}
          </Text>
          <Text style={styles.total} testID="cart-total">
            {formatPaise(cart!.totalPaise)}
          </Text>
          <Text style={styles.meta} testID="cart-total-quantity">
            {cart!.totalQuantity} items
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Checkout')}
            testID="checkout-link">
            <Text style={styles.buttonText}>Proceed to checkout</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.bg },
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  smallButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  error: { color: theme.danger, marginTop: 6 },  heading: { fontSize: 26, fontWeight: '700', marginBottom: 16, color: theme.text },
  center: { marginTop: 40, textAlign: 'center', color: theme.muted },
  row: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: '600', color: theme.text },
  rowHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  rowHeaderText: { flex: 1 },
  meta: { color: theme.muted, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  qty: { fontSize: 16, minWidth: 24, textAlign: 'center', color: theme.text },
  lineTotal: { marginLeft: 'auto', fontWeight: '700', color: theme.text },
  remove: { color: theme.danger, marginTop: 10 },
  total: { fontSize: 22, fontWeight: '700', marginTop: 8, color: theme.text },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
