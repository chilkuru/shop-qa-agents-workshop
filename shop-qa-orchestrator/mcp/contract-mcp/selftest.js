// Exercises the contract layer directly, without the MCP transport, so parsing and
// matrix logic can be verified in isolation.
import { join } from 'node:path';
import {
  SURFACES,
  buildMatrix,
  findGaps,
  loadAllScenarios,
  loadCoverage,
  resolveRoot,
} from './contracts.js';

const root = resolveRoot(process.env.CONTRACTS_ROOT);
const scenarios = loadAllScenarios(join(root, 'features'));
const implementations = loadCoverage(join(root, 'coverage', 'coverage.yaml'));

let failures = 0;
function check(label, actual, expected) {
  const pass = actual === expected;
  if (!pass) failures += 1;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
}

console.log(`contracts root: ${root}\n`);

const contracts = [...new Set(scenarios.map((s) => s.contractId))].sort();
console.log(`contracts found: ${contracts.join(', ')}`);
console.log(`scenarios found: ${scenarios.length}\n`);

check('every scenario has a contract id', scenarios.every((s) => s.contractId), true);
check('every scenario has >=1 surface', scenarios.every((s) => s.surfaces.length > 0), true);
check('every scenario has steps', scenarios.every((s) => s.steps.length > 0), true);
check('contract count', contracts.length, 12);

// Step text must be unique across ALL features: cucumber matches on text alone and
// ignores the keyword, so a duplicate breaks glue for the entire suite.
// `And` inherits the preceding keyword, so it is resolved rather than treated as its own.
const stepUsage = new Map();
for (const s of scenarios) {
  let context = 'Given';
  for (const step of [...s.backgroundSteps, ...s.steps]) {
    const [keyword, ...rest] = step.split(/\s+/);
    const text = rest.join(' ');
    if (keyword === 'Given' || keyword === 'When' || keyword === 'Then') context = keyword;

    if (!stepUsage.has(text)) stepUsage.set(text, new Set());
    stepUsage.get(text).add(context);
  }
}
const ambiguous = [...stepUsage.entries()]
  .filter(([, roles]) => roles.has('Given') && roles.has('Then'))
  .map(([text]) => text);
check('no step text used as both setup and assertion', ambiguous.length, 0);
if (ambiguous.length) console.log(`      ${ambiguous.join('\n      ')}`);

// The reserved gaps must be TAGGED (so find_gaps surfaces them) yet UNLINKED.
const reserved = [
  ['CART-01', 'mobile'],
  ['CHECKOUT-01', 'web'],
  ['CHECKOUT-01', 'mobile'],
];
for (const [contractId, surface] of reserved) {
  const tagged = scenarios.some(
    (s) => s.contractId === contractId && s.surfaces.includes(surface)
  );
  check(`${contractId} declares @${surface} (reserved gap)`, tagged, true);
}

const outlines = scenarios.filter((s) => s.isOutline);
check('catalog outline expands examples', outlines.some((s) => s.exampleCount === 4), true);

const withBackground = scenarios.filter((s) => s.backgroundSteps.length > 0);
check('background steps are attached', withBackground.length > 0, true);

const matrix = buildMatrix(scenarios, implementations);
const totals = { covered: 0, gap: 0, 'n/a': 0 };
for (const row of matrix) for (const s of SURFACES) totals[row.cells[s]] += 1;
console.log(`\nmatrix totals: ${JSON.stringify(totals)}`);

const gaps = findGaps(scenarios, implementations);
console.log(`open gaps: ${gaps.length}`);
check('gaps equal tagged-but-unlinked cells', gaps.length, totals.gap);

const bySurface = {};
for (const g of gaps) bySurface[g.surface] = (bySurface[g.surface] ?? 0) + 1;
console.log(`gaps by surface: ${JSON.stringify(bySurface)}`);

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
