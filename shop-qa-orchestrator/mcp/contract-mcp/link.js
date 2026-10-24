// Records a framework's implementations in coverage.yaml.
// Usage: node link.js <surface> <repo> [contractsToSkip...]
import { join } from 'node:path';
import { findGaps, linkImplementation, loadAllScenarios, loadCoverage } from './contracts.js';

const [surface, repo, ...skip] = process.argv.slice(2);
if (!surface || !repo) {
  console.error('usage: node link.js <surface> <repo> [contractIdToSkip...]');
  process.exit(1);
}

const root = process.env.CONTRACTS_ROOT;
const coveragePath = join(root, 'coverage', 'coverage.yaml');
const scenarios = loadAllScenarios(join(root, 'features'));

const STEP_FILE = {
  api: {
    'AUTH-02': 'src/test/java/com/shop/api/steps/AuthSteps.java',
    'CATALOG-01': 'src/test/java/com/shop/api/steps/CatalogSteps.java',
    'CART-01': 'src/test/java/com/shop/api/steps/CartSteps.java',
    'CHECKOUT-01': 'src/test/java/com/shop/api/steps/CheckoutSteps.java',
    'AUTH-01': 'src/test/java/com/shop/api/steps/RegistrationSteps.java',
    'PRODUCT-01': 'src/test/java/com/shop/api/steps/ProductSteps.java',
    'ORDERS-01': 'src/test/java/com/shop/api/steps/OrderHistorySteps.java',
    'WISHLIST-01': 'src/test/java/com/shop/api/steps/WishlistSteps.java',
    'ADDRESS-01': 'src/test/java/com/shop/api/steps/AddressSteps.java',
    'COUPON-01': 'src/test/java/com/shop/api/steps/CouponSteps.java',
    'REVIEWS-01': 'src/test/java/com/shop/api/steps/ReviewSteps.java',
    'ADMIN-01': 'src/test/java/com/shop/api/steps/AdminSteps.java',
  },
  web: {
    'AUTH-02': 'src/steps/auth.steps.ts',
    'CATALOG-01': 'src/steps/catalog.steps.ts',
    'CART-01': 'src/steps/cart.steps.ts',
    'CHECKOUT-01': 'src/steps/checkout.steps.ts',
    'AUTH-01': 'src/steps/registration.steps.ts',
    'PRODUCT-01': 'src/steps/product.steps.ts',
    'ORDERS-01': 'src/steps/orders.steps.ts',
    'WISHLIST-01': 'src/steps/wishlist.steps.ts',
    'ADDRESS-01': 'src/steps/address.steps.ts',
    'COUPON-01': 'src/steps/coupon.steps.ts',
    'REVIEWS-01': 'src/steps/reviews.steps.ts',
    'ADMIN-01': 'src/steps/admin.steps.ts',
  },
  mobile: {
    'AUTH-02': 'src/test/java/com/shop/mobile/steps/AuthSteps.java',
    'CATALOG-01': 'src/test/java/com/shop/mobile/steps/CatalogSteps.java',
    'CART-01': 'src/test/java/com/shop/mobile/steps/CartSteps.java',
    'CHECKOUT-01': 'src/test/java/com/shop/mobile/steps/CheckoutSteps.java',
    'AUTH-01': 'src/test/java/com/shop/mobile/steps/RegistrationSteps.java',
    'PRODUCT-01': 'src/test/java/com/shop/mobile/steps/ProductSteps.java',
    'ORDERS-01': 'src/test/java/com/shop/mobile/steps/OrderHistorySteps.java',
    'WISHLIST-01': 'src/test/java/com/shop/mobile/steps/WishlistSteps.java',
    'ADDRESS-01': 'src/test/java/com/shop/mobile/steps/AddressSteps.java',
    'COUPON-01': 'src/test/java/com/shop/mobile/steps/CouponSteps.java',
    'REVIEWS-01': 'src/test/java/com/shop/mobile/steps/ReviewSteps.java',
    'ADMIN-01': 'src/test/java/com/shop/mobile/steps/AdminSteps.java',
  },
};

let linked = 0;
for (const scenario of scenarios) {
  if (!scenario.surfaces.includes(surface)) continue;
  if (skip.includes(scenario.contractId)) continue;
  linkImplementation(coveragePath, {
    contract: scenario.contractId,
    scenario: scenario.name,
    surface,
    repo,
    path: STEP_FILE[surface][scenario.contractId],
  });
  linked += 1;
}

const remaining = findGaps(scenarios, loadCoverage(coveragePath));
const byKey = {};
for (const gap of remaining) {
  const key = `${gap.contractId} @${gap.surface}`;
  byKey[key] = (byKey[key] ?? 0) + 1;
}

console.log(`linked ${linked} ${surface} scenarios from ${repo}`);
console.log(`gaps remaining: ${remaining.length}`);
for (const [key, count] of Object.entries(byKey).sort()) console.log(`  ${key}: ${count}`);
