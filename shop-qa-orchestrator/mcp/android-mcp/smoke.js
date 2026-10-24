// Drives android-mcp over stdio against the attached emulator.
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
      /* ignore */
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
    setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 120_000);
  });
}
const call = async (name, args = {}) => {
  const res = await send('tools/call', { name, arguments: args });
  const text = res.result?.content?.[0]?.text ?? '';
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* plain text */
  }
  return { isError: res.result?.isError === true, text, json };
};

let failures = 0;
const check = (label, condition, detail = '') => {
  if (!condition) failures += 1;
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? ` -> ${detail}` : ''}`);
};

const init = await send('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'smoke', version: '1.0.0' },
});
check('initialize', init.result?.serverInfo?.name === 'android-mcp');
child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);

const list = await send('tools/list', {});
const tools = list.result?.tools ?? [];
check('tools/list returns 10 tools', tools.length === 10, tools.map((t) => t.name).join(', '));

const badArrays = [];
for (const tool of tools) {
  for (const [prop, schema] of Object.entries(tool.inputSchema?.properties ?? {})) {
    if (schema.type === 'array' && !schema.items) badArrays.push(`${tool.name}.${prop}`);
  }
}
check('no array param missing `items`', badArrays.length === 0, badArrays.join(', '));

const avds = await call('list_avds');
check('shop_test AVD present', (avds.json?.avds ?? []).includes('shop_test'), JSON.stringify(avds.json?.avds));

const devices = await call('list_devices');
check('an emulator is attached', devices.text.includes('emulator-'), devices.text.split('\n')[1] ?? '');

const boot = await call('wait_for_boot', { timeoutSeconds: 60 });
check('wait_for_boot reports booted', boot.json?.booted === true, boot.text.slice(0, 80));

const ui = await call('dump_ui');
check('dump_ui returns resource ids', (ui.json?.resourceIds ?? []).length > 0,
  String((ui.json?.resourceIds ?? []).length));

const shot = await call('screenshot', { outputPath: 'mcp-smoke.png' });
check('screenshot saved', !shot.isError, shot.text.slice(0, 60));

const appium = await call('get_appium_status');
check('appium status answered', appium.json?.url?.includes('4723'), String(appium.json?.reachable));

child.kill();
console.log(`\n${failures === 0 ? 'ANDROID-MCP SMOKE PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
