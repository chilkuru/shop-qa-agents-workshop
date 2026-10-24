import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { theme } from '../theme';
import type { RootStackParamList } from '../navigation';

export function HeaderActions() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: api.cart,
    enabled: Boolean(user),
  });

  return (
    <View style={styles.row} testID="header-actions">
      <TouchableOpacity onPress={() => navigation.navigate('Cart')} testID="nav-cart">
        <Text style={styles.link}>
          Cart <Text testID="cart-badge">{cart?.totalQuantity ?? 0}</Text>
        </Text>
      </TouchableOpacity>

      {user ? (
        <>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')} testID="nav-orders">
            <Text style={styles.link}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Wishlist')} testID="nav-wishlist">
            <Text style={styles.link}>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Addresses')} testID="nav-addresses">
            <Text style={styles.link}>Addresses</Text>
          </TouchableOpacity>
          {user.role === 'ADMIN' ? (
            <TouchableOpacity onPress={() => navigation.navigate('Admin')} testID="nav-admin">
              <Text style={styles.link}>Admin</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.user} testID="current-user" numberOfLines={1}>
            {user.email}
          </Text>
          <TouchableOpacity
            onPress={async () => {
              await logout();
              navigation.navigate('Catalog');
            }}
            testID="logout-button">
            <Text style={styles.link}>Log out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity onPress={() => navigation.navigate('Login')} testID="nav-login">
          <Text style={styles.link}>Log in</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  link: { color: theme.primary, fontWeight: '600' },
  user: { color: theme.muted, maxWidth: 130, fontSize: 12 },
});
