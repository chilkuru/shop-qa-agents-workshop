// Collects the facts the handbook is built from. Everything here is read from the
// live repos and the contract layer, so the docs cannot drift from reality.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllScenarios, loadCoverage, buildMatrix, findGaps, SURFACES } from './contracts.js';

// Default to the repo this file lives in, so a clone anywhere regenerates correctly.
const SHOP_ROOT = process.env.SHOP_ROOT ?? fileURLToPath(new URL('../../../', import.meta.url));
const CONTRACTS = process.env.CONTRACTS_ROOT ?? join(SHOP_ROOT, 'shop-qa-orchestrator', 'contracts');

const IGNORED = new Set([
  'node_modules', 'target', '.git', '.gradle', 'build', 'allure-results',
  'allure-report', '.features-gen', 'test-results', 'dist', '.expo', 'android', 'ios',
]);

export function tree(root, { maxDepth = 3, base = '' } = {}) {
  const abs = join(root, base);
  if (!existsSync(abs)) return [];
  const depth = base ? base.split(/[\\/]/).length : 0;
  if (depth >= maxDepth) return [];

  const out = [];
  for (const name of readdirSync(abs).sort()) {
    if (IGNORED.has(name) || name.startsWith('.')) continue;
    const rel = base ? `${base}/${name}` : name;
    const isDir = statSync(join(abs, name)).isDirectory();
    out.push({ path: rel, dir: isDir, depth });
    if (isDir) out.push(...tree(root, { maxDepth, base: rel }));
  }
  return out;
}

export function countFiles(root, extension) {
  if (!existsSync(root)) return 0;
  let total = 0;
  for (const name of readdirSync(root)) {
    if (IGNORED.has(name)) continue;
    const full = join(root, name);
    if (statSync(full).isDirectory()) total += countFiles(full, extension);
    else if (name.endsWith(extension)) total += 1;
  }
  return total;
}

export function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function mavenVersions(pomPath) {
  if (!existsSync(pomPath)) return {};
  const xml = readFileSync(pomPath, 'utf8');
  const props = {};
  for (const m of xml.matchAll(/<([a-z0-9.]+\.version)>([^<]+)<\/\1>/gi)) {
    props[m[1]] = m[2];
  }
  return props;
}

export function collect() {
  const scenarios = loadAllScenarios(join(CONTRACTS, 'features'));
  const implementations = loadCoverage(join(CONTRACTS, 'coverage', 'coverage.yaml'));
  const matrix = buildMatrix(scenarios, implementations);
  const gaps = findGaps(scenarios, implementations);

  const byContract = new Map();
  for (const s of scenarios) {
    if (!byContract.has(s.contractId)) {
      byContract.set(s.contractId, {
        contractId: s.contractId,
        feature: s.feature,
        featureFile: s.featureFile.split(/[\\/]/).pop(),
        testlinkId: s.testlinkId,
        priority: s.priority,
        scenarios: [],
      });
    }
    byContract.get(s.contractId).scenarios.push(s);
  }

  const totals = { covered: 0, gap: 0, 'n/a': 0 };
  for (const row of matrix) for (const s of SURFACES) totals[row.cells[s]] += 1;

  const webPkg = readJson(join(SHOP_ROOT, 'shop-web-automation', 'package.json'));

  return {
    shopRoot: SHOP_ROOT,
    contractsRoot: CONTRACTS,
    generated: new Date().toISOString(),
    scenarios,
    contracts: [...byContract.values()].sort((a, b) => a.contractId.localeCompare(b.contractId)),
    matrix,
    gaps,
    totals,
    surfaces: SURFACES,
    fixtures: {
      users: readJson(join(CONTRACTS, 'fixtures', 'users.json')),
      products: readJson(join(CONTRACTS, 'fixtures', 'products.json')),
      cards: readJson(join(CONTRACTS, 'fixtures', 'cards.json')),
    },
    versions: {
      api: mavenVersions(join(SHOP_ROOT, 'shop-api-automation', 'pom.xml')),
      mobile: mavenVersions(join(SHOP_ROOT, 'shop-mobile-automation', 'pom.xml')),
      web: webPkg?.devDependencies ?? {},
    },
    trees: {
      'shop-platform': tree(join(SHOP_ROOT, 'shop-platform'), { maxDepth: 2 }),
      'shop-qa-orchestrator': tree(join(SHOP_ROOT, 'shop-qa-orchestrator'), { maxDepth: 3 }),
      'shop-api-automation': tree(join(SHOP_ROOT, 'shop-api-automation'), { maxDepth: 6 }),
      'shop-web-automation': tree(join(SHOP_ROOT, 'shop-web-automation'), { maxDepth: 3 }),
      'shop-mobile-automation': tree(join(SHOP_ROOT, 'shop-mobile-automation'), { maxDepth: 6 }),
    },
  };
}
