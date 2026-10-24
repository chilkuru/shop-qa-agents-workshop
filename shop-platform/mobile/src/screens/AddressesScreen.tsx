import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type SaveAddress } from '../api/client';
import { theme } from '../theme';

const BLANK: SaveAddress = {
  label: '',
  recipient: '',
  line1: '',
  city: '',
  state: '',
  postalCode: '',
};

export function AddressesScreen() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SaveAddress>(BLANK);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['addresses'], queryFn: api.addresses });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['addresses'] });

  const save = useMutation({
    mutationFn: () => api.saveAddress(form),
    onSuccess: () => {
      setForm(BLANK);
      setError(null);
      invalidate();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Could not save'),
  });

  const makeDefault = useMutation({
    mutationFn: (id: number) => api.makeAddressDefault(id),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteAddress(id),
    onSuccess: invalidate,
  });

  if (isLoading) return <ActivityIndicator testID="addresses-loading" style={styles.center} />;

  const addresses = data?.addresses ?? [];
  const field = (name: keyof SaveAddress, placeholder: string) => (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={form[name]}
      onChangeText={(v) => setForm({ ...form, [name]: v })}
      testID={`address-${name}-input`}
    />
  );

  return (
    <ScrollView contentContainerStyle={styles.container} testID="addresses-screen">
      <Text style={styles.heading} testID="addresses-heading">
        Delivery addresses
      </Text>
      <Text style={styles.meta} testID="addresses-count">
        {addresses.length} saved
      </Text>

      {addresses.length === 0 ? (
        <Text style={styles.center} testID="addresses-empty">
          You have no saved addresses.
        </Text>
      ) : (
        <View testID="addresses-list">
          {addresses.map((a) => (
            <View key={a.id} style={styles.row} testID={`address-row-${a.id}`}>
              <Text style={styles.name} testID={`address-label-${a.id}`}>
                {a.label}
              </Text>
              <Text style={styles.meta} testID={`address-formatted-${a.id}`}>
                {a.formatted}
              </Text>
              {a.isDefault ? (
                <Text style={styles.badge} testID={`address-default-${a.id}`}>
                  Default
                </Text>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => makeDefault.mutate(a.id)}
                  disabled={a.isDefault}
                  testID={`address-make-default-${a.id}`}>
                  <Text style={styles.action}>Make default</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => remove.mutate(a.id)}
                  testID={`address-delete-${a.id}`}>
                  <Text style={styles.remove}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.subheading}>Add an address</Text>
      <View testID="address-form">
        {field('label', 'Label')}
        {field('recipient', 'Recipient')}
        {field('line1', 'Address line')}
        {field('city', 'City')}
        {field('state', 'State')}
        {field('postalCode', 'Postal code')}

        {error ? (
          <Text style={styles.error} testID="address-error">
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          onPress={() => save.mutate()}
          disabled={save.isPending}
          testID="address-save-button">
          <Text style={styles.buttonText}>Save address</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: theme.bg, flexGrow: 1 },
  heading: { fontSize: 26, fontWeight: '700', marginBottom: 8, color: theme.text },
  subheading: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 10, color: theme.text },
  center: { marginTop: 20, textAlign: 'center', color: theme.muted },
  meta: { color: theme.muted, fontSize: 13 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  name: { fontSize: 15, fontWeight: '600', color: theme.text },
  badge: { color: theme.primary, fontWeight: '700', fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 6 },
  action: { color: theme.primary, fontWeight: '600', fontSize: 13 },
  remove: { color: theme.danger, fontWeight: '600', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  error: { color: theme.danger, marginBottom: 8 },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
