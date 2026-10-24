#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  SURFACES,
  buildMatrix,
  findGaps,
  linkImplementation,
  loadAllScenarios,
  loadCoverage,
  resolveRoot,
} from './contracts.js';

const CONTRACTS_ROOT = resolveRoot(process.env.CONTRACTS_ROOT);
const FEATURES_DIR = join(CONTRACTS_ROOT, 'features');
const COVERAGE_PATH = join(CONTRACTS_ROOT, 'coverage', 'coverage.yaml');
const FIXTURES_DIR = join(CONTRACTS_ROOT, 'fixtures');

const server = new Server(
  { name: 'contract-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const TOOLS = [
  {
    name: 'list_scenarios',
    description:
      'List every scenario in the contract layer, with its contract id, surface tags and priority. Optionally filter by contract id or surface.',
    inputSchema: {
      type: 'object',
      properties: {
        contractId: { type: 'string', description: 'e.g. CHECKOUT-01' },
        surface: { type: 'string', enum: SURFACES },
      },
    },
  },
  {
    name: 'get_scenario',
    description:
      'Get one scenario in full, including background steps, so it can be implemented without opening the .feature file.',
    inputSchema: {
      type: 'object',
      properties: {
        contractId: { type: 'string' },
        scenario: { type: 'string', description: 'Exact scenario name' },
      },
      required: ['contractId', 'scenario'],
    },
  },
  {
    name: 'get_coverage_matrix',
    description:
      'The requirements traceability matrix: every scenario against api/web/mobile, each cell covered | gap | n/a.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'find_gaps',
    description:
      'Scenarios tagged for a surface but with no linked implementation. This is the work queue the orchestrator fans out.',
    inputSchema: {
      type: 'object',
      properties: {
        surface: { type: 'string', enum: SURFACES },
        priority: { type: 'string', description: 'e.g. P1' },
      },
    },
  },
  {
    name: 'link_implementation',
    description:
      'Record that a scenario is implemented for a surface. Written back to coverage.yaml. Call this after the test is green.',
    inputSchema: {
      type: 'object',
      properties: {
        contract: { type: 'string' },
        scenario: { type: 'string' },
        surface: { type: 'string', enum: SURFACES },
        repo: { type: 'string' },
        path: { type: 'string', description: 'Repo-relative path to the step definitions' },
      },
      required: ['contract', 'scenario', 'surface', 'repo', 'path'],
    },
  },
  {
    name: 'get_fixture',
    description: 'Read a fixture file (users, products, cards) from the contract layer.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', enum: ['users', 'products', 'cards'] },
      },
      required: ['name'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

function ok(payload) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
}

function fail(message) {
  return { content: [{ type: 'text', text: `ERROR: ${message}` }], isError: true };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    const scenarios = loadAllScenarios(FEATURES_DIR);
    const implementations = loadCoverage(COVERAGE_PATH);

    switch (name) {
      case 'list_scenarios': {
        let out = scenarios;
        if (args.contractId) out = out.filter((s) => s.contractId === args.contractId);
        if (args.surface) out = out.filter((s) => s.surfaces.includes(args.surface));
        return ok(
          out.map((s) => ({
            contractId: s.contractId,
            scenario: s.name,
            priority: s.priority,
            surfaces: s.surfaces,
            testlinkId: s.testlinkId,
            isOutline: s.isOutline,
            exampleCount: s.exampleCount,
          }))
        );
      }

      case 'get_scenario': {
        const found = scenarios.find(
          (s) => s.contractId === args.contractId && s.name === args.scenario
        );
        if (!found) return fail(`No scenario '${args.scenario}' under ${args.contractId}`);
        return ok(found);
      }

      case 'get_coverage_matrix': {
        const matrix = buildMatrix(scenarios, implementations);
        const totals = { covered: 0, gap: 0, 'n/a': 0 };
        for (const row of matrix) {
          for (const surface of SURFACES) totals[row.cells[surface]] += 1;
        }
        return ok({ surfaces: SURFACES, totals, rows: matrix });
      }

      case 'find_gaps': {
        let gaps = findGaps(scenarios, implementations);
        if (args.surface) gaps = gaps.filter((g) => g.surface === args.surface);
        if (args.priority) gaps = gaps.filter((g) => g.priority === args.priority);
        return ok({ count: gaps.length, gaps });
      }

      case 'link_implementation': {
        const record = linkImplementation(COVERAGE_PATH, {
          contract: args.contract,
          scenario: args.scenario,
          surface: args.surface,
          repo: args.repo,
          path: args.path,
        });
        return ok({ linked: record });
      }

      case 'get_fixture': {
        const raw = readFileSync(join(FIXTURES_DIR, `${args.name}.json`), 'utf8');
        return ok(JSON.parse(raw));
      }

      default:
        return fail(`Unknown tool '${name}'`);
    }
  } catch (err) {
    return fail(err.message);
  }
});

await server.connect(new StdioServerTransport());
