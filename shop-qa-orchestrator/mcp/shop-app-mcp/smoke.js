// Drives shop-app-mcp over stdio against the running backend.
import { spawn } from 'node:child_process';

const child = spawn(process.execPath, ['index.js'], {
  cwd: import.meta.dirname,
  env: process.env,
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buffer = '';
const pending = new Map();

child.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  let index;
  while ((index = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      const resolver = pending.get(msg.id);
      if (resolver) {
        pending.delete(msg.id);
        resolver(msg);
      }
    } catch {
      /* ignore non-JSON */
    }
  }
});
child.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));

let nextId = 1;
function send(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, resolve);
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 20000);
  });
}
const call = async (name, args = {}) => {
  const res = await send('tools/call', { name, arguments: args });
  const text = res.result?.content?.[0]?.text ?? '';
  return { isError: res.result?.isError === true, text, json: safeJson(text) };
};
function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

let failures = 0;
function check(label, condition, detail = '') {
  if (!condition) failures += 1;
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? ` -> ${detail}` : ''}`);
}

const init = await send('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'smoke', version: '1.0.0' },
});
check('initialize', init.result?.serverInfo?.name === 'shop-app-mcp');
child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);

const list = await send('tools/list', {});
const tools = list.result?.tools ?? [];
check('tools/list returns 6 tools', tools.length === 6, tools.map((t) => t.name).join(', '));

const badArrays = [];
for (const tool of tools) {
  for (const [prop, schema] of Object.entries(tool.inputSchema?.properties ?? {})) {
    if (schema.type === 'array' && !schema.items) badArrays.push(`${tool.name}.${prop}`);
  }
}
check('no array param missing `items`', badArrays.length === 0, badArrays.join(', '));

const health = await call('health');
check('health reports test-support enabled', health.json?.testSupport === 'test-support enabled',
  JSON.stringify(health.json?.testSupport));

const EMAIL = 'mcp-smoke@shop.in';
const PASSWORD = 'Smoke@12345';

const seeded = await call('seed_user', { email: EMAIL, password: PASSWORD, fullName: 'MCP Smoke' });
check('seed_user succeeds', !seeded.isError, seeded.text.slice(0, 80));

const reset = await call('reset_user', { email: EMAIL, password: PASSWORD });
check('reset_user succeeds', !reset.isError, reset.text.slice(0, 80));

const empty = await call('get_state', { email: EMAIL, password: PASSWORD });
check('cart empty after reset', empty.json?.cart?.lines === 0, String(empty.json?.cart?.lines));

const seedCart = await call('seed_cart', {
  email: EMAIL,
  items: [
    { product: 'Espresso Machine', quantity: 2 },
    { product: '4K Monitor', quantity: 1 },
  ],
});
check('seed_cart resolves names to ids', seedCart.json?.lines?.length === 2, seedCart.text.slice(0, 120));

const state = await call('get_state', { email: EMAIL, password: PASSWORD });
check('cart has 2 lines', state.json?.cart?.lines === 2, String(state.json?.cart?.lines));
const espresso = (state.json?.cart?.items ?? []).find((i) => i.name === 'Espresso Machine');
check('espresso quantity is 2', espresso?.quantity === 2, String(espresso?.quantity));
// 2 x 49,900.00 + 1 x 54,900.00 = 154,700.00 -> 15,470,000 paise
check('cart total is correct', state.json?.cart?.totalPaise === 15470000,
  String(state.json?.cart?.totalPaise));

const api = await call('get_openapi', { pathsOnly: true });
check('openapi index returned', api.json?.count > 0, String(api.json?.count));

const bad = await call('seed_cart', { email: EMAIL, items: [{ product: 'Nonexistent', quantity: 1 }] });
check('unknown product is an error', bad.isError === true, bad.text.slice(0, 80));

await call('reset_user', { email: EMAIL, password: PASSWORD });

child.kill();
console.log(`\n${failures === 0 ? 'SHOP-APP-MCP SMOKE PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
