import { test as base, createBdd } from 'playwright-bdd';
import { ShopApi } from '../api/ShopApi.js';
import { CartPage } from '../pages/CartPage.js';
import { CatalogPage } from '../pages/CatalogPage.js';
import { HeaderComponent } from '../pages/HeaderComponent.js';
import { LoginPage } from '../pages/LoginPage.js';
import { OrdersPage } from '../pages/OrdersPage.js';
import { ProductDetailPage } from '../pages/ProductDetailPage.js';
import { WishlistPage } from '../pages/WishlistPage.js';
import { AddressesPage } from '../pages/AddressesPage.js';
import { AdminPage } from '../pages/AdminPage.js';

/** Per-scenario state. Replaces the shared mutable context a Java suite would use. */
export class ScenarioState {
  signedInEmail: string | null = null;
  lastSearchTerm: string | null = null;
  registeredEmail: string | null = null;
  lastOrderNumber: string | null = null;
}

type Fixtures = {
  shopApi: ShopApi;
  loginPage: LoginPage;
  catalogPage: CatalogPage;
  cartPage: CartPage;
  ordersPage: OrdersPage;
  productDetailPage: ProductDetailPage;
  wishlistPage: WishlistPage;
  addressesPage: AddressesPage;
  adminPage: AdminPage;
  header: HeaderComponent;
  state: ScenarioState;
};

export const test = base.extend<Fixtures>({
  shopApi: async ({ request }, use) => {
    await use(new ShopApi(request));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  catalogPage: async ({ page }, use) => {
    await use(new CatalogPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  ordersPage: async ({ page }, use) => {
    await use(new OrdersPage(page));
  },
  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },
  wishlistPage: async ({ page }, use) => {
    await use(new WishlistPage(page));
  },
  addressesPage: async ({ page }, use) => {
    await use(new AddressesPage(page));
  },
  adminPage: async ({ page }, use) => {
    await use(new AdminPage(page));
  },
  header: async ({ page }, use) => {
    await use(new HeaderComponent(page));
  },
  state: async ({}, use) => {
    await use(new ScenarioState());
  },
});

export const { Given, When, Then, Before, After } = createBdd(test);
