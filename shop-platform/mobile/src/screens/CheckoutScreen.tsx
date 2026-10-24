import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api, formatPaise } from '../api/client';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

export function CheckoutScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const { data: cart } = useQuery({ queryKey: ['cart'], queryFn: api.cart });

  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [error, setError] = useState<string | null>(null);

  const checkout = useMutation({
    mutationFn: () =>
      api.checkout({
        shippingName,
        shippingAddress,
        card: { number: cardNumber, expiry, cvc },
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigation.replace('Confirmation', { orderNumber: order.orderNumber });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Payment failed'),
  });

  return (
    <ScrollView contentContainerStyle={styles.container} testID="checkout-screen">
      <Text style={styles.heading} testID="checkout-heading">
        Checkout
      </Text>

      <Text style={styles.total} testID="checkout-total">
        {formatPaise(cart?.totalPaise ?? 0)}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={shippingName}
        onChangeText={setShippingName}
        testID="shipping-name-input"
      />
      <TextInput
        style={styles.input}
        placeholder="Shipping address"
        value={shippingAddress}
        onChangeText={setShippingAddress}
        testID="shipping-address-input"
      />
      <TextInput
        style={styles.input}
        placeholder="Card number"
        keyboardType="number-pad"
        value={cardNumber}
        onChangeText={setCardNumber}
        testID="card-number-input"
      />
      <TextInput
        style={styles.input}
        placeholder="MM/YY"
        value={expiry}
        onChangeText={setExpiry}
        testID="card-expiry-input"
      />
      <TextInput
        style={styles.input}
        placeholder="CVC"
        keyboardType="number-pad"
        value={cvc}
        onChangeText={setCvc}
        testID="card-cvc-input"
      />

      {error && (
        <Text style={styles.error} testID="checkout-error">
          {error}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, checkout.isPending && styles.buttonDisabled]}
        disabled={checkout.isPending}
        onPress={() => {
          setError(null);
          checkout.mutate();
        }}
        testID="place-order-button">
        {checkout.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Place order</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: theme.bg, flexGrow: 1 },
  heading: { fontSize: 26, fontWeight: '700', marginBottom: 16, color: theme.text },
  total: { fontSize: 24, fontWeight: '700', marginBottom: 18, color: theme.text },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: { backgroundColor: theme.muted },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: theme.danger, marginBottom: 8 },
});
