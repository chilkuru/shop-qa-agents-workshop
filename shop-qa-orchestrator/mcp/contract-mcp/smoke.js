// Drives the MCP server over stdio the way VS Code will, so protocol-level breakage
// is caught here rather than as a silent "no tools available" in the client.
import { spawn } from 'node:child_process';

const child = spawn(process.execPath, ['index.js'], {
  cwd: import.meta.dirname,
  env: { ...process.env, CONTRACTS_ROOT: process.env.CONTRACTS_ROOT },
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
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    const resolver = pending.get(msg.id);
    if (resolver) {
      pending.delete(msg.id);
      resolver(msg);
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
    setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 10000);
  });
}

function notify(method, params) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params })}\n`);
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
check('initialize', init.result?.serverInfo?.name === 'contract-mcp', init.result?.serverInfo?.name);
notify('notifications/initialized', {});

const list = await send('tools/list', {});
const names = (list.result?.tools ?? []).map((t) => t.name).sort();
check('tools/list returns 6 tools', names.length === 6, names.join(', '));

// Every array-typed param must declare `items`, or strict MCP clients reject the schema.
const badArrays = [];
for (const tool of list.result?.tools ?? []) {
  for (const [prop, schema] of Object.entries(tool.inputSchema?.properties ?? {})) {
    if (schema.type === 'array' && !schema.items) badArrays.push(`${tool.name}.${prop}`);
  }
}
check('no array param missing `items`', badArrays.length === 0, badArrays.join(', '));

// Expectations are derived from the contract layer rather than hardcoded, so adding a
// journey does not silently rot this test.
import { loadAllScenarios, loadCoverage, findGaps } from './contracts.js';
import { join } from 'node:path';

const ROOT = process.env.CONTRACTS_ROOT;
const expectedScenarios = loadAllScenarios(join(ROOT, 'features'));
const expectedGaps = findGaps(expectedScenarios, loadCoverage(join(ROOT, 'coverage', 'coverage.yaml')));
const expectedMobileGaps = expectedGaps.filter((g) => g.surface === 'mobile').length;

const matrix = await send('tools/call', { name: 'get_coverage_matrix', arguments: {} });
const matrixText = matrix.result?.content?.[0]?.text ?? '';
const parsedMatrix = JSON.parse(matrixText);
check(`matrix has ${expectedScenarios.length} rows`,
  parsedMatrix.rows?.length === expectedScenarios.length, String(parsedMatrix.rows?.length));
check('matrix reports gaps', parsedMatrix.totals?.gap > 0, JSON.stringify(parsedMatrix.totals));

const gaps = await send('tools/call', { name: 'find_gaps', arguments: { surface: 'mobile' } });
const parsedGaps = JSON.parse(gaps.result?.content?.[0]?.text ?? '{}');
check('mobile gaps match the contract layer', parsedGaps.count === expectedMobileGaps,
  `${parsedGaps.count} vs ${expectedMobileGaps}`);

const scenario = await send('tools/call', {
  name: 'get_scenario',
  arguments: { contractId: 'CHECKOUT-01', scenario: 'Pay with an approved card' },
});
const parsedScenario = JSON.parse(scenario.result?.content?.[0]?.text ?? '{}');
check('scenario carries background', parsedScenario.backgroundSteps?.length === 3,
  String(parsedScenario.backgroundSteps?.length));

const fixture = await send('tools/call', { name: 'get_fixture', arguments: { name: 'cards' } });
const parsedFixture = JSON.parse(fixture.result?.content?.[0]?.text ?? '{}');
check('cards fixture loads', parsedFixture.cards?.approved?.number === '4111111111111111');

const missing = await send('tools/call', {
  name: 'get_scenario',
  arguments: { contractId: 'NOPE-99', scenario: 'nothing' },
});
check('unknown scenario is an error', missing.result?.isError === true);

child.kill();
console.log(`\n${failures === 0 ? 'MCP SMOKE PASSED' : `${failures} MCP CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
