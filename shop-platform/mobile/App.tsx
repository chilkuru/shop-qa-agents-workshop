import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/auth/AuthContext';
import { HeaderActions } from './src/components/HeaderActions';
import type { RootStackParamList } from './src/navigation';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { CartScreen } from './src/screens/CartScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { ConfirmationScreen } from './src/screens/ConfirmationScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { WishlistScreen } from './src/screens/WishlistScreen';
import { AddressesScreen } from './src/screens/AddressesScreen';
import { AdminScreen } from './src/screens/AdminScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Catalog"
              screenOptions={{ headerRight: () => <HeaderActions /> }}>
              <Stack.Screen name="Catalog" component={CatalogScreen} options={{ title: 'Shop' }} />
              <Stack.Screen
                name="ProductDetail"
                component={ProductDetailScreen}
                options={{ title: 'Product' }}
              />
              <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log in' }} />
              <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Your cart' }} />
              <Stack.Screen
                name="Checkout"
                component={CheckoutScreen}
                options={{ title: 'Checkout' }}
              />
              <Stack.Screen
                name="Confirmation"
                component={ConfirmationScreen}
                options={{ title: 'Order confirmed' }}
              />
              <Stack.Screen
                name="Orders"
                component={OrdersScreen}
                options={{ title: 'Your orders' }}
              />
              <Stack.Screen
                name="Wishlist"
                component={WishlistScreen}
                options={{ title: 'Saved for later' }}
              />
              <Stack.Screen
                name="Addresses"
                component={AddressesScreen}
                options={{ title: 'Addresses' }}
              />
              <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin' }} />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="auto" />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
