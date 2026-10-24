import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';
import YAML from 'yaml';

/** Surfaces a scenario can be claimed for. Any other tag is metadata. */
export const SURFACES = ['api', 'web', 'mobile'];

const CONTRACT_TAG = /^@([A-Z]+-\d+)$/;
const TESTLINK_TAG = /^@testlink:(.+)$/;
const PRIORITY_TAG = /^@(P\d)$/;

function newParser() {
  return new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher());
}

function tagNames(node) {
  return (node.tags ?? []).map((t) => t.name);
}

/**
 * Scenario tags are additive on top of the Feature's, which is how a contract id
 * declared once at feature level applies to every scenario beneath it.
 */
function classify(tags) {
  const result = { contractId: null, testlinkId: null, priority: null, surfaces: [], all: tags };
  for (const tag of tags) {
    const bare = tag.replace(/^@/, '');
    if (SURFACES.includes(bare)) {
      if (!result.surfaces.includes(bare)) result.surfaces.push(bare);
      continue;
    }
    const contract = tag.match(CONTRACT_TAG);
    if (contract) {
      result.contractId = contract[1];
      continue;
    }
    const testlink = tag.match(TESTLINK_TAG);
    if (testlink) {
      result.testlinkId = testlink[1];
      continue;
    }
    const priority = tag.match(PRIORITY_TAG);
    if (priority) result.priority = priority[1];
  }
  return result;
}

function flattenSteps(steps) {
  return (steps ?? []).map((s) => `${s.keyword.trim()} ${s.text}`);
}

export function parseFeatureFile(path) {
  const source = readFileSync(path, 'utf8');
  const doc = newParser().parse(source);
  const feature = doc.feature;
  if (!feature) return [];

  const featureTags = tagNames(feature);
  const background = feature.children.find((c) => c.background)?.background;
  const backgroundSteps = flattenSteps(background?.steps);

  const scenarios = [];
  for (const child of feature.children) {
    const scenario = child.scenario;
    if (!scenario) continue;

    const tags = [...featureTags, ...tagNames(scenario)];
    const meta = classify(tags);
    const examples = (scenario.examples ?? []).flatMap((ex) =>
      (ex.tableBody ?? []).map((row) => row.cells.map((c) => c.value))
    );

    scenarios.push({
      contractId: meta.contractId,
      testlinkId: meta.testlinkId,
      priority: meta.priority,
      feature: feature.name,
      featureFile: path,
      name: scenario.name,
      line: scenario.location.line,
      isOutline: (scenario.examples ?? []).length > 0,
      exampleCount: examples.length,
      surfaces: meta.surfaces,
      tags: meta.all,
      backgroundSteps,
      steps: flattenSteps(scenario.steps),
    });
  }
  return scenarios;
}

export function loadAllScenarios(featuresDir) {
  const files = readdirSync(featuresDir).filter((f) => f.endsWith('.feature'));
  return files.flatMap((f) => parseFeatureFile(join(featuresDir, f)));
}

export function loadCoverage(coveragePath) {
  try {
    const parsed = YAML.parse(readFileSync(coveragePath, 'utf8'));
    return parsed?.implementations ?? [];
  } catch {
    return [];
  }
}

function isLinked(implementations, contractId, scenarioName, surface) {
  return implementations.some(
    (i) => i.contract === contractId && i.scenario === scenarioName && i.surface === surface
  );
}

/**
 * The RTM. A cell is `covered` when the scenario is tagged for that surface AND
 * an implementation has been linked; `gap` when tagged but unlinked; `n/a` when untagged.
 */
export function buildMatrix(scenarios, implementations) {
  return scenarios.map((s) => {
    const row = { contractId: s.contractId, scenario: s.name, priority: s.priority, cells: {} };
    for (const surface of SURFACES) {
      if (!s.surfaces.includes(surface)) row.cells[surface] = 'n/a';
      else row.cells[surface] = isLinked(implementations, s.contractId, s.name, surface)
        ? 'covered'
        : 'gap';
    }
    return row;
  });
}

export function findGaps(scenarios, implementations) {
  const gaps = [];
  for (const s of scenarios) {
    for (const surface of s.surfaces) {
      if (!isLinked(implementations, s.contractId, s.name, surface)) {
        gaps.push({
          contractId: s.contractId,
          scenario: s.name,
          surface,
          priority: s.priority,
          featureFile: s.featureFile,
          line: s.line,
        });
      }
    }
  }
  return gaps;
}

export function linkImplementation(coveragePath, entry) {
  let doc;
  try {
    doc = YAML.parse(readFileSync(coveragePath, 'utf8')) ?? {};
  } catch {
    doc = {};
  }
  doc.version ??= 1;
  doc.implementations ??= [];

  const existing = doc.implementations.findIndex(
    (i) =>
      i.contract === entry.contract &&
      i.scenario === entry.scenario &&
      i.surface === entry.surface
  );
  const record = { ...entry, linked: new Date().toISOString() };
  if (existing >= 0) doc.implementations[existing] = record;
  else doc.implementations.push(record);

  doc.generated = new Date().toISOString();
  writeFileSync(coveragePath, YAML.stringify(doc), 'utf8');
  return record;
}

export function resolveRoot(rootEnv) {
  return resolve(rootEnv ?? join(process.cwd(), '..', '..', 'contracts'));
}
