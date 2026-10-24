// Renders the handbook HTML to PDF. Uses the Playwright already installed for the web
// suite, so the PDF is produced from the same document the browser shows.
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const HTML = process.argv[2];
const PDF = process.argv[3];

if (!existsSync(HTML)) {
  console.error(`No HTML at ${HTML}`);
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(`file:///${HTML.replace(/\\/g, '/')}`, { waitUntil: 'load' });

// Mermaid renders client-side; wait for the diagrams to become SVG before printing.
await page.waitForFunction(
  () => {
    const blocks = document.querySelectorAll('.mermaid');
    return blocks.length > 0 && [...blocks].every((b) => b.querySelector('svg'));
  },
  { timeout: 60000 },
).catch(() => console.warn('warning: some diagrams may not have rendered'));

// Expand every <details> so nothing is hidden in print.
await page.evaluate(() => {
  document.querySelectorAll('details').forEach((el) => el.setAttribute('open', ''));
});
await page.emulateMedia({ media: 'print' });

await page.pdf({
  path: PDF,
  format: 'A4',
  printBackground: true,
  margin: { top: '16mm', bottom: '16mm', left: '12mm', right: '12mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:8px;color:#888;width:100%;padding:0 12mm">Shop QA Platform — Engineering Handbook</div>',
  footerTemplate:
    '<div style="font-size:8px;color:#888;width:100%;padding:0 12mm;text-align:right">' +
    'Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
});

await browser.close();
console.log(`pdf      -> ${PDF}`);
