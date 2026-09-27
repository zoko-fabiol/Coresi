import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BASE_URL = 'http://localhost:3000/?skipSplash=true';
const OUTPUT_DIR = path.resolve('docs/manual_assets');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1.5 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // 1. Admin specialized settings
  await page.goto(`${BASE_URL}#admin`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));

  // Find all buttons and click the one with 'Finance'
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes('Finance'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '17_admin_specialized.png') });
  console.log('✓ Enregistré : 17_admin_specialized.png');

  // 2. Print Modal preview
  await page.goto(`${BASE_URL}#purchases`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  // Click first button with printer icon or text
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const printBtn = btns.find(
      (b) =>
        b.title?.toLowerCase().includes('imprimer') ||
        b.textContent?.toLowerCase().includes('imprimer') ||
        b.innerHTML.includes('Printer') ||
        b.getAttribute('aria-label')?.includes('imprimer')
    );
    if (printBtn) printBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '18_print_modal.png') });
  console.log('✓ Enregistré : 18_print_modal.png');

  await browser.close();
}

run().catch((e) => console.error(e));
