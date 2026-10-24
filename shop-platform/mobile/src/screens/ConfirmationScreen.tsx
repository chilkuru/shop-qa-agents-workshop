import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api, formatPaise } from '../api/client';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Confirmation'>;

export function ConfirmationScreen({ route, navigation }: Props) {
  const { orderNumber } = route.params;

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => api.order(orderNumber),
  });

  if (isLoading) return <ActivityIndicator testID="confirmation-loading" style={styles.center} />;
  if (!order) {
    return (
      <Text style={styles.center} testID="confirmation-not-found">
        Order not found.
      </Text>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} testID="confirmation-screen">
      <Text style={styles.heading} testID="confirmation-heading">
        Thank you for your order
      </Text>

      <Text style={styles.orderNumber} testID="confirmation-order-number">
        {order.orderNumber}
      </Text>
      <Text style={styles.meta} testID="confirmation-status">
        {order.status}
      </Text>
      <Text style={styles.total} testID="confirmation-total">
        {formatPaise(order.totalPaise)}
      </Text>
      <Text style={styles.meta} testID="confirmation-shipping-name">
        {order.shippingName}
      </Text>
      <Text style={styles.meta} testID="confirmation-shipping-address">
        {order.shippingAddress}
      </Text>

      {order.items.map((item) => (
        <Text
          key={item.productId}
          style={styles.item}
          testID={`confirmation-item-${item.productId}`}>
          {item.productName} × {item.quantity} — {formatPaise(item.lineTotalPaise)}
        </Text>
      ))}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Orders')}
        testID="view-orders-link">
        <Text style={styles.buttonText}>View all orders</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: theme.bg, flexGrow: 1 },
  center: { marginTop: 40, textAlign: 'center', color: theme.muted },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: theme.text },
  orderNumber: { fontSize: 20, fontWeight: '700', color: theme.primary },
  meta: { color: theme.muted, marginTop: 4 },
  total: { fontSize: 22, fontWeight: '700', marginTop: 10, color: theme.text },
  item: { marginTop: 8, color: theme.text },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
