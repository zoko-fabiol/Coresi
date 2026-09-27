import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BASE_URL = 'http://localhost:3000/?skipSplash=true&theme=light';
const OUTPUT_DIR = path.resolve('docs/manual_assets_light');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// All capture targets organized in pairs: Administration Parameter vs Platform Real Effect
const CAPTURES = [
  // Pair 1: Modules & Sidebar
  { url: `${BASE_URL}#admin-modules`, file: 'admin_01_modules_toggle.png', label: 'Administration — Activation des Modules' },
  { url: `${BASE_URL}#dashboard`, file: 'effect_01_sidebar_navigation.png', label: 'Plateforme — Barre Latérale & Menu Opérationnel' },

  // Pair 2: Workflows & Approbations
  { url: `${BASE_URL}#admin-workflows`, file: 'admin_02_workflows.png', label: 'Administration — Workflows & Circuits d Approbation' },
  { url: `${BASE_URL}#purchases`, file: 'effect_02_purchases_approval.png', label: 'Plateforme — Circuit d Approbation des Achats (DA/BC)' },

  // Pair 3: Rôles & Matrice des Permissions
  { url: `${BASE_URL}#admin-roles`, file: 'admin_03_roles_matrix.png', label: 'Administration — Matrice des Rôles & Permissions' },
  { url: `${BASE_URL}#admin-users`, file: 'effect_03_user_role_scope.png', label: 'Plateforme — Comptes Utilisateurs & Affectation des Rôles' },

  // Pair 4: Numérotation Automatique
  { url: `${BASE_URL}#admin-numbering`, file: 'admin_04_numbering.png', label: 'Administration — Règles de Numérotation Séquentielle' },
  { url: `${BASE_URL}#reports`, file: 'effect_04_documents_numbering.png', label: 'Plateforme — Références Séquentielles sur les Documents' },

  // Pair 5: Finance & TVA
  { url: `${BASE_URL}#admin-finance`, file: 'admin_05_finance_vat.png', label: 'Administration — Paramètres Finance, TVA 18% & Caisse' },
  { url: `${BASE_URL}#finances`, file: 'effect_05_finance_invoicing.png', label: 'Plateforme — Facturation Client avec TVA Légale & Trésorerie' },

  // Pair 6: GED & Rétention
  { url: `${BASE_URL}#admin-ged`, file: 'admin_06_ged_retention.png', label: 'Administration — Rétention GED & Documents Obligatoires' },
  { url: `${BASE_URL}#ged`, file: 'effect_06_ged_archive.png', label: 'Plateforme — Coffre-Fort Documentaire & Indexation' },

  // Pair 7: Scanner & OCR
  { url: `${BASE_URL}#admin-scanner_ocr`, file: 'admin_07_scanner_ocr.png', label: 'Administration — Configuration Scanner & Moteur OCR' },
  { url: `${BASE_URL}#ged`, file: 'effect_07_ocr_validation.png', label: 'Plateforme — Reconnaissance OCR & Traitement d Image' },

  // Pair 8: Projets & Seuils Budget
  { url: `${BASE_URL}#admin-projects`, file: 'admin_08_projects_budget.png', label: 'Administration — Seuils d Alerte Budgétaire Chantiers' },
  { url: `${BASE_URL}#projects`, file: 'effect_08_project_budget_alert.png', label: 'Plateforme — Suivi d Avancement & Dépenses Chantiers' },

  // Pair 9: Stocks & Matériels
  { url: `${BASE_URL}#admin-stock`, file: 'admin_09_stock_rules.png', label: 'Administration — Règles de Stock, N° Série & Multi-Dépôts' },
  { url: `${BASE_URL}#materials`, file: 'effect_09_stock_inventory.png', label: 'Plateforme — Inventaire Matière & Outillages de Chantier' },

  // Pair 10: RH & Licences Soudeurs
  { url: `${BASE_URL}#admin-hr`, file: 'admin_10_hr_welders.png', label: 'Administration — Alertes Péremption Licences Soudeurs' },
  { url: `${BASE_URL}#hr`, file: 'effect_10_welders_licences.png', label: 'Plateforme — Dossiers Salariés & Certifications ASME 6G' },

  // Pair 11: GMAO & Maintenance
  { url: `${BASE_URL}#admin-gmao`, file: 'admin_11_gmao_hours.png', label: 'Administration — Seuils de Révision Heures GMAO' },
  { url: `${BASE_URL}#maintenance`, file: 'effect_11_gmao_workorders.png', label: 'Plateforme — Compteurs d Heures & Ordres de Travail (OT)' },

  // Pair 12: Missions & Perdiems
  { url: `${BASE_URL}#admin-missions`, file: 'admin_12_missions_perdiem.png', label: 'Administration — Barème des Perdiems Onshore/Offshore' },
  { url: `${BASE_URL}#missions`, file: 'effect_12_mission_order.png', label: 'Plateforme — Ordres de Mission & Calcul Automatique des Frais' },

  // Pair 13: Multi-Sites & Transferts
  { url: `${BASE_URL}#admin-sites`, file: 'admin_13_sites_rules.png', label: 'Administration — Règles Multi-Sites & Double Visa' },
  { url: `${BASE_URL}#sites`, file: 'effect_13_sites_transfer.png', label: 'Plateforme — Gestion des Bases & Transferts Inter-Chantiers' },

  // Pair 14: Rapports & Épreuves Hydrauliques
  { url: `${BASE_URL}#admin-reports`, file: 'admin_14_reports_hydro.png', label: 'Administration — Normes CODAP/ASME & Facteur de Pression' },
  { url: `${BASE_URL}#reports`, file: 'effect_14_pv_hydro_test.png', label: 'Plateforme — PV d Épreuve Hydraulique & Contrôle CND' },

  // Pair 15: Achats & Règle des 3 Devis
  { url: `${BASE_URL}#admin-purchases`, file: 'admin_15_purchases_rules.png', label: 'Administration — Seuils d Approbation & Règle des 3 Devis' },
  { url: `${BASE_URL}#purchases`, file: 'effect_15_purchase_orders.png', label: 'Plateforme — Bons de Commande (BC) & Réceptions' },

  // Pair 16: Partenaires & Agréments HSE
  { url: `${BASE_URL}#admin-partners`, file: 'admin_16_partners_rules.png', label: 'Administration — Exigences NIF/RCCM & Pièces HSE Sous-Traitants' },
  { url: `${BASE_URL}#partners`, file: 'effect_16_partner_compliance.png', label: 'Plateforme — Fiches Partenaires & Suivi de Conformité' },

  // Pair 17: Paie & Cotisations CNSS
  { url: `${BASE_URL}#admin-payroll`, file: 'admin_17_payroll_cnss.png', label: 'Administration — Taux CNSS Congo & Barèmes Salariaux' },
  { url: `${BASE_URL}#payroll`, file: 'effect_17_payslip_breakdown.png', label: 'Plateforme — Bulletins de Salaires & Retenues Légales' },

  // Pair 18: Impression & Charte A4
  { url: `${BASE_URL}#admin-print`, file: 'admin_18_print_charter.png', label: 'Administration — Charte Graphique, Filigrane & Cachets A4' },
  { url: `${BASE_URL}#reports`, file: 'effect_18_print_a4_modal.png', label: 'Plateforme — Aperçu Document A4 Imprimable Certifié' },

  // Pair 19: Sécurité & Verrouillage
  { url: `${BASE_URL}#admin-security`, file: 'admin_19_security_idle.png', label: 'Administration — Politique de Sécurité & Délai d Inactivité' },
  { url: `${BASE_URL}#admin-overview`, file: 'effect_19_admin_overview.png', label: 'Plateforme — Tableau de Bord d Administration Générale' },

  // Pair 20: Piste d Audit & Traçabilité
  { url: `${BASE_URL}#admin-audit`, file: 'admin_20_audit_history.png', label: 'Administration — Piste d Audit des Configurations' },
  { url: `${BASE_URL}#audit`, file: 'effect_20_system_audit_log.png', label: 'Plateforme — Journal d Audit Général des Événements' },
];

async function run() {
  console.log('Lancement du navigateur pour les captures en MODE CLAIR...');
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

  // Force Light Mode in local storage and root element before every navigation
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('coresi_theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });

  // Navigate once to init
  await page.goto(`${BASE_URL}#dashboard`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Force light mode in DOM
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  });

  let count = 0;
  for (const item of CAPTURES) {
    count++;
    console.log(`[${count}/${CAPTURES.length}] Capture: ${item.label} -> ${item.file}`);
    await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Ensure light mode is strictly applied
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });

    // Special trigger for Print Modal on pair 18
    if (item.file === 'effect_18_print_a4_modal.png') {
      try {
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const printBtn = btns.find(
            (b) =>
              b.title?.toLowerCase().includes('imprimer') ||
              b.textContent?.toLowerCase().includes('imprimer') ||
              b.innerHTML.includes('Printer')
          );
          if (printBtn) printBtn.click();
        });
        await new Promise((r) => setTimeout(r, 1200));
      } catch (e) {}
    }

    await new Promise((r) => setTimeout(r, 1000));
    const dest = path.join(OUTPUT_DIR, item.file);
    await page.screenshot({ path: dest, fullPage: false });
    console.log(`✓ Enregistré : ${item.file}`);
  }

  await browser.close();
  console.log('✓ Toutes les captures appariées en MODE CLAIR ont été générées avec succès !');
}

run().catch((err) => {
  console.error('Erreur captures appariées:', err);
  process.exit(1);
});
