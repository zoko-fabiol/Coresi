import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BASE_URL = 'http://localhost:3000/?skipSplash=true';
const OUTPUT_DIR = path.resolve('docs/manual_assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const MODULES_TO_CAPTURE = [
  { id: 'dashboard', filename: '01_dashboard.png', title: 'Tableau de Bord DG' },
  { id: 'ged', filename: '02_ged.png', title: 'GED Documents & Archives' },
  { id: 'projects', filename: '03_projects.png', title: 'Chantiers & Projets' },
  { id: 'sites', filename: '04_sites.png', title: 'Multi-Sites & Chantiers' },
  { id: 'reports', filename: '05_reports.png', title: 'Rapports & PV Techniques' },
  { id: 'materials', filename: '06_materials.png', title: 'Parc Matériel & Stocks' },
  { id: 'maintenance', filename: '07_maintenance.png', title: 'Maintenance & GMAO' },
  { id: 'purchases', filename: '08_purchases.png', title: 'Achats & Commandes' },
  { id: 'finances', filename: '09_finances.png', title: 'Finances & Factures' },
  { id: 'accounting', filename: '10_accounting.png', title: 'Comptabilité Avancée SYSCOHADA' },
  { id: 'partners', filename: '11_partners.png', title: 'Clients & Fournisseurs' },
  { id: 'hr', filename: '12_hr.png', title: 'Personnel & RH' },
  { id: 'payroll', filename: '13_payroll.png', title: 'Paie & Cotisations Sociales CNSS' },
  { id: 'missions', filename: '14_missions.png', title: 'Missions & Déplacements' },
  { id: 'audit', filename: '15_audit.png', title: 'Journal d Audit & Traçabilité' },
  { id: 'admin', filename: '16_admin.png', title: 'Centre d Administration & Modules' },
];

async function run() {
  console.log('Lancement du navigateur Chrome pour les captures...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1.5,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // Load first page and wait for complete render
  await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));

  for (const mod of MODULES_TO_CAPTURE) {
    console.log(`Capture du module: ${mod.title} (#${mod.id})...`);
    await page.goto(`${BASE_URL}#${mod.id}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1200));

    const filepath = path.join(OUTPUT_DIR, mod.filename);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`✓ Enregistré : ${mod.filename}`);
  }

  // Also capture specialized admin settings tab
  console.log('Capture des Paramètres Spécialisés...');
  await page.goto(`${BASE_URL}#admin`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1200));

  // Click on "Finance" specialized tab if available
  try {
    const financeTab = await page.waitForSelector('button:has-text("Finance")', { timeout: 3000 });
    if (financeTab) await financeTab.click();
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '17_admin_specialized.png') });
    console.log('✓ Enregistré : 17_admin_specialized.png');
  } catch (e) {
    console.log('Onglet Finance cliquable alternativement.');
  }

  await browser.close();
  console.log('Toutes les captures d écran ont été générées avec succès dans:', OUTPUT_DIR);
}

run().catch((err) => {
  console.error('Erreur capture:', err);
  process.exit(1);
});
