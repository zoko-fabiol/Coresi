import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const ASSETS_DIR = path.resolve('docs/manual_assets');
const OUTPUT_PDF = path.resolve('CORESI_Manuel_Utilisation_Officiel_v2.0.pdf');
const OUTPUT_HTML = path.resolve('docs/manuel_utilisation_coresi.html');

function getBase64Image(filename) {
  const filePath = path.join(ASSETS_DIR, filename);
  if (!fs.existsSync(filePath)) return '';
  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

console.log('Encodage des captures en base64 pour un document PDF autonome...');
const imgDashboard = getBase64Image('01_dashboard.png');
const imgGed = getBase64Image('02_ged.png');
const imgProjects = getBase64Image('03_projects.png');
const imgSites = getBase64Image('04_sites.png');
const imgReports = getBase64Image('05_reports.png');
const imgMaterials = getBase64Image('06_materials.png');
const imgMaintenance = getBase64Image('07_maintenance.png');
const imgPurchases = getBase64Image('08_purchases.png');
const imgFinances = getBase64Image('09_finances.png');
const imgAccounting = getBase64Image('10_accounting.png');
const imgPartners = getBase64Image('11_partners.png');
const imgHr = getBase64Image('12_hr.png');
const imgPayroll = getBase64Image('13_payroll.png');
const imgMissions = getBase64Image('14_missions.png');
const imgAudit = getBase64Image('15_audit.png');
const imgAdmin = getBase64Image('16_admin.png');
const imgAdminSpec = getBase64Image('17_admin_specialized.png');
const imgPrintModal = getBase64Image('18_print_modal.png');

console.log('Génération du contenu HTML structuré du manuel...');

const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>CORESI INTERNATIONAL — Manuel d'Utilisation Intégral v2.0</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 12mm 16mm 12mm;
      @bottom-right {
        content: counter(page);
      }
    }
    
    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }

    .page-break {
      page-break-before: always;
    }

    .no-break {
      page-break-inside: avoid;
    }

    /* Cover Page */
    .cover {
      height: 980px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 3px solid #3B7A2C;
      padding: 40px;
      border-radius: 8px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      position: relative;
    }

    .cover-top {
      border-bottom: 2px solid #3B7A2C;
      padding-bottom: 25px;
    }

    .company-title {
      font-size: 26pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0;
    }

    .company-sub {
      font-size: 10.5pt;
      font-weight: 700;
      color: #3B7A2C;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }

    .cover-center {
      text-align: center;
      padding: 40px 10px;
    }

    .badge-doc {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 9.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
    }

    .main-title {
      font-size: 32pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.15;
      margin: 0 0 15px 0;
    }

    .main-sub {
      font-size: 13pt;
      color: #475569;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.5;
    }

    .cover-meta {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 16px;
      font-size: 9.5pt;
      margin-top: 30px;
      text-align: left;
    }

    .cover-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 15px;
      font-size: 8.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }

    /* Headings */
    h1 {
      font-size: 19pt;
      font-weight: 900;
      color: #0f172a;
      border-left: 6px solid #3B7A2C;
      padding-left: 12px;
      margin: 0 0 15px 0;
      letter-spacing: -0.3px;
    }

    h2 {
      font-size: 14pt;
      font-weight: 800;
      color: #1e293b;
      margin: 22px 0 10px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
    }

    h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #334155;
      margin: 14px 0 6px 0;
    }

    p {
      margin: 0 0 10px 0;
      text-align: justify;
    }

    /* Screenshot container */
    .screenshot-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      margin: 14px 0 8px 0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      background: #0f172a;
    }

    .screenshot-img {
      width: 100%;
      height: auto;
      display: block;
    }

    .screenshot-caption {
      font-size: 8.5pt;
      font-style: italic;
      color: #64748b;
      text-align: center;
      margin-bottom: 14px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9.5pt;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      text-align: left;
    }

    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Callout Boxes */
    .callout {
      border-left: 4px solid #3B7A2C;
      background: #f0fdf4;
      padding: 12px 14px;
      border-radius: 0 6px 6px 0;
      margin: 12px 0;
      font-size: 9.5pt;
    }

    .callout-title {
      font-weight: 800;
      color: #166534;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .callout-warning {
      border-left-color: #d97706;
      background: #fffbeb;
    }

    .callout-warning .callout-title {
      color: #92400e;
    }

    .callout-info {
      border-left-color: #0284c7;
      background: #f0f9ff;
    }

    .callout-info .callout-title {
      color: #0369a1;
    }

    /* Steps list */
    .step-list {
      margin: 10px 0;
      padding-left: 20px;
    }

    .step-list li {
      margin-bottom: 6px;
      padding-left: 4px;
    }

    .step-list strong {
      color: #0f172a;
    }

    /* Key-Value Tag */
    .tag {
      display: inline-block;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background: #e2e8f0;
      color: #334155;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 700;
    }

    .toc {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dotted #cbd5e1;
      padding: 5px 0;
      font-size: 10pt;
    }

    .toc-item strong {
      color: #0f172a;
    }
  </style>
</head>
<body>

  <!-- ==================== 1. PAGE DE COUVERTURE ==================== -->
  <div class="cover">
    <div class="cover-top">
      <h1 class="company-title" style="border:none; padding:0;">CORESI <span style="color:#3B7A2C;">INTERNATIONAL</span> SARL</h1>
      <p class="company-sub">Chaudronnerie · Tuyauterie Haute Pression · Maintenance Industrielle &amp; GED</p>
      <p style="font-size:8.5pt; color:#64748b; margin-top:6px;">
        Siège Social : Zone Industrielle, Pointe-Noire · Agence : Brazzaville · République du Congo<br>
        RCCM : CG-PNR-01-2018-B12-00452 · NIF : 020181000049281
      </p>
    </div>

    <div class="cover-center">
      <div class="badge-doc">Manuel d'Exploitation Officiel · Version 2.0</div>
      <h2 class="main-title" style="border:none;">GUIDE D'UTILISATION &amp;<br>MODE D'EMPLOI INTÉGRAL</h2>
      <p class="main-sub">
        Documentation complète du progiciel de gestion intégrée CORESI ERP &amp; GED Industrielle : processus métiers, circuits de validation, guide pas-à-pas et paramétrage d'administration.
      </p>

      <div class="cover-meta">
        <div>
          <strong>Système :</strong> CORESI ERP &amp; GED Industrielle v2.0<br>
          <strong>Environnement :</strong> Cloud &amp; Local Hybride (Offline-First)<br>
          <strong>Normes Prises en Compte :</strong> ASME IX, CODAP, ISO 9606-1, OHADA
        </div>
        <div>
          <strong>Date d'Édition :</strong> Septembre 2026<br>
          <strong>Classification :</strong> Document Confidentiel Interne<br>
          <strong>Public Cible :</strong> Direction Générale, Chefs de Chantier, Métreurs, Magasiniers, RH &amp; Comptabilité
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <span>CORESI INTERNATIONAL SARL — Tous droits réservés</span>
      <span>Direction des Opérations &amp; Systèmes d'Information</span>
    </div>
  </div>

  <!-- ==================== 2. TABLE DES MATIÈRES ==================== -->
  <div class="page-break"></div>
  <h1>Table des Matières</h1>
  <p>Ce guide détaille le fonctionnement complet des 16 modules opérationnels, des circuits de validation et du centre d'administration de la plateforme CORESI.</p>

  <div class="toc">
    <div class="toc-item"><span><strong>Section 1 :</strong> Architecture, Rôles &amp; Sécurité des Accès</span> <span>p. 3</span></div>
    <div class="toc-item"><span><strong>Section 2 :</strong> Module 1 — Tableau de Bord DG &amp; Pilotage Opérationnel</span> <span>p. 4</span></div>
    <div class="toc-item"><span><strong>Section 3 :</strong> Module 2 — GED &amp; Coffre-Fort Numérique</span> <span>p. 5</span></div>
    <div class="toc-item"><span><strong>Section 4 :</strong> Module 3 — Chantiers, Projets &amp; Suivi d'Avancement</span> <span>p. 6</span></div>
    <div class="toc-item"><span><strong>Section 5 :</strong> Module 4 — Multi-Sites &amp; Transferts Inter-Chantiers</span> <span>p. 7</span></div>
    <div class="toc-item"><span><strong>Section 6 :</strong> Module 5 — Rapports &amp; PV Techniques d'Épreuve Hydraulique</span> <span>p. 8</span></div>
    <div class="toc-item"><span><strong>Section 7 :</strong> Module 6 — Parc Matériel, Outillages &amp; Stocks</span> <span>p. 9</span></div>
    <div class="toc-item"><span><strong>Section 8 :</strong> Module 7 — Maintenance Industrielle &amp; GMAO</span> <span>p. 10</span></div>
    <div class="toc-item"><span><strong>Section 9 :</strong> Module 8 — Achats, Demandes d'Achat (DA) &amp; Commandes (BC)</span> <span>p. 11</span></div>
    <div class="toc-item"><span><strong>Section 10 :</strong> Module 9 — Finances, Facturation &amp; Journal de Trésorerie</span> <span>p. 12</span></div>
    <div class="toc-item"><span><strong>Section 11 :</strong> Module 10 — Comptabilité Avancée SYSCOHADA</span> <span>p. 13</span></div>
    <div class="toc-item"><span><strong>Section 12 :</strong> Module 11 — Clients, Fournisseurs &amp; Agréments HSE</span> <span>p. 14</span></div>
    <div class="toc-item"><span><strong>Section 13 :</strong> Module 12 — Personnel, RH &amp; Licences de Soudage</span> <span>p. 15</span></div>
    <div class="toc-item"><span><strong>Section 14 :</strong> Module 13 — Paie &amp; Cotisations Sociales CNSS Congo</span> <span>p. 16</span></div>
    <div class="toc-item"><span><strong>Section 15 :</strong> Module 14 — Missions, Ordres de Déplacement &amp; Perdiems</span> <span>p. 17</span></div>
    <div class="toc-item"><span><strong>Section 16 :</strong> Module 15 — Piste d'Audit &amp; Journal des Événements</span> <span>p. 18</span></div>
    <div class="toc-item"><span><strong>Section 17 :</strong> Module 16 — Centre d'Administration &amp; 15 Univers de Paramétrage</span> <span>p. 19</span></div>
    <div class="toc-item"><span><strong>Section 18 :</strong> Moteur d'Impression A4 &amp; Documents Certifiés</span> <span>p. 20</span></div>
    <div class="toc-item"><span><strong>Section 19 :</strong> Procédures Opérationnelles Pas-à-Pas (Workflows Clés)</span> <span>p. 21</span></div>
    <div class="toc-item"><span><strong>Section 20 :</strong> Foire Aux Questions (FAQ) &amp; Dépannage Système</span> <span>p. 22</span></div>
  </div>

  <!-- ==================== 3. SECTION ARCHITECTURE & RÔLES ==================== -->
  <h2>1. Architecture &amp; Rôles Utilisateurs</h2>
  <p>
    La plateforme CORESI ERP est conçue selon une architecture modulaire et étanche. Chaque utilisateur accède uniquement aux données et écrans autorisés selon son profil de sécurité (RBAC - Role-Based Access Control).
  </p>

  <table>
    <thead>
      <tr>
        <th>Code Rôle</th>
        <th>Intitulé du Poste</th>
        <th>Périmètre Opérationnel</th>
        <th>Pouvoir d'Approbation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="tag">DG</span></td>
        <td>Directeur Général</td>
        <td>Supervision intégrale, trésorerie, audit, administration</td>
        <td>Illimité / Dernier Ressort</td>
      </tr>
      <tr>
        <td><span class="tag">DT</span></td>
        <td>Directeur Technique</td>
        <td>Projets, PV épreuves, outillages, GMAO, chantiers</td>
        <td>Visas techniques &amp; DA &lt; 5M FCFA</td>
      </tr>
      <tr>
        <td><span class="tag">CP</span></td>
        <td>Chef de Projet</td>
        <td>Gestion budgétaire chantier, pointage ouvriers, avancement</td>
        <td>DA &lt; 1M FCFA</td>
      </tr>
      <tr>
        <td><span class="tag">MAG</span></td>
        <td>Magasinier / Gestionnaire Stock</td>
        <td>Entrées/sorties, transferts inter-sites, outillage, alertes</td>
        <td>Bons de réception &amp; décharges</td>
      </tr>
      <tr>
        <td><span class="tag">QUAL</span></td>
        <td>Responsable Qualité &amp; HSE</td>
        <td>Licences de soudage, PV CND, contrôles épreuves</td>
        <td>Certification conformité</td>
      </tr>
      <tr>
        <td><span class="tag">COMPTA</span></td>
        <td>Comptable / Trésorier</td>
        <td>Factures, écritures SYSCOHADA, états de rapprochement</td>
        <td>Bons à payer visés par DG</td>
      </tr>
      <tr>
        <td><span class="tag">RH</span></td>
        <td>Responsable Ressources Humaines</td>
        <td>Contrats, dossiers salariés, calcul bulletins, CNSS</td>
        <td>Gestion administrative du personnel</td>
      </tr>
      <tr>
        <td><span class="tag">ADMIN</span></td>
        <td>Administrateur Système</td>
        <td>Activation modules, rôles, numérotation, sécurité</td>
        <td>Gestion technique de l'ERP</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-info">
    <div class="callout-title">Sécurité Renforcée &amp; Déconnexion Automatique</div>
    Pour prévenir toute utilisation frauduleuse lors des déplacements sur chantier, la session est automatiquement verrouillée après 15 minutes d'inactivité (délai paramétrable dans l'administration). Le déverrouillage s'effectue instantanément grâce au <strong>Code PIN Rapide</strong> ou par ré-authentification.
  </div>

  <!-- ==================== 4. MODULE DASHBOARD ==================== -->
  <div class="page-break"></div>
  <h1>Module 1 — Tableau de Bord DG &amp; Pilotage Opérationnel</h1>
  <p>
    Le Tableau de Bord de la Direction Générale constitue le centre névralgique de supervision de CORESI. Il synthétise en temps réel la santé financière, la rentabilité des chantiers en cours, les alertes d'approvisionnement et les échéances réglementaires.
  </p>

  <div class="screenshot-box">
    <img src="${imgDashboard}" class="screenshot-img" alt="Tableau de Bord DG">
  </div>
  <div class="screenshot-caption">Figure 1.1 : Vue d'ensemble du Tableau de Bord Direction Générale CORESI.</div>

  <h2>Indicateurs Clés de Performance (KPIs)</h2>
  <ul>
    <li><strong>Chiffre d'Affaires Réalisé :</strong> Cumul des facturations émises validées et payées sur la période.</li>
    <li><strong>Rentabilité Nette des Chantiers :</strong> Marge réelle calculée en déduisant les achats, la main-d'œuvre et les frais généraux du budget contractuel.</li>
    <li><strong>Heures Chantiers Travaillées :</strong> Suivi des heures pointées par les équipes de tuyauterie et de soudage.</li>
    <li><strong>Taux de Conformité HSE :</strong> Ratio des causeries sécurité tenues et des qualifications de soudeurs valides.</li>
  </ul>

  <!-- ==================== 5. MODULE GED ==================== -->
  <div class="page-break"></div>
  <h1>Module 2 — GED &amp; Coffre-Fort Numérique</h1>
  <p>
    La Gestion Électronique des Documents (GED) garantit la conservation sécurisée, l'indexation multicritère et la traçabilité des pièces administratives et industrielles de l'entreprise.
  </p>

  <div class="screenshot-box">
    <img src="${imgGed}" class="screenshot-img" alt="GED Documents">
  </div>
  <div class="screenshot-caption">Figure 2.1 : Coffre-fort documentaire avec filtres par catégorie, projet et statut de visa.</div>

  <h2>Fonctionnalités Principales</h2>
  <ul>
    <li><strong>Rangement par Dossier Métier :</strong> Dossiers Techniques chantiers, Factures fournisseurs, Documents RH, Certificats d'épreuve.</li>
    <li><strong>Reconnaissance Automatique OCR :</strong> Extraction optique des montants, dates et numéros de pièces sur les factures et bons de livraison scannés.</li>
    <li><strong>Tampon de Visa Électronique :</strong> Apposition automatique de la mention "Certifié Conforme" ou "Bon à Payer" horodatée avec l'identifiant du signataire.</li>
    <li><strong>Rétention Documentaire :</strong> Conservation légale de 10 ans conformément aux exigences OHADA et aux standards des compagnies pétrolières partenaires.</li>
  </ul>

  <!-- ==================== 6. MODULE PROJETS ==================== -->
  <div class="page-break"></div>
  <h1>Module 3 — Chantiers, Projets &amp; Suivi d'Avancement</h1>
  <p>
    Ce module centralise la gestion technique et financière de chaque contrat de chaudronnerie, tuyauterie industrielle ou maintenance sur site client.
  </p>

  <div class="screenshot-box">
    <img src="${imgProjects}" class="screenshot-img" alt="Chantiers & Projets">
  </div>
  <div class="screenshot-caption">Figure 3.1 : Tableau de bord de suivi des chantiers avec jalons, budgets engagés et alertes.</div>

  <h2>Workflow de Pilotage d'un Projet</h2>
  <ol class="step-list">
    <li><strong>Création du Projet :</strong> Renseigner le code affaire, le client donneur d'ordre, le site d'intervention et le budget alloué.</li>
    <li><strong>Affectation des Équipes :</strong> Assigner le Chef de Projet, les soudeurs qualifiés et les tuyauteurs.</li>
    <li><strong>Surveillance Budgétaire en Direct :</strong> Alerte préventive à 80% du budget consommé et alerte critique à 95% pour prévenir les dérives financières.</li>
    <li><strong>Clôture &amp; Récolement :</strong> Exigence des livrables obligatoires (PV d'épreuve, attestation de fin de travaux signée client) avant archivage.</li>
  </ol>

  <!-- ==================== 7. MODULE MULTI-SITES ==================== -->
  <div class="page-break"></div>
  <h1>Module 4 — Multi-Sites &amp; Transferts Inter-Chantiers</h1>
  <p>
    Gère la répartition des outillages lourds, des consommables de soudage et des équipes mobiles entre la Base Principale de Pointe-Noire et les différents chantiers déportés (Brazzaville, Kouilou, sites pétroliers onshore/offshore).
  </p>

  <div class="screenshot-box">
    <img src="${imgSites}" class="screenshot-img" alt="Multi-Sites">
  </div>
  <div class="screenshot-caption">Figure 4.1 : Vue cartographique et opérationnelle des sites et conteneurs d'outillage.</div>

  <h2>Règles de Transfert Inter-Sites</h2>
  <div class="callout">
    <div class="callout-title">Règle du Double Visa Obligatoire</div>
    Tout transfert d'équipement d'une valeur supérieure à 500 000 FCFA requiert la validation de l'émetteur (visa expédition) et du récepteur (visa conformité à réception) afin d'éliminer toute perte de matériel sur la route ou le fleuve.
  </div>

  <!-- ==================== 8. MODULE RAPPORTS & PV TECHNIQUES ==================== -->
  <div class="page-break"></div>
  <h1>Module 5 — Rapports &amp; PV d'Épreuves Hydrauliques</h1>
  <p>
    Édition, homologation et archivage des Procès-Verbaux de contrôle technique : tests de pression hydrostatique, contrôles non destructifs (CND - ressuage, magnétoscopie, radiographie) et certificats de lignage.
  </p>

  <div class="screenshot-box">
    <img src="${imgReports}" class="screenshot-img" alt="Rapports & PV Techniques">
  </div>
  <div class="screenshot-caption">Figure 5.1 : Liste des PV d'épreuves techniques homologués selon normes CODAP / ASME.</div>

  <h2>Paramètres Critiques d'Épreuve Hydraulique</h2>
  <ul>
    <li><strong>Pression d'Épreuve (PE) :</strong> Calculée automatiquement selon la norme sélectionnée (généralement 1.43x ou 1.50x la Pression de Service).</li>
    <li><strong>Durée de Maintien :</strong> Minutage réglementaire minimum de 30 minutes sans baisse de pression constatée au manomètre étalonné.</li>
    <li><strong>Traçabilité des Soudures :</strong> Association directe avec le numéro d'isométrique et les poinçons des soudeurs ayant exécuté les joints.</li>
  </ul>

  <!-- ==================== 9. MODULE PARC MATERIEL & STOCKS ==================== -->
  <div class="page-break"></div>
  <h1>Module 6 — Parc Matériel, Outillages &amp; Stocks</h1>
  <p>
    Inventaire permanent des matières premières (tubes acier carbone, inox, raccords, coudes, brides, profilés, tôles) et suivi des outillages de chantier (groupes autonomes, postes TIG/MIG, meuleuses, chanfreineuses).
  </p>

  <div class="screenshot-box">
    <img src="${imgMaterials}" class="screenshot-img" alt="Parc Matériel & Stocks">
  </div>
  <div class="screenshot-caption">Figure 6.1 : Gestion de stock avec seuils d'alerte et suivi des numéros de série outillage.</div>

  <h2>Traçabilité Matière (Certificats 3.1)</h2>
  <p>
    Chaque lot d'acier réceptionné est relié à son numéro de coulée d'usine et son certificat matière 3.1 EN 10204, garantissant la conformité métallurgique exigée par les donneurs d'ordre industriels.
  </p>

  <!-- ==================== 10. MODULE GMAO ==================== -->
  <div class="page-break"></div>
  <h1>Module 7 — Maintenance Industrielle &amp; GMAO</h1>
  <p>
    La Gestion de Maintenance Assistée par Ordinateur (GMAO) assure la disponibilité maximale des machines de découpe, compresseurs et groupes de soudage par un suivi préventif des heures de fonctionnement.
  </p>

  <div class="screenshot-box">
    <img src="${imgMaintenance}" class="screenshot-img" alt="GMAO Maintenance">
  </div>
  <div class="screenshot-caption">Figure 7.1 : Suivi des compteurs d'heures et ordres de travail (OT) préventifs et correctifs.</div>

  <h2>Types d'Interventions</h2>
  <ul>
    <li><strong>Maintenance Préventive :</strong> Déclenchée automatiquement à chaque palier de 250h ou 500h de marche (vidanges, filtres, étalonnages).</li>
    <li><strong>Maintenance Corrective :</strong> Émission immédiate d'un Ordre de Travail (OT) d'urgence avec diagnostic obligatoire avant réintégration en service.</li>
  </ul>

  <!-- ==================== 11. MODULE ACHATS ==================== -->
  <div class="page-break"></div>
  <h1>Module 8 — Achats, Demandes (DA) &amp; Commandes (BC)</h1>
  <p>
    Encadre le cycle complet des approvisionnements : expression de besoin par le chantier, consultation des fournisseurs, émission du Bon de Commande officiel et contrôle de réception physique.
  </p>

  <div class="screenshot-box">
    <img src="${imgPurchases}" class="screenshot-img" alt="Achats & Commandes">
  </div>
  <div class="screenshot-caption">Figure 8.1 : Circuit des commandes avec états de validation et comparaison des devis.</div>

  <h2>Circuit d'Approbation Hiérarchique</h2>
  <ol class="step-list">
    <li><strong>Demande d'Achat (DA) :</strong> Rédigée par le Chef de Projet ou le Magasinier avec justification de chantier.</li>
    <li><strong>Règle des 3 Devis :</strong> Obligatoire pour tout achat supérieur à 1 000 000 FCFA afin de garantir les meilleurs tarifs du marché congolais.</li>
    <li><strong>Visa N1 (Chef de Département) :</strong> Validation jusqu'à 2 500 000 FCFA.</li>
    <li><strong>Visa N2 (Direction Générale) :</strong> Approbation obligatoire pour tout engagement supérieur à 2 500 000 FCFA.</li>
    <li><strong>Génération Automatique du BC :</strong> Bon de commande officiel au format A4 avec mentions légales et cachet.</li>
  </ol>

  <!-- ==================== 12. MODULE FINANCES ==================== -->
  <div class="page-break"></div>
  <h1>Module 9 — Finances, Facturation &amp; Trésorerie</h1>
  <p>
    Suivi des créances clients, émission des devis et factures proforma/définitives, tenue du journal de caisse espèces et alertes sur les retards d'encaissement.
  </p>

  <div class="screenshot-box">
    <img src="${imgFinances}" class="screenshot-img" alt="Finances & Factures">
  </div>
  <div class="screenshot-caption">Figure 9.1 : Facturation client, échéancier des paiements et journal des dépenses.</div>

  <h2>Règles Financières CORESI</h2>
  <ul>
    <li><strong>TVA Légale :</strong> Application du taux de 18% en vigueur en République du Congo.</li>
    <li><strong>Plafond Espèces :</strong> Règlement en espèces strictement plafonné à 2 500 000 FCFA conformément à la réglementation bancaire CEMAC.</li>
    <li><strong>Délai Standard d'Échéance :</strong> 30 jours nets date de facture pour les clients contractuels.</li>
  </ul>

  <!-- ==================== 13. MODULE COMPTABILITE SYSCOHADA ==================== -->
  <div class="page-break"></div>
  <h1>Module 10 — Comptabilité Avancée SYSCOHADA</h1>
  <p>
    Intègre le plan comptable général révisé OHADA : saisie des écritures, grand livre des comptes auxiliaires, balance générale et états de rapprochement bancaire.
  </p>

  <div class="screenshot-box">
    <img src="${imgAccounting}" class="screenshot-img" alt="Comptabilité Avancée">
  </div>
  <div class="screenshot-caption">Figure 10.1 : Journaux comptables auxiliaires et balance générale SYSCOHADA.</div>

  <h2>Journaux Comptables Pré-paramétrés</h2>
  <ul>
    <li><span class="tag">JNL-ACH</span> Journal des Achats Matières &amp; Sous-traitance</li>
    <li><span class="tag">JNL-VTE</span> Journal des Ventes &amp; Prestations de Chaudronnerie</li>
    <li><span class="tag">JNL-BNQ</span> Journal de Banque (UBA / BGFI / LCB)</li>
    <li><span class="tag">JNL-CAI</span> Journal de Caisse Principale Pointe-Noire</li>
    <li><span class="tag">JNL-OD</span> Opérations Diverses &amp; Salaires</li>
  </ul>

  <!-- ==================== 14. MODULE PARTENAIRES ==================== -->
  <div class="page-break"></div>
  <h1>Module 11 — Clients, Fournisseurs &amp; Agréments HSE</h1>
  <p>
    Répertoire central des donneurs d'ordre (compagnies pétrolières, industriels) et des sous-traitants agréés avec suivi de leurs attestations fiscales et certifications de sécurité.
  </p>

  <div class="screenshot-box">
    <img src="${imgPartners}" class="screenshot-img" alt="Partenaires & Tiers">
  </div>
  <div class="screenshot-caption">Figure 11.1 : Fiches d'agrément tiers avec critères de notation qualité et statut NIF/RCCM.</div>

  <h2>Conditions d'Agrément Sous-Traitant</h2>
  <div class="callout callout-warning">
    <div class="callout-title">Contrôle de Conformité Préalable</div>
    Aucune commande ne peut être adressée à un sous-traitant sans attestation fiscale NIF valide, extrait RCCM de moins de 3 mois et validation du Plan Particulier de Sécurité et de Protection de la Santé (PPSPS).
  </div>

  <!-- ==================== 15. MODULE RH & SOUDEURS ==================== -->
  <div class="page-break"></div>
  <h1>Module 12 — Personnel, RH &amp; Licences de Soudage</h1>
  <p>
    Administration des effectifs permanents et des prestataires journaliers de chantier : dossiers administratifs, contrats, visites médicales d'aptitude et licences de qualification des soudeurs.
  </p>

  <div class="screenshot-box">
    <img src="${imgHr}" class="screenshot-img" alt="Personnel & RH">
  </div>
  <div class="screenshot-caption">Figure 12.1 : Registre du personnel et surveillance des dates d'échéance des licences ASME 6G.</div>

  <h2>Surveillance des Qualifications de Soudage (QS / QMOS)</h2>
  <ul>
    <li><strong>Alerte à J-30 :</strong> Notification automatique au Responsable Qualité 30 jours avant l'expiration d'une licence de soudeur.</li>
    <li><strong>Blocage Sécuritaire :</strong> Tout soudeur dont la qualification est échue ne peut plus être affecté à un joint sous pression dans le module Projets.</li>
  </ul>

  <!-- ==================== 16. MODULE PAIE & CNSS ==================== -->
  <div class="page-break"></div>
  <h1>Module 13 — Paie &amp; Cotisations Sociales CNSS Congo</h1>
  <p>
    Édition mensuelle des bulletins de salaire aux normes du Code du Travail de la République du Congo : calcul automatique du salaire brut, des heures supplémentaires de chantier, des primes et des retenues légales.
  </p>

  <div class="screenshot-box">
    <img src="${imgPayroll}" class="screenshot-img" alt="Paie & CNSS">
  </div>
  <div class="screenshot-caption">Figure 13.1 : Périodes de paie, calcul des retenues CNSS et bulletins de salaires officiels.</div>

  <h2>Barème des Cotisations Sociales au Congo</h2>
  <table>
    <thead>
      <tr>
        <th>Nature de la Cotisation</th>
        <th>Taux Salarié</th>
        <th>Taux Employeur</th>
        <th>Assiette / Plafond</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>CNSS (Régime Général &amp; Retraite)</td>
        <td>4.0 %</td>
        <td>16.0 %</td>
        <td>Salaire Brut (Plafond légal 1 200 000 FCFA)</td>
      </tr>
      <tr>
        <td>Indemnité Légale de Transport</td>
        <td>Exonéré</td>
        <td>Forfaitaire</td>
        <td>Montant conventionnel mensuel</td>
      </tr>
      <tr>
        <td>Prime de Panier / Chantier Offshore</td>
        <td>Exonéré</td>
        <td>Forfaitaire</td>
        <td>Allouée par jour effectif sur site</td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== 17. MODULE MISSIONS ==================== -->
  <div class="page-break"></div>
  <h1>Module 14 — Missions, Déplacements &amp; Perdiems</h1>
  <p>
    Encadre les mobilités géographiques des équipes techniques : émission de l'Ordre de Mission officiel signé par la DG, calcul des indemnités forfaitaires journalières (perdiems) et décharge des avances de trésorerie.
  </p>

  <div class="screenshot-box">
    <img src="${imgMissions}" class="screenshot-img" alt="Missions & Déplacements">
  </div>
  <div class="screenshot-caption">Figure 14.1 : Ordres de mission, barèmes perdiems et suivi des décharges de frais.</div>

  <h2>Barème Standard des Perdiems CORESI</h2>
  <ul>
    <li><strong>Zone 1 — Onshore National :</strong> 25 000 FCFA / jour (Brazzaville, Pointe-Noire hors base, Dolisie).</li>
    <li><strong>Zone 2 — Offshore / Plateforme Pétrolière :</strong> 45 000 FCFA / jour (Champs en mer, contraintes maritimes).</li>
    <li><strong>Zone 3 — International :</strong> 80 000 FCFA / jour (Sous-région CEMAC et missions étrangères).</li>
  </ul>

  <!-- ==================== 18. MODULE AUDIT ==================== -->
  <div class="page-break"></div>
  <h1>Module 15 — Piste d'Audit &amp; Journal des Événements</h1>
  <p>
    Enregistre de manière inviolable et horodatée la totalité des opérations sensibles exécutées sur le progiciel, garantissant une conformité absolue lors des audits financiers et de certification ISO 9001.
  </p>

  <div class="screenshot-box">
    <img src="${imgAudit}" class="screenshot-img" alt="Piste d'Audit">
  </div>
  <div class="screenshot-caption">Figure 15.1 : Journal d'audit complet avec horodatage, utilisateur, adresse IP et détails de l'action.</div>

  <h2>Événements Tracés Systématiquement</h2>
  <ul>
    <li>Connexions, tentatives échouées et verrouillages de compte.</li>
    <li>Création, modification, validation et archivage de documents GED.</li>
    <li>Validation de dépenses, ordonnancements de paiement et virements.</li>
    <li>Toute modification des paramètres d'administration et des droits d'accès.</li>
  </ul>

  <!-- ==================== 19. MODULE ADMINISTRATION ==================== -->
  <div class="page-break"></div>
  <h1>Module 16 — Centre d'Administration &amp; Pilotage 100%</h1>
  <p>
    Le Centre d'Administration permet à la Direction Générale et à l'Administrateur Système de configurer l'ensemble des modules, des workflows de validation et des règles de numérotation sans aucune modification du code source.
  </p>

  <div class="screenshot-box">
    <img src="${imgAdmin}" class="screenshot-img" alt="Centre d'Administration">
  </div>
  <div class="screenshot-caption">Figure 16.1 : Centre d'administration central avec état des modules et matrice des permissions.</div>

  <h2>Capacités du Moteur d'Administration</h2>
  <ul>
    <li><strong>Activation / Désactivation à Chaud des Modules :</strong> Masquage ou affichage instantané dans la barre latérale pour tous les collaborateurs connectés.</li>
    <li><strong>Workflows Paramétrables :</strong> Définition des circuits d'approbation et seuils financiers par entité.</li>
    <li><strong>Numérotation Automatique :</strong> Personnalisation des préfixes, compteurs et formats annuels (ex: <span class="tag">DA-2026-0042</span>, <span class="tag">PV-2026-0118</span>).</li>
  </ul>

  <!-- ==================== 20. PARAMETRES SPECIALISES ==================== -->
  <div class="page-break"></div>
  <h1>Section 17 — Paramétrage des 15 Univers de Gestion</h1>
  <p>
    Chaque univers métier dispose de son interface dédiée dans l'Administration pour ajuster les constantes de calcul, les seuils d'alerte et les règles de conformité.
  </p>

  <div class="screenshot-box">
    <img src="${imgAdminSpec}" class="screenshot-img" alt="Paramètres Spécialisés">
  </div>
  <div class="screenshot-caption">Figure 17.1 : Interface de configuration fine des paramètres financiers et TVA.</div>

  <table>
    <thead>
      <tr>
        <th>Univers</th>
        <th>Paramètres Principaux Modifiables</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Finance</strong></td>
        <td>Devise (FCFA), Taux de TVA (18%), Plafond caisse espèces, Modes de paiement autorisés.</td>
      </tr>
      <tr>
        <td><strong>GED</strong></td>
        <td>Durée de conservation légale, Poids maximal des uploads, Versioning automatique.</td>
      </tr>
      <tr>
        <td><strong>Scanner/OCR</strong></td>
        <td>Détection de contours, Redressement d'angle, Dictionnaire de reconnaissance (FR/EN).</td>
      </tr>
      <tr>
        <td><strong>Projets</strong></td>
        <td>Seuils d'alerte budget (80% et 95%), Fréquence des comptes-rendus, Briefing HSE.</td>
      </tr>
      <tr>
        <td><strong>Stocks</strong></td>
        <td>Seuil d'alerte minimum global, Multi-magasins, Traçabilité numéro de série et coulée.</td>
      </tr>
      <tr>
        <td><strong>RH</strong></td>
        <td>Délai d'alerte péremption licences soudeurs (30 jours), Départements actifs.</td>
      </tr>
      <tr>
        <td><strong>GMAO</strong></td>
        <td>Heures de révision préventive (250h/500h), Diagnostic obligatoire avant clôture OT.</td>
      </tr>
      <tr>
        <td><strong>Missions</strong></td>
        <td>Barèmes perdiems Onshore/Offshore, Avance maximale (%), Délai justificatifs retour.</td>
      </tr>
      <tr>
        <td><strong>Multi-Sites</strong></td>
        <td>Base opérationnelle principale, Double visa obligatoire pour transferts d'équipements.</td>
      </tr>
      <tr>
        <td><strong>Rapports PV</strong></td>
        <td>Facteur de surpression épreuve (1.50x PS), Durée maintien (30 min), Visa DT obligatoire.</td>
      </tr>
      <tr>
        <td><strong>Achats</strong></td>
        <td>Seuils N1/N2, Règle des 3 devis obligatoires, Tolérance quantité livraison (5%).</td>
      </tr>
      <tr>
        <td><strong>Partenaires</strong></td>
        <td>Délai de paiement standard (60 jours), Pièces HSE exigées, Conformité NIF/RCCM.</td>
      </tr>
      <tr>
        <td><strong>Paie</strong></td>
        <td>Taux CNSS salarial (4%) et patronal (16%), Indemnités transport, Primes chantier.</td>
      </tr>
      <tr>
        <td><strong>Impression A4</strong></td>
        <td>En-tête officiel, Mentions légales OHADA, Filigrane central, Signataires et cachets.</td>
      </tr>
      <tr>
        <td><strong>Notifications</strong></td>
        <td>Matrice des canaux (Interne, Email, Push) selon la criticité des alertes.</td>
      </tr>
    </tbody>
  </table>

  <!-- ==================== 21. IMPRESSION A4 ==================== -->
  <div class="page-break"></div>
  <h1>Section 18 — Moteur d'Impression &amp; Gabarits A4 Officiels</h1>
  <p>
    Le système intègre un moteur de rendu vectoriel A4 homologué assurant la génération de documents professionnels prêts à être imprimés ou téléchargés en PDF sécurisé.
  </p>

  <div class="screenshot-box">
    <img src="${imgPrintModal}" class="screenshot-img" alt="Gabarit A4 Officiel">
  </div>
  <div class="screenshot-caption">Figure 18.1 : Aperçu interactif A4 avec filigrane institutionnel, tableau d'articles et blocs de signature.</div>

  <h2>Composants Inclus dans Tout Document Officiel A4</h2>
  <ul>
    <li><strong>En-Tête Réglementaire :</strong> Logo haute résolution CORESI, coordonnées du siège à Pointe-Noire, NIF et RCCM.</li>
    <li><strong>Filigrane Central Anti-Falsification :</strong> Mention translucide en arrière-plan avec texte configurable en administration.</li>
    <li><strong>Bloc de Signatures Homologué :</strong> Emplacement pour le visa du responsable opérationnel, le tampon technique ASME/ISO et la signature "Bon pour accord" de la Direction Générale.</li>
    <li><strong>Pied de Page OHADA :</strong> Mentions de certification logicielle et date d'édition horodatée.</li>
  </ul>

  <!-- ==================== 22. PROCEDURES OPERATIONNELLES ==================== -->
  <div class="page-break"></div>
  <h1>Section 19 — Procédures Opérationnelles Pas-à-Pas</h1>
  <p>Guides d'exécution rapide pour les opérations les plus courantes sur le progiciel.</p>

  <h2>Procédure 1 : Créer et faire valider une Demande d'Achat (DA)</h2>
  <ol class="step-list">
    <li>Se rendre dans le module <span class="tag">Achats &amp; Commandes</span>.</li>
    <li>Cliquer sur le bouton vert <strong>+ Nouvelle Demande (DA)</strong> en haut à droite.</li>
    <li>Sélectionner le chantier destinataire et renseigner les lignes d'articles (désignation, quantité, prix estimé).</li>
    <li>Joindre au moins 3 devis fournisseurs si le montant total dépasse 1 000 000 FCFA.</li>
    <li>Cliquer sur <strong>Soumettre pour Approbation</strong>. La demande est transmise instantanément au Chef de Département (N1) puis à la DG (N2).</li>
    <li>Dès approbation finale, cliquer sur <strong>Générer le Bon de Commande (BC)</strong> pour édition immédiate au format A4.</li>
  </ol>

  <h2>Procédure 2 : Émettre et archiver un PV d'Épreuve Hydraulique</h2>
  <ol class="step-list">
    <li>Ouvrir le module <span class="tag">Rapports &amp; PV Techniques</span>.</li>
    <li>Sélectionner <strong>Créer un PV d'Épreuve</strong>.</li>
    <li>Renseigner la ligne de tuyauterie testée, la Pression de Service (PS) et la norme de calcul (CODAP / ASME).</li>
    <li>Le logiciel calcule automatiquement la Pression d'Épreuve (PE = 1.50x PS).</li>
    <li>Saisir les numéros de manomètres étalonnés et attester de la durée de palier de 30 minutes.</li>
    <li>Valider les signatures électroniques : Inspecteur Qualité, Chef de Projet et Directeur Technique.</li>
    <li>Le document est généré et archivé automatiquement dans le coffre-fort GED du chantier.</li>
  </ol>

  <!-- ==================== 23. FAQ & DEPANNAGE ==================== -->
  <div class="page-break"></div>
  <h1>Section 20 — Foire Aux Questions (FAQ) &amp; Dépannage</h1>

  <h3>Que faire en cas de déconnexion inopinée sur le terrain ?</h3>
  <p>
    La plateforme intègre un mode <em>Offline-First</em>. Toutes vos saisies en cours sont conservées localement dans la mémoire de votre navigateur. Dès que la liaison 4G/Wi-Fi est rétablie, les données sont automatiquement synchronisées avec le serveur central.
  </p>

  <h3>Un collaborateur a oublié son mot de passe ou son Code PIN ?</h3>
  <p>
    Un utilisateur disposant du rôle <span class="tag">DG</span> ou <span class="tag">ADMIN</span> peut réinitialiser le mot de passe ou le code PIN depuis le module <em>Comptes &amp; Rôles</em> du Centre d'Administration en un seul clic.
  </p>

  <h3>Comment rajouter un nouveau type de document ou une nouvelle norme ?</h3>
  <p>
    Inutile de modifier le code de l'application : rendez-vous dans le module <em>Administration</em> &gt; <em>Paramètres Spécialisés</em>, puis sélectionnez la section correspondante (GED, Rapports Techniques ou Achats) pour ajouter vos nouvelles valeurs.
  </p>

  <div style="margin-top:50px; padding:20px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; text-align:center;">
    <h3 style="margin-top:0; color:#3B7A2C;">Support Technique &amp; Assistance CORESI</h3>
    <p style="font-size:9.5pt; color:#475569; margin:0;">
      Pour toute assistance technique, signalement d'anomalie ou demande d'évolution, veuillez contacter la Direction des Systèmes d'Information :<br>
      <strong>Email :</strong> support-erp@coresi-international.com · <strong>Téléphone d'urgence :</strong> +242 06 600 00 00<br>
      Zone Industrielle, Pointe-Noire — République du Congo
    </p>
  </div>

</body>
</html>`;

fs.writeFileSync(OUTPUT_HTML, htmlContent, 'utf-8');
console.log('Fichier HTML généré :', OUTPUT_HTML);

async function convertHtmlToPdf() {
  console.log('Conversion en document PDF via moteur Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'load' });

  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '12mm',
      right: '12mm',
    },
  });

  await browser.close();
  console.log('✓ PDF officiel généré avec succès :', OUTPUT_PDF);
}

convertHtmlToPdf().catch((e) => {
  console.error('Erreur PDF:', e);
  process.exit(1);
});
