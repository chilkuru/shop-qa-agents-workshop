// Runs the suite, then builds the Allure HTML even when tests fail; exits with the test result.
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit', shell: true });

// Stale results from earlier runs would otherwise be merged into this run's report.
rmSync('allure-results', { recursive: true, force: true });

const gen = run('npx', ['bddgen']);
if (gen.status !== 0) process.exit(gen.status ?? 1);

const tests = run('npx', ['playwright', 'test', ...process.argv.slice(2)]);
const report = run('npx', ['allure', 'generate', 'allure-results', '--clean', '-o', 'allure-report']);
if (report.status === 0) console.log('Allure report: allure-report/index.html (open with: npm run report:open)');

process.exit(tests.status ?? 1);
