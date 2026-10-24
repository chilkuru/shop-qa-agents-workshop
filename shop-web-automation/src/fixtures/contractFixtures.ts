import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CONTRACTS_DIR =
  process.env.CONTRACTS_DIR ?? join(process.cwd(), '..', 'shop-qa-orchestrator', 'contracts');

export interface FixtureUser {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export interface FixtureCard {
  number: string;
  expiry: string;
  cvc: string;
  outcome: string;
}

function read<T>(name: string): T {
  return JSON.parse(readFileSync(join(CONTRACTS_DIR, 'fixtures', `${name}.json`), 'utf8')) as T;
}

const users = read<{ users: Record<string, FixtureUser>; wrongPassword: string }>('users');
const cards = read<{
  cards: Record<string, FixtureCard>;
  shipping: { name: string; address: string };
}>('cards');
const products = read<{
  catalogSize: number;
  products: { name: string; pricePaise: number }[];
}>('products');

export const fixtures = {
  contractsDir: CONTRACTS_DIR,

  userByEmail(email: string): FixtureUser {
    const found = Object.values(users.users).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!found) throw new Error(`No fixture user with email '${email}'`);
    return found;
  },

  wrongPassword: users.wrongPassword,

  card(key: string): FixtureCard {
    const found = cards.cards[key];
    if (!found) throw new Error(`No fixture card '${key}'`);
    return found;
  },

  shipping: cards.shipping,

  catalogSize: products.catalogSize,

  pricePaise(name: string): number {
    const found = products.products.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (!found) throw new Error(`No fixture product '${name}'`);
    return found.pricePaise;
  },
};
