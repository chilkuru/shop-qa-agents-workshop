#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { findProductByName, shopApi } from './shopApi.js';

const server = new Server(
  { name: 'shop-app-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const TOOLS = [
  {
    name: 'health',
    description:
      'Check the shop backend is up and test-support is enabled. Use before any seeding.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'seed_user',
    description:
      'Create or update a user with known credentials. Idempotent — safe to call before every scenario.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
        fullName: { type: 'string' },
        role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'] },
      },
      required: ['email', 'password'],
    },
  },
  {
    name: 'seed_cart',
    description:
      "Replace a user's cart with a known set of lines, bypassing the UI. Products are given by name.",
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        items: {
          type: 'array',
          description: 'Cart lines to seed',
          items: {
            type: 'object',
            properties: {
              product: { type: 'string', description: 'Product name, e.g. Espresso Machine' },
              quantity: { type: 'number' },
            },
            required: ['product', 'quantity'],
          },
        },
      },
      required: ['email', 'items'],
    },
  },
  {
    name: 'reset_user',
    description:
      "Delete one user's carts and orders. Scoped to that user only — never touches other attendees' data.",
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['email', 'password'],
    },
  },
  {
    name: 'get_state',
    description:
      "Read a user's current cart and orders. Use to confirm preconditions before running a scenario.",
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['email', 'password'],
    },
  },
  {
    name: 'get_openapi',
    description:
      'Fetch the backend OpenAPI document, listing every path and method. Use to ground API step implementations.',
    inputSchema: {
      type: 'object',
      properties: {
        pathsOnly: { type: 'boolean', description: 'Return just the path/method index' },
      },
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

const ok = (payload) => ({
  content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
});
const fail = (message) => ({
  content: [{ type: 'text', text: `ERROR: ${message}` }],
  isError: true,
});

async function tokenFor(email, password) {
  const result = await shopApi.login(email, password);
  return result.token ?? result.accessToken;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'health': {
        const [testSupport, actuator] = await Promise.all([
          shopApi.health().catch((e) => `unavailable: ${e.message}`),
          shopApi.actuatorHealth().catch((e) => `unavailable: ${e.message}`),
        ]);
        return ok({ baseUrl: shopApi.baseUrl, testSupport, actuator });
      }

      case 'seed_user': {
        await shopApi.seedUser(args);
        return ok({ seeded: args.email, role: args.role ?? 'CUSTOMER' });
      }

      case 'seed_cart': {
        const resolved = [];
        for (const line of args.items ?? []) {
          const product = await findProductByName(line.product);
          resolved.push({ productId: product.id, quantity: line.quantity });
        }
        await shopApi.seedCart(args.email, resolved);
        return ok({ email: args.email, lines: resolved });
      }

      case 'reset_user': {
        const token = await tokenFor(args.email, args.password);
        await shopApi.resetMine(token);
        return ok({ reset: args.email, scope: 'carts and orders for this user only' });
      }

      case 'get_state': {
        const token = await tokenFor(args.email, args.password);
        const [cart, orders] = await Promise.all([shopApi.cart(token), shopApi.orders(token)]);
        return ok({
          email: args.email,
          cart: {
            lines: cart.items?.length ?? 0,
            totalPaise: cart.totalPaise ?? 0,
            items: (cart.items ?? []).map((i) => ({ name: i.name, quantity: i.quantity })),
          },
          orders: (Array.isArray(orders) ? orders : (orders.items ?? [])).map((o) => ({
            orderNumber: o.orderNumber,
            status: o.status,
            totalPaise: o.totalPaise,
          })),
        });
      }

      case 'get_openapi': {
        const doc = await shopApi.openapi();
        if (!args.pathsOnly) return ok(doc);
        const index = Object.entries(doc.paths ?? {}).map(([path, ops]) => ({
          path,
          methods: Object.keys(ops)
            .filter((m) => ['get', 'post', 'put', 'patch', 'delete'].includes(m))
            .map((m) => m.toUpperCase()),
        }));
        return ok({ count: index.length, paths: index });
      }

      default:
        return fail(`Unknown tool '${name}'`);
    }
  } catch (err) {
    return fail(err.message);
  }
});

await server.connect(new StdioServerTransport());
