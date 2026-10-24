import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api, formatPaise, type Order } from '../api/client';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;

export function OrdersScreen({ navigation }: Props) {
  const { data: orders, isLoading } = useQuery({ queryKey: ['orders'], queryFn: api.orders });

  if (isLoading) return <ActivityIndicator testID="orders-loading" style={styles.center} />;

  function renderOrder({ item }: { item: Order }) {
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('Confirmation', { orderNumber: item.orderNumber })}
        testID={`order-row-${item.orderNumber}`}>
        <Text style={styles.orderNumber} testID={`order-link-${item.orderNumber}`}>
          {item.orderNumber}
        </Text>
        <Text style={styles.meta} testID={`order-status-${item.orderNumber}`}>
          {item.status}
        </Text>
        <Text style={styles.total} testID={`order-total-${item.orderNumber}`}>
          {formatPaise(item.totalPaise)}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container} testID="orders-screen">
      <Text style={styles.heading} testID="orders-heading">
        Your orders
      </Text>

      <FlatList
        data={orders ?? []}
        keyExtractor={(o) => o.orderNumber}
        renderItem={renderOrder}
        testID="orders-list"
        ListEmptyComponent={
          <Text style={styles.center} testID="orders-empty">
            You have no orders yet.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.bg },
  heading: { fontSize: 26, fontWeight: '700', marginBottom: 16, color: theme.text },
  center: { marginTop: 40, textAlign: 'center', color: theme.muted },
  row: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 10,
  },
  orderNumber: { fontSize: 16, fontWeight: '700', color: theme.primary },
  meta: { color: theme.muted, marginTop: 2 },
  total: { fontSize: 16, fontWeight: '700', marginTop: 6, color: theme.text },
});
