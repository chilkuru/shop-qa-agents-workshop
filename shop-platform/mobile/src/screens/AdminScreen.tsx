import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { theme } from '../theme';

export function AdminScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [stockDraft, setStockDraft] = useState<Record<number, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-products'],
    queryFn: api.adminProducts,
    // A non-admin gets 403; surface that rather than retrying it.
    retry: false,
    enabled: user?.role === 'ADMIN',
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

  if (user?.role !== 'ADMIN' || error) {
    return (
      <View style={styles.container} testID="admin-screen">
        <Text style={styles.heading} testID="admin-heading">
          Catalog administration
        </Text>
        <Text style={styles.center} testID="admin-forbidden">
          This area requires the ADMIN role.
        </Text>
      </View>
    );
  }

  if (isLoading) return <ActivityIndicator testID="admin-loading" style={styles.center} />;

  const products = data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container} testID="admin-screen">
      <Text style={styles.heading} testID="admin-heading">
        Catalog administration
      </Text>
      <Text style={styles.meta} testID="admin-count">
        {products.length} products
      </Text>

      <View testID="admin-list">
        {products.map((p) => (
          <View key={p.id} style={styles.row} testID={`admin-row-${p.id}`}>
            <Text style={styles.name} testID={`admin-name-${p.id}`}>
              {p.name}
            </Text>
            <Text style={styles.meta} testID={`admin-category-${p.id}`}>
              {p.category}
            </Text>

            <View style={styles.actions}>
              <Text style={styles.meta} testID={`admin-stock-${p.id}`}>
                {p.stock}
              </Text>
              <TextInput
                style={styles.input}
                value={stockDraft[p.id] ?? ''}
                onChangeText={(v) => setStockDraft({ ...stockDraft, [p.id]: v })}
                keyboardType="number-pad"
                testID={`admin-stock-input-${p.id}`}
              />
              <TouchableOpacity
                onPress={() =>
                  setStock.mutate({ id: p.id, stock: Number(stockDraft[p.id] ?? p.stock) })
                }
                testID={`admin-stock-save-${p.id}`}>
                <Text style={styles.action}>Set stock</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actions}>
              <Text style={styles.meta} testID={`admin-active-${p.id}`}>
                {p.active ? 'Visible' : 'Hidden'}
              </Text>
              <TouchableOpacity
                onPress={() => setActive.mutate({ id: p.id, active: !p.active })}
                testID={`admin-toggle-${p.id}`}>
                <Text style={styles.action}>{p.active ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: theme.bg, flexGrow: 1 },
  heading: { fontSize: 26, fontWeight: '700', marginBottom: 8, color: theme.text },
  center: { marginTop: 20, textAlign: 'center', color: theme.muted },
  meta: { color: theme.muted, fontSize: 13 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  name: { fontSize: 15, fontWeight: '600', color: theme.text },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  action: { color: theme.primary, fontWeight: '600', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    backgroundColor: '#fff',
  },
});
