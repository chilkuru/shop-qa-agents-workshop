// Objective check that the handbook actually renders: diagrams become SVG, the matrix
// is populated, and the interactive filter works.
import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'http://localhost:3010/';
let failures = 0;
const check = (label, ok, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` -> ${detail}` : ''}`);
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'load' });

await page
  .waitForFunction(() => {
    const b = document.querySelectorAll('.mermaid');
    return b.length > 0 && [...b].every((x) => x.querySelector('svg'));
  }, { timeout: 60000 })
  .catch(() => {});

const diagrams = await page.evaluate(() => {
  const blocks = [...document.querySelectorAll('.mermaid')];
  return {
    total: blocks.length,
    rendered: blocks.filter((b) => b.querySelector('svg')).length,
    errored: blocks.filter((b) => b.textContent.includes('Syntax error')).length,
  };
});
check('all diagrams rendered to SVG', diagrams.total > 0 && diagrams.rendered === diagrams.total,
  `${diagrams.rendered}/${diagrams.total}`);
check('no diagram syntax errors', diagrams.errored === 0, String(diagrams.errored));

const sections = await page.$$eval('main section', (s) => s.map((x) => x.id));
check('all 14 sections present', sections.length === 14, sections.join(', '));

const navCount = await page.$$eval('#nav a', (a) => a.length);
check('nav matches sections', navCount === sections.length, `${navCount} links`);

// The matrix section holds two tables; the first is the contract list.
const matrixRows = await page.$$eval('#matrix table:first-of-type tbody tr', (r) => r.length);
check('matrix lists 12 contracts', matrixRows === 12, String(matrixRows));

const badges = await page.$$eval('#matrix .badge', (b) => {
  const counts = {};
  for (const x of b) counts[x.textContent] = (counts[x.textContent] ?? 0) + 1;
  return counts;
});
check('matrix shows gaps', (badges.GAP ?? 0) > 0, JSON.stringify(badges));

const testDetails = await page.$$eval('#tests details', (d) => d.length);
check('every contract has a detail block', testDetails === 12, String(testDetails));

// The filter should narrow the document, then restore it.
await page.fill('#search', 'appium');
const visibleAfter = await page.$$eval('main section:not(.hidden)', (s) => s.length);
await page.fill('#search', '');
const visibleReset = await page.$$eval('main section:not(.hidden)', (s) => s.length);
check('search filters sections', visibleAfter > 0 && visibleAfter < 14, `${visibleAfter} of 14`);
check('clearing search restores all', visibleReset === 14, String(visibleReset));

const offline = await page.evaluate(() =>
  [...document.querySelectorAll('script[src]')].map((s) => s.src));
check('no external script dependencies', offline.length === 0, offline.join(', ') || 'self-contained');

await browser.close();
console.log(`\n${failures === 0 ? 'HANDBOOK VERIFIED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
