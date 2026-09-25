import {
  SystemModule,
  SystemFeature,
  WorkflowConfig,
  RolePermissions,
  NumberingRule,
  CompanySettings,
  NotificationSetting,
  SecuritySettings,
  GedSettings,
  ScannerOcrSettings,
  ProjectSettings,
  StockSettings,
  HrSettings,
  FinanceSettings,
} from '../types/admin';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { DataService } from './dataService';

const STORAGE_PREFIX = 'coresi_admin_';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage admin save error:', e);
  }
}

// 1. Initial 20 Modules Definition
export const INITIAL_MODULES: SystemModule[] = [
  {
    id: 'dashboard',
    name: 'Tableau de bord',
    category: 'core',
    description: 'Pilotage général DG, KPIs financiers, avancement global des chantiers et alertes temps réel.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: [],
    featuresCount: 4,
    activeFeaturesCount: 4,
    iconName: 'LayoutDashboard',
    isCore: true,
  },
  {
    id: 'projects',
    name: 'Chantiers & Projets',
    category: 'operations',
    description: 'Suivi des affaires industrielles (chaudronnerie, tuyauterie, génie civil), budgets, jalons et rapports.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: [],
    featuresCount: 9,
    activeFeaturesCount: 9,
    iconName: 'FolderKanban',
  },
  {
    id: 'finances',
    name: 'Finance & Facturation',
    category: 'finance',
    description: 'Enregistrement des dépenses de chantier, factures clients/fournisseurs, gestion de la caisse et trésorerie.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: [],
    featuresCount: 12,
    activeFeaturesCount: 12,
    iconName: 'DollarSign',
  },
  {
    id: 'ged',
    name: 'GED — Documents',
    category: 'core',
    description: 'Gestion Électronique des Documents, métadonnées Cloudinary, archivage et recherche plein-texte.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: [],
    featuresCount: 9,
    activeFeaturesCount: 9,
    iconName: 'FolderOpen',
  },
  {
    id: 'scanner',
    name: 'Scanner Mobile',
    category: 'core',
    description: 'Numérisation haute fidélité via caméra mobile, correction perspective et cadrage automatique.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: ['ged'],
    featuresCount: 6,
    activeFeaturesCount: 6,
    iconName: 'Camera',
  },
  {
    id: 'ocr',
    name: 'Moteur OCR & IA',
    category: 'core',
    description: 'Reconnaissance optique des caractères sur factures, bons de livraison et fiches techniques.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: ['ged', 'scanner'],
    featuresCount: 5,
    activeFeaturesCount: 5,
    iconName: 'Sparkles',
  },
  {
    id: 'hr',
    name: 'Personnel & RH',
    category: 'ressources',
    description: 'Fiches collaborateurs, contrats de travail, habilitations de sécurité (CACES, SST) et congés.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: [],
    featuresCount: 11,
    activeFeaturesCount: 11,
    iconName: 'Users',
  },
  {
    id: 'stock',
    name: 'Gestion des Stocks',
    category: 'operations',
    description: 'Inventaire des consommables, électrodes, tôles, tubes acier et bons de sortie chantier.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Alexandre Makosso (Magasinier)',
    dependencies: [],
    featuresCount: 10,
    activeFeaturesCount: 10,
    iconName: 'Package',
  },
  {
    id: 'materials',
    name: 'Parc Matériel & Outillage',
    category: 'operations',
    description: 'Suivi des postes à souder, compresseurs, groupes électrogènes, véhicules et maintenance.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Alexandre Makosso (Magasinier)',
    dependencies: [],
    featuresCount: 7,
    activeFeaturesCount: 7,
    iconName: 'Wrench',
  },
  {
    id: 'purchases',
    name: 'Achats & Commandes',
    category: 'finance',
    description: 'Demandes d\'achats, devis comparatifs fournisseurs, bons de commande et réceptions.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Marcelle Nguesso (Comptable)',
    dependencies: ['finances'],
    featuresCount: 6,
    activeFeaturesCount: 6,
    iconName: 'ShoppingBag',
  },
  {
    id: 'clients',
    name: 'Clients & Donneurs d\'ordre',
    category: 'operations',
    description: 'Répertoire des multinationales pétrolières, minières et BTP (TotalEnergies, Perenco, SNH...).',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: [],
    featuresCount: 4,
    activeFeaturesCount: 4,
    iconName: 'Building2',
  },
  {
    id: 'suppliers',
    name: 'Fournisseurs & Sous-traitants',
    category: 'operations',
    description: 'Catalogue des fournisseurs d\'aciers spéciaux, gaz industriels, boulonnerie et contrôles CND.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: [],
    featuresCount: 4,
    activeFeaturesCount: 4,
    iconName: 'Truck',
  },
  {
    id: 'reports',
    name: 'Rapports & PV Techniques',
    category: 'operations',
    description: 'Édition des procès-verbaux d\'épreuve hydraulique, rapports de ressuage et d\'avancement de travaux.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: ['projects', 'ged'],
    featuresCount: 5,
    activeFeaturesCount: 5,
    iconName: 'FileCheck2',
  },
  {
    id: 'notifications',
    name: 'Centre de Notifications',
    category: 'support',
    description: 'Système d\'alerte multi-canal (dépassements budgétaires, retards factures, expirations certifications).',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: [],
    featuresCount: 7,
    activeFeaturesCount: 7,
    iconName: 'Bell',
  },
  {
    id: 'audit',
    name: 'Journal d\'Audit & Traçabilité',
    category: 'support',
    description: 'Piste d\'audit immuable, journalisation de toutes les transactions et modifications de paramètres.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: [],
    featuresCount: 4,
    activeFeaturesCount: 4,
    iconName: 'ShieldAlert',
    isCore: true,
  },
  {
    id: 'maintenance',
    name: 'Maintenance & GMAO',
    category: 'operations',
    description: 'Calendrier des entretiens préventifs, contrôles réglementaires des engins de levage et outillages.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Alexandre Makosso (Magasinier)',
    dependencies: ['materials'],
    featuresCount: 5,
    activeFeaturesCount: 5,
    iconName: 'Cog',
  },
  {
    id: 'missions',
    name: 'Missions & Déplacements',
    category: 'ressources',
    description: 'Ordres de mission sur chantiers offshore / onshore, frais de déplacement et hébergement.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: ['hr', 'finances'],
    featuresCount: 4,
    activeFeaturesCount: 4,
    iconName: 'MapPin',
  },
  {
    id: 'payroll',
    name: 'Paie & Rémunération',
    category: 'ressources',
    description: 'Fiches de paie mensuelles, calcul des acomptes, primes d\'éloignement et cotisations CNSS.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Marcelle Nguesso (Comptable)',
    dependencies: ['hr', 'finances'],
    featuresCount: 5,
    activeFeaturesCount: 5,
    iconName: 'CreditCard',
  },
  {
    id: 'advanced_accounting',
    name: 'Comptabilité Avancée',
    category: 'finance',
    description: 'Rapprochement bancaire, grand livre analytique par chantier et clôture périodique de caisse.',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Marcelle Nguesso (Comptable)',
    dependencies: ['finances'],
    featuresCount: 6,
    activeFeaturesCount: 6,
    iconName: 'Calculator',
  },
  {
    id: 'multi_sites',
    name: 'Multi-Sites & Chantiers Déportés',
    category: 'operations',
    description: 'Gestion centralisée de multiples bases opérationnelles (Pointe-Noire, Brazzaville, Port-Gentil).',
    enabled: true,
    enabledAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-25T07:00:00Z',
    updatedBy: 'Dr. Joseph Ndoundo (DG)',
    dependencies: ['projects', 'stock'],
    featuresCount: 4,
    activeFeaturesCount: 4,
    iconName: 'Network',
  },
];

// 2. Initial Features Definition (categorized with 3-level options)
export const INITIAL_FEATURES: SystemFeature[] = [
  // FINANCE
  {
    id: 'feat_fin_expenses',
    moduleId: 'finances',
    category: 'Finance',
    name: 'Dépenses & Achats Chantier',
    description: 'Saisie et imputation des dépenses par chantier, fournisseur et moyen de règlement.',
    enabled: true,
    dependencies: ['finances'],
    options: [
      { id: 'opt_exp_receipt_req', name: 'Justificatif obligatoire', description: 'Exige une pièce jointe GED avant enregistrement', type: 'boolean', value: true },
      { id: 'opt_exp_max_cash', name: 'Plafond espèces', description: 'Montant max pour paiement en caisse (FCFA)', type: 'number', value: 250000 },
    ],
  },
  {
    id: 'feat_fin_invoicing',
    moduleId: 'finances',
    category: 'Finance',
    name: 'Facturation Clients & Fournisseurs',
    description: 'Gestion des créances, échéanciers, relances et enregistrement des factures fournisseurs.',
    enabled: true,
    dependencies: ['finances'],
    options: [
      { id: 'opt_inv_tva', name: 'Application TVA', description: 'Calcul automatique de la TVA (18%)', type: 'boolean', value: true },
      { id: 'opt_inv_partial', name: 'Paiements partiels', description: 'Autorise les règlements partiels et acomptes', type: 'boolean', value: true },
      { id: 'opt_inv_due_days', name: 'Échéance standard', description: 'Délai par défaut de paiement (jours)', type: 'number', value: 30 },
      { id: 'opt_inv_validation', name: 'Validation obligatoire', description: 'Visa préalable du DG avant émission', type: 'boolean', value: true },
    ],
  },
  {
    id: 'feat_fin_cashbox',
    moduleId: 'finances',
    category: 'Finance',
    name: 'Petite Caisse & Trésorerie',
    description: 'Mouvements d\'entrées/sorties d\'espèces et contrôle quotidien du solde disponible.',
    enabled: true,
    dependencies: ['finances'],
    options: [
      { id: 'opt_cash_limit', name: 'Plafond fond de caisse', description: 'Montant max en caisse (FCFA)', type: 'number', value: 2000000 },
      { id: 'opt_cash_daily_close', name: 'Clôture journalière', description: 'Verrouillage automatique chaque soir', type: 'boolean', value: true },
    ],
  },
  {
    id: 'feat_fin_advances',
    moduleId: 'finances',
    category: 'Finance',
    name: 'Avances sur Salaire & Acomptes',
    description: 'Gestion des demandes d\'acomptes du personnel et déductions sur bulletin.',
    enabled: true,
    dependencies: ['finances', 'hr'],
    options: [
      { id: 'opt_adv_max_pct', name: 'Plafond acompte (% salaire)', description: 'Limite autorisée par mois', type: 'number', value: 40 },
    ],
  },
  {
    id: 'feat_fin_losses',
    moduleId: 'finances',
    category: 'Finance',
    name: 'Pertes, Rebuts & Non-Conformités',
    description: 'Chiffrage financier des chutes d\'acier, pièces défectueuses et retouches de soudage.',
    enabled: true,
    dependencies: ['finances', 'projects'],
    options: [
      { id: 'opt_loss_alert_amount', name: 'Seuil alerte rebut', description: 'Déclenche une notification immédiate au DG', type: 'number', value: 500000 },
    ],
  },
  {
    id: 'feat_fin_reconciliation',
    moduleId: 'finances',
    category: 'Finance',
    name: 'Rapprochement Bancaire',
    description: 'Confrontation des extraits bancaires avec les écritures du journal de trésorerie.',
    enabled: true,
    dependencies: ['finances', 'advanced_accounting'],
    options: [],
  },
  {
    id: 'feat_fin_profitability',
    moduleId: 'finances',
    category: 'Finance',
    name: 'Rentabilité Réelle des Chantiers',
    description: 'Comparaison en temps réel Budget engagé vs Dépenses réelles vs Facturation encaissée.',
    enabled: true,
    dependencies: ['finances', 'projects'],
    options: [],
  },

  // GED
  {
    id: 'feat_ged_docs',
    moduleId: 'ged',
    category: 'GED',
    name: 'Gestion Électronique des Documents',
    description: 'Stockage cloud sécurisé, indexation multi-critères et téléchargement.',
    enabled: true,
    dependencies: ['ged'],
    options: [
      { id: 'opt_ged_versioning', name: 'Historique des versions', description: 'Garde les anciennes révisions de documents', type: 'boolean', value: true },
      { id: 'opt_ged_retention', name: 'Durée d\'archivage légal', description: 'Nombre d\'années de rétention', type: 'number', value: 10 },
    ],
  },
  {
    id: 'feat_ged_scanner',
    moduleId: 'ged',
    category: 'GED',
    name: 'Intégration Scanner Chantier',
    description: 'Pont direct entre la caméra mobile du technicien et le coffre-fort documentaire.',
    enabled: true,
    dependencies: ['ged', 'scanner'],
    options: [
      { id: 'opt_scan_multipage', name: 'Scan multipage', description: 'Permet d\'assembler plusieurs pages en 1 seul PDF', type: 'boolean', value: true },
    ],
  },
  {
    id: 'feat_ged_ocr',
    moduleId: 'ged',
    category: 'GED',
    name: 'Extraction Automatique OCR',
    description: 'Lecture automatique des montants, numéros de facture, dates et fournisseurs.',
    enabled: true,
    dependencies: ['ged', 'ocr'],
    options: [
      { id: 'opt_ocr_human_val', name: 'Validation humaine préalable', description: 'Exige confirmation avant imputation', type: 'boolean', value: true },
      { id: 'opt_ocr_lang', name: 'Langue de reconnaissance', description: 'Dictionnaire privilégié', type: 'select', value: 'fra', options: [{ label: 'Français', value: 'fra' }, { label: 'Français + Anglais', value: 'fra+eng' }] },
    ],
  },
  {
    id: 'feat_ged_signature',
    moduleId: 'ged',
    category: 'GED',
    name: 'Visa Électronique & Signature',
    description: 'Apposition d\'un tampon numérique de validation (Bon à Payer, Reçu conforme).',
    enabled: true,
    dependencies: ['ged'],
    options: [],
  },

  // PROJETS
  {
    id: 'feat_prj_budgets',
    moduleId: 'projects',
    category: 'Projets',
    name: 'Gestion Budgétaire & Alertes',
    description: 'Plafonds de dépenses par chantier et surveillance des dérives de coûts.',
    enabled: true,
    dependencies: ['projects'],
    options: [
      { id: 'opt_prj_alert_80', name: 'Alerte préventive 80%', description: 'Notifie le chef de projet dès 80% du budget atteint', type: 'boolean', value: true },
      { id: 'opt_prj_alert_95', name: 'Alerte critique 95%', description: 'Notifie le DG et bloque les achats non visés', type: 'boolean', value: true },
    ],
  },
  {
    id: 'feat_prj_personnel',
    moduleId: 'projects',
    category: 'Projets',
    name: 'Affectation du Personnel de Chantier',
    description: 'Attribution des soudeurs, tuyauteurs, chefs d\'équipe et suivi du pointage.',
    enabled: true,
    dependencies: ['projects', 'hr'],
    options: [],
  },
  {
    id: 'feat_prj_materials',
    moduleId: 'projects',
    category: 'Projets',
    name: 'Imputation du Matériel Mobilisé',
    description: 'Suivi de la localisation des engins et outillages affectés sur site.',
    enabled: true,
    dependencies: ['projects', 'materials'],
    options: [],
  },
  {
    id: 'feat_prj_photos',
    moduleId: 'projects',
    category: 'Projets',
    name: 'Journal Photographique des Travaux',
    description: 'Galerie d\'images avant/pendant/après travaux horodatée pour les clients.',
    enabled: true,
    dependencies: ['projects'],
    options: [],
  },

  // RH
  {
    id: 'feat_rh_employees',
    moduleId: 'hr',
    category: 'RH',
    name: 'Dossiers Collaborateurs & Contrats',
    description: 'Gestion des matricules, contrats CDI/CDD/Prestation et coordonnées d\'urgence.',
    enabled: true,
    dependencies: ['hr'],
    options: [],
  },
  {
    id: 'feat_rh_certifications',
    moduleId: 'hr',
    category: 'RH',
    name: 'Qualifications & Licences de Soudage',
    description: 'Suivi des homologations ASME IX, EN 287-1, CACES grue et habilitations SST.',
    enabled: true,
    dependencies: ['hr'],
    options: [
      { id: 'opt_cert_warning_days', name: 'Alerte avant expiration (jours)', description: 'Délai de notification préalable', type: 'number', value: 30 },
    ],
  },
  {
    id: 'feat_rh_leaves',
    moduleId: 'hr',
    category: 'RH',
    name: 'Congés & Absences',
    description: 'Demandes de congés payés, permissions exceptionnelles et arrêts maladie.',
    enabled: true,
    dependencies: ['hr'],
    options: [],
  },

  // STOCK
  {
    id: 'feat_stk_movements',
    moduleId: 'stock',
    category: 'Stock',
    name: 'Bons d\'Entrées & Sorties (BE / BS / BR)',
    description: 'Traçabilité des flux d\'outillage et matières entre la base et les chantiers.',
    enabled: true,
    dependencies: ['stock'],
    options: [
      { id: 'opt_stk_receipt_required', name: 'Bon d\'enlèvement émargé obligatoire', description: 'Signature du réceptionnaire requise', type: 'boolean', value: true },
    ],
  },
  {
    id: 'feat_stk_multisite',
    moduleId: 'stock',
    category: 'Stock',
    name: 'Multi-Entrepôts & Dépôts Déportés',
    description: 'Gestion simultanée du magasin central et des conteneurs-ateliers de chantier.',
    enabled: true,
    dependencies: ['stock', 'multi_sites'],
    options: [],
  },

  // ACHATS
  {
    id: 'feat_ach_orders',
    moduleId: 'purchases',
    category: 'Achats',
    name: 'Bons de Commande & Réception',
    description: 'Cycle complet de commande aux fournisseurs avec contrôle à réception.',
    enabled: true,
    dependencies: ['purchases'],
    options: [
      { id: 'opt_ach_approval_req', name: 'Approbation obligatoire', description: 'Visa du DG exigé avant transmission au fournisseur', type: 'boolean', value: true },
    ],
  },

  // NOTIFICATIONS
  {
    id: 'feat_notif_budget',
    moduleId: 'notifications',
    category: 'Notifications',
    name: 'Alertes Budgétaires Instantanées',
    description: 'Notification push et interne en cas de dépassement de budget.',
    enabled: true,
    dependencies: ['notifications'],
    options: [],
  },
  {
    id: 'feat_notif_certs',
    moduleId: 'notifications',
    category: 'Notifications',
    name: 'Alertes Expirations Qualifications',
    description: 'Rappels automatiques avant péremption d\'une licence de soudeur.',
    enabled: true,
    dependencies: ['notifications'],
    options: [],
  },
];

// 3. Initial Workflows
export const INITIAL_WORKFLOWS: WorkflowConfig[] = [
  {
    id: 'wf_expenses',
    name: 'Circuit de Validation des Dépenses de Chantier',
    type: 'expenses',
    description: 'Règles de validation par palier pour les achats de consommables et frais opérationnels.',
    enabled: true,
    levels: [
      {
        id: 'lvl_1',
        thresholdMin: 0,
        thresholdMax: 250000,
        validatorRole: 'chef_projet',
        validatorRoleTitle: 'Chef de Projet Chantier',
        requiredReceipt: true,
        requiresJustification: false,
        allowReject: true,
      },
      {
        id: 'lvl_2',
        thresholdMin: 250000,
        thresholdMax: 1500000,
        validatorRole: 'comptable',
        validatorRoleTitle: 'Responsable Comptable & Financier',
        requiredReceipt: true,
        requiresJustification: true,
        allowReject: true,
      },
      {
        id: 'lvl_3',
        thresholdMin: 1500000,
        thresholdMax: 999999999,
        validatorRole: 'dg',
        validatorRoleTitle: 'Direction Générale (DG)',
        requiredReceipt: true,
        requiresJustification: true,
        allowReject: true,
      },
    ],
    rejectReasons: [
      'Justificatif illisible ou non conforme',
      'Dépassement du budget alloué au chantier',
      'Erreur de désignation ou quantité injustifiée',
      'Facture sans mention légale',
      'Prestation non réceptionnée sur site',
    ],
  },
  {
    id: 'wf_purchases',
    name: 'Validation des Commandes Fournisseurs',
    type: 'purchases',
    description: 'Circuit d\'approbation des bons de commande matières et outillages lourds.',
    enabled: true,
    levels: [
      {
        id: 'lvl_ach_1',
        thresholdMin: 0,
        thresholdMax: 500000,
        validatorRole: 'comptable',
        validatorRoleTitle: 'Comptable Achats',
        requiredReceipt: false,
        requiresJustification: true,
        allowReject: true,
      },
      {
        id: 'lvl_ach_2',
        thresholdMin: 500000,
        thresholdMax: 999999999,
        validatorRole: 'dg',
        validatorRoleTitle: 'Direction Générale (DG)',
        requiredReceipt: true,
        requiresJustification: true,
        allowReject: true,
      },
    ],
    rejectReasons: [
      'Fournisseur non référencé ou sans agrément',
      'Devis concurrent plus avantageux requis (règle des 3 devis)',
      'Délais de livraison incompatibles avec le planning chantier',
    ],
  },
  {
    id: 'wf_invoices',
    name: 'Émission & Validation des Factures Clients',
    type: 'invoices',
    description: 'Contrôle avant envoi officiel de la facture au client final.',
    enabled: true,
    levels: [
      {
        id: 'lvl_inv_1',
        thresholdMin: 0,
        thresholdMax: 999999999,
        validatorRole: 'dg',
        validatorRoleTitle: 'Direction Générale (DG)',
        requiredReceipt: true,
        requiresJustification: true,
        allowReject: true,
      },
    ],
    rejectReasons: [
      'PV de réception contradictoire manquant',
      'Attachement de métré non validé par le client',
      'Coordonnées bancaires ou mentions légales erronées',
    ],
  },
];

// 4. Initial Roles & Permissions Matrix
export const INITIAL_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  dg: {
    roleId: 'dg',
    roleTitle: 'Directeur Général (DG)',
    modulePermissions: {
      dashboard: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      projects: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      finances: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      ged: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      scanner: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      hr: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      stock: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      materials: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      clients: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      suppliers: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      audit: { view: true, create: false, edit: false, validate: false, export: true, archive: false, delete: false },
      admin: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
    },
  },
  admin: {
    roleId: 'admin',
    roleTitle: 'Administrateur Système',
    modulePermissions: {
      dashboard: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      projects: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      finances: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      ged: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      scanner: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      hr: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      stock: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      materials: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      clients: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      suppliers: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
      audit: { view: true, create: false, edit: false, validate: false, export: true, archive: false, delete: false },
      admin: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: true },
    },
  },
  comptable: {
    roleId: 'comptable',
    roleTitle: 'Responsable Financier & Comptable',
    modulePermissions: {
      dashboard: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      projects: { view: true, create: false, edit: false, validate: false, export: true, archive: false, delete: false },
      finances: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: false },
      ged: { view: true, create: true, edit: true, validate: false, export: true, archive: false, delete: false },
      scanner: { view: true, create: true, edit: false, validate: false, export: false, archive: false, delete: false },
      hr: { view: true, create: false, edit: false, validate: false, export: true, archive: false, delete: false },
      stock: { view: true, create: false, edit: false, validate: false, export: true, archive: false, delete: false },
      materials: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      clients: { view: true, create: true, edit: true, validate: false, export: true, archive: false, delete: false },
      suppliers: { view: true, create: true, edit: true, validate: false, export: true, archive: false, delete: false },
      audit: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      admin: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
    },
  },
  chef_projet: {
    roleId: 'chef_projet',
    roleTitle: 'Ingénieur & Chef de Chantier',
    modulePermissions: {
      dashboard: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      projects: { view: true, create: true, edit: true, validate: false, export: true, archive: false, delete: false },
      finances: { view: true, create: true, edit: false, validate: false, export: false, archive: false, delete: false },
      ged: { view: true, create: true, edit: true, validate: false, export: true, archive: false, delete: false },
      scanner: { view: true, create: true, edit: false, validate: false, export: false, archive: false, delete: false },
      hr: { view: true, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      stock: { view: true, create: true, edit: false, validate: false, export: false, archive: false, delete: false },
      materials: { view: true, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      clients: { view: true, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      suppliers: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      audit: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      admin: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
    },
  },
  rh: {
    roleId: 'rh',
    roleTitle: 'Responsable Ressources Humaines',
    modulePermissions: {
      dashboard: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      projects: { view: true, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      finances: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      ged: { view: true, create: true, edit: true, validate: false, export: true, archive: false, delete: false },
      scanner: { view: true, create: true, edit: false, validate: false, export: false, archive: false, delete: false },
      hr: { view: true, create: true, edit: true, validate: true, export: true, archive: true, delete: false },
      stock: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      materials: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      clients: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      suppliers: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      audit: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      admin: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
    },
  },
  magasinier: {
    roleId: 'magasinier',
    roleTitle: 'Gestionnaire Magasin & Stocks',
    modulePermissions: {
      dashboard: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      projects: { view: true, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      finances: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      ged: { view: true, create: true, edit: false, validate: false, export: false, archive: false, delete: false },
      scanner: { view: true, create: true, edit: false, validate: false, export: false, archive: false, delete: false },
      hr: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      stock: { view: true, create: true, edit: true, validate: true, export: true, archive: false, delete: false },
      materials: { view: true, create: true, edit: true, validate: true, export: true, archive: false, delete: false },
      clients: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      suppliers: { view: true, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      audit: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
      admin: { view: false, create: false, edit: false, validate: false, export: false, archive: false, delete: false },
    },
  },
};

// 5. Initial Numbering Rules
export const INITIAL_NUMBERING_RULES: NumberingRule[] = [
  { id: 'num_proj', entityName: 'Projets & Chantiers', prefix: 'PROJ', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 18, samplePreview: 'PROJ-2026-0018', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_fac', entityName: 'Factures Clients', prefix: 'FAC', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 42, samplePreview: 'FAC-2026-0042', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_dep', entityName: 'Dépenses Directes', prefix: 'DEP', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 89, samplePreview: 'DEP-2026-0089', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_da', entityName: 'Demandes d\'Achat', prefix: 'DA', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 14, samplePreview: 'DA-2026-0014', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_bc', entityName: 'Bons de Commande', prefix: 'BC', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 25, samplePreview: 'BC-2026-0025', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_rec', entityName: 'Bons de Réception', prefix: 'REC', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 19, samplePreview: 'REC-2026-0019', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_rpt', entityName: 'Rapports Techniques', prefix: 'RPT', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 8, samplePreview: 'RPT-2026-0008', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_pv', entityName: 'Procès-Verbaux (PV)', prefix: 'PV', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 12, samplePreview: 'PV-2026-0012', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_ot', entityName: 'Ordres de Travail (GMAO)', prefix: 'OT', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 7, samplePreview: 'OT-2026-0007', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_mis', entityName: 'Ordres de Mission', prefix: 'MIS', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 5, samplePreview: 'MIS-2026-0005', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_pay', entityName: 'Périodes de Paie', prefix: 'PAY', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 9, samplePreview: 'PAY-2026-0009', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_jnl', entityName: 'Écritures Comptables', prefix: 'JNL', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 48, samplePreview: 'JNL-2026-0048', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_site', entityName: 'Sites & Chantiers', prefix: 'SITE', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 4, samplePreview: 'SITE-2026-0004', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_bl', entityName: 'Bons de Livraison', prefix: 'BL', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 37, samplePreview: 'BL-2026-0037', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_doc', entityName: 'Documents GED', prefix: 'DOC', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 154, samplePreview: 'DOC-2026-0154', resetAnnually: true, lastResetYear: 2026 },
  { id: 'num_emp', entityName: 'Matricules Personnel', prefix: 'EMP', includeYear: true, includeMonth: false, digitPadding: 4, currentCounter: 63, samplePreview: 'EMP-2026-0063', resetAnnually: false, lastResetYear: 2026 },
];

// 6. Initial Company Profile
export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  name: 'CORESI INTERNATIONAL SARL',
  shortName: 'CORESI',
  legalForm: 'Société à Responsabilité Limitée (SARL)',
  registrationNumber: 'RCCM: CG-PNR-01-2018-B12-00452',
  taxId: 'NIF: 028471930219482',
  address: 'Zone Industrielle de Mongo Kamba, Route de l\'Aéroport',
  city: 'Pointe-Noire',
  country: 'République du Congo',
  phone: '+242 06 600 00 00 / +242 05 500 00 00',
  email: 'contact@coresi-international.com',
  website: 'https://www.coresi-international.com',
  currency: 'FCFA',
  currencySymbol: 'FCFA',
  timezone: 'Africa/Brazzaville (GMT+1)',
  dateFormat: 'DD/MM/YYYY',
  fiscalYearStart: '01/01',
};

// 7. Initial Security Settings
export const INITIAL_SECURITY_SETTINGS: SecuritySettings = {
  sessionDurationMinutes: 480,
  autoLogoutOnIdle: true,
  idleTimeoutMinutes: 30,
  maxFailedLogins: 5,
  requireMfa: false,
  passwordMinLength: 8,
  auditTrailRetentionDays: 365,
  lockedSections: [],
};

// 8. Initial Notifications Settings
export const INITIAL_NOTIFICATIONS_SETTINGS: NotificationSetting[] = [
  { id: 'notif_budget', event: 'Dépassement du seuil budgétaire (80% ou 95%)', description: 'Chantier dont les dépenses approchent du plafond alloué', enabled: true, channels: { internal: true, email: true, push: true }, priority: 'critical', recipientsRole: ['dg', 'chef_projet', 'comptable'], delayMinutes: 0 },
  { id: 'notif_invoice_overdue', event: 'Facture client échue non réglée', description: 'Créance dépassant la date limite convenue', enabled: true, channels: { internal: true, email: true, push: false }, priority: 'high', recipientsRole: ['dg', 'comptable'], delayMinutes: 0 },
  { id: 'notif_cert_expire', event: 'Qualification soudeur expirant sous 30 jours', description: 'Licence technique ASME/CND nécessitant renouvellement', enabled: true, channels: { internal: true, email: true, push: false }, priority: 'medium', recipientsRole: ['dg', 'rh'], delayMinutes: 0 },
  { id: 'notif_stock_min', event: 'Alerte stock minimum sur consommable critique', description: 'Électrodes, disques ou gaz atteignant le seuil d\'alerte', enabled: true, channels: { internal: true, email: false, push: true }, priority: 'medium', recipientsRole: ['magasinier', 'comptable'], delayMinutes: 0 },
  { id: 'notif_expense_pending', event: 'Nouvelle dépense en attente d\'approbation', description: 'Soumission d\'un achat chantier supérieur au seuil', enabled: true, channels: { internal: true, email: true, push: true }, priority: 'high', recipientsRole: ['dg', 'comptable'], delayMinutes: 0 },
];

export class AdminConfigService {
  // Modules
  public static getModules(): SystemModule[] {
    return getLocal<SystemModule[]>('modules', INITIAL_MODULES);
  }

  public static isModuleEnabled(moduleId: string): boolean {
    const modules = this.getModules();
    const mod = modules.find((m) => m.id === moduleId);
    return mod ? mod.enabled : false;
  }

  public static async setModuleStatus(moduleId: string, enabled: boolean, reason?: string): Promise<{ success: boolean; message: string; impactedDependencies?: string[] }> {
    const modules = this.getModules();
    const target = modules.find((m) => m.id === moduleId);
    if (!target) return { success: false, message: 'Module introuvable' };

    // Prevent disabling core modules without super-admin permission
    if (!enabled && target.isCore && DataService.getCurrentUser().role !== 'dg') {
      return { success: false, message: 'Seul le Directeur Général peut modifier l\'état d\'un module système fondamental.' };
    }

    // Check if other active modules depend on this one
    if (!enabled) {
      const dependents = modules.filter((m) => m.enabled && m.dependencies.includes(moduleId));
      if (dependents.length > 0) {
        // Cascade disable or warn
        dependents.forEach((dep) => {
          dep.enabled = false;
          dep.updatedAt = new Date().toISOString();
          dep.updatedBy = DataService.getCurrentUser().displayName;
        });
      }
    }

    // If enabling, verify dependencies are satisfied or auto-enable them
    if (enabled && target.dependencies.length > 0) {
      target.dependencies.forEach((depId) => {
        const parentMod = modules.find((m) => m.id === depId);
        if (parentMod && !parentMod.enabled) {
          parentMod.enabled = true;
          parentMod.updatedAt = new Date().toISOString();
          parentMod.updatedBy = DataService.getCurrentUser().displayName;
        }
      });
    }

    const prevVal = target.enabled ? 'ON' : 'OFF';
    target.enabled = enabled;
    target.updatedAt = new Date().toISOString();
    target.updatedBy = DataService.getCurrentUser().displayName;

    setLocal('modules', modules);

    // Audit Log
    DataService.logAudit(
      'admin_module_toggle',
      'system_module',
      moduleId,
      `Changement d'état du module ${target.name} : ${prevVal} → ${enabled ? 'ON' : 'OFF'}. ${reason ? `Motif: ${reason}` : ''}`
    );

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'settings', 'modules'), { list: modules, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('Firestore sync notice for modules:', e);
    }

    return { success: true, message: `Module ${target.name} mis à jour avec succès.` };
  }

  // Features
  public static getFeatures(): SystemFeature[] {
    return getLocal<SystemFeature[]>('features', INITIAL_FEATURES);
  }

  public static isFeatureEnabled(featureId: string): boolean {
    const features = this.getFeatures();
    const feat = features.find((f) => f.id === featureId);
    if (!feat) return false;
    // Feature is only active if its parent module is also active!
    const isParentModuleActive = this.isModuleEnabled(feat.moduleId);
    return isParentModuleActive && feat.enabled;
  }

  public static async setFeatureStatus(featureId: string, enabled: boolean): Promise<boolean> {
    const features = this.getFeatures();
    const feat = features.find((f) => f.id === featureId);
    if (!feat) return false;

    const prev = feat.enabled ? 'ON' : 'OFF';
    feat.enabled = enabled;
    setLocal('features', features);

    // Update active count on parent module
    const modules = this.getModules();
    const parentMod = modules.find((m) => m.id === feat.moduleId);
    if (parentMod) {
      parentMod.activeFeaturesCount = features.filter((f) => f.moduleId === parentMod.id && f.enabled).length;
      setLocal('modules', modules);
    }

    DataService.logAudit(
      'admin_feature_toggle',
      'system_feature',
      featureId,
      `Fonctionnalité ${feat.name} (${feat.category}) : ${prev} → ${enabled ? 'ON' : 'OFF'}`
    );

    try {
      await setDoc(doc(db, 'settings', 'features'), { list: features, updatedAt: new Date().toISOString() });
    } catch {}

    return true;
  }

  public static async updateFeatureOption(featureId: string, optionId: string, newValue: any): Promise<void> {
    const features = this.getFeatures();
    const feat = features.find((f) => f.id === featureId);
    if (!feat) return;

    const opt = feat.options.find((o) => o.id === optionId);
    if (!opt) return;

    const oldVal = opt.value;
    opt.value = newValue;
    setLocal('features', features);

    DataService.logAudit(
      'admin_feature_option_update',
      'system_feature_option',
      `${featureId}/${optionId}`,
      `Option "${opt.name}" modifiée : ${JSON.stringify(oldVal)} → ${JSON.stringify(newValue)}`
    );
  }

  // Workflows
  public static getWorkflows(): WorkflowConfig[] {
    return getLocal<WorkflowConfig[]>('workflows', INITIAL_WORKFLOWS);
  }

  public static async saveWorkflow(wf: WorkflowConfig): Promise<void> {
    const list = this.getWorkflows();
    const idx = list.findIndex((w) => w.id === wf.id);
    if (idx >= 0) {
      list[idx] = wf;
    } else {
      list.push(wf);
    }
    setLocal('workflows', list);
    DataService.logAudit('admin_workflow_saved', 'workflow', wf.id, `Mise à jour du workflow de validation : ${wf.name}`);

    try {
      await setDoc(doc(db, 'settings', 'workflows'), { list, updatedAt: new Date().toISOString() });
    } catch {}
  }

  // Role Permissions
  public static getRolePermissions(): Record<string, RolePermissions> {
    return getLocal<Record<string, RolePermissions>>('role_permissions', INITIAL_ROLE_PERMISSIONS);
  }

  public static async updateRolePermission(
    roleId: string,
    moduleId: string,
    action: 'view' | 'create' | 'edit' | 'validate' | 'export' | 'archive' | 'delete',
    allowed: boolean
  ): Promise<void> {
    const permissions = this.getRolePermissions();
    if (!permissions[roleId]) {
      permissions[roleId] = {
        roleId,
        roleTitle: roleId.toUpperCase(),
        modulePermissions: {},
      };
    }
    if (!permissions[roleId].modulePermissions[moduleId]) {
      permissions[roleId].modulePermissions[moduleId] = {
        view: false,
        create: false,
        edit: false,
        validate: false,
        export: false,
        archive: false,
        delete: false,
      };
    }

    permissions[roleId].modulePermissions[moduleId][action] = allowed;
    setLocal('role_permissions', permissions);

    DataService.logAudit(
      'admin_permission_change',
      'role_permission',
      `${roleId}:${moduleId}:${action}`,
      `Rôle ${roleId.toUpperCase()} - Module ${moduleId} : action "${action.toUpperCase()}" fixée à ${allowed ? 'AUTORISÉE' : 'REFUSÉE'}`
    );

    try {
      await setDoc(doc(db, 'roles', roleId), permissions[roleId]);
    } catch {}
  }

  // Numbering
  public static getNumberingRules(): NumberingRule[] {
    return getLocal<NumberingRule[]>('numbering_rules', INITIAL_NUMBERING_RULES);
  }

  public static async saveNumberingRule(rule: NumberingRule): Promise<void> {
    const rules = this.getNumberingRules();
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      rules[idx] = rule;
    } else {
      rules.push(rule);
    }
    setLocal('numbering_rules', rules);
    DataService.logAudit('admin_numbering_saved', 'numbering', rule.id, `Format de numérotation mis à jour pour ${rule.entityName} (Exemple: ${rule.samplePreview})`);

    try {
      await setDoc(doc(db, 'settings', 'numbering'), { list: rules, updatedAt: new Date().toISOString() });
    } catch {}
  }

  public static getNextSequenceNumber(entityRuleId: string): string {
    const rules = this.getNumberingRules();
    const query = entityRuleId.toLowerCase();
    const rule = rules.find(
      (r) =>
        r.id.toLowerCase() === query ||
        r.id.toLowerCase() === `num_${query}` ||
        r.prefix.toLowerCase() === query
    );
    if (!rule) {
      const year = new Date().getFullYear();
      return `${entityRuleId.toUpperCase()}-${year}-0001`;
    }

    rule.currentCounter += 1;
    setLocal('numbering_rules', rules);

    const yearStr = rule.includeYear ? `${new Date().getFullYear()}-` : '';
    const counterStr = String(rule.currentCounter).padStart(rule.digitPadding, '0');
    return `${rule.prefix}-${yearStr}${counterStr}`;
  }

  // Company Settings
  public static getCompanySettings(): CompanySettings {
    return getLocal<CompanySettings>('company_settings', INITIAL_COMPANY_SETTINGS);
  }

  public static async saveCompanySettings(settings: CompanySettings): Promise<void> {
    setLocal('company_settings', settings);
    DataService.logAudit('admin_company_saved', 'company_settings', 'main', `Mise à jour des coordonnées et raison sociale de l'entreprise : ${settings.name}`);
    try {
      await setDoc(doc(db, 'settings', 'company'), { ...settings, updatedAt: new Date().toISOString() });
    } catch {}
  }

  // Security Settings
  public static getSecuritySettings(): SecuritySettings {
    return getLocal<SecuritySettings>('security_settings', INITIAL_SECURITY_SETTINGS);
  }

  public static async saveSecuritySettings(settings: SecuritySettings): Promise<void> {
    setLocal('security_settings', settings);
    DataService.logAudit('admin_security_saved', 'security_settings', 'main', `Politique de sécurité et délais d'inactivité modifiés (Session: ${settings.sessionDurationMinutes}m)`);
    try {
      await setDoc(doc(db, 'settings', 'security'), { ...settings, updatedAt: new Date().toISOString() });
    } catch {}
  }

  public static isSectionLocked(sectionId: string): boolean {
    const sec = this.getSecuritySettings();
    return sec.lockedSections.includes(sectionId);
  }

  public static async toggleSectionLock(sectionId: string, locked: boolean): Promise<void> {
    const sec = this.getSecuritySettings();
    if (locked && !sec.lockedSections.includes(sectionId)) {
      sec.lockedSections.push(sectionId);
    } else if (!locked) {
      sec.lockedSections = sec.lockedSections.filter((s) => s !== sectionId);
    }
    await this.saveSecuritySettings(sec);
  }

  // Notifications Settings
  public static getNotificationSettings(): NotificationSetting[] {
    return getLocal<NotificationSetting[]>('notification_settings', INITIAL_NOTIFICATIONS_SETTINGS);
  }

  public static async saveNotificationSettings(settings: NotificationSetting[]): Promise<void> {
    setLocal('notification_settings', settings);
    DataService.logAudit('admin_notifications_saved', 'notification_settings', 'main', `Matrice des canaux et délais d'alertes mise à jour.`);
    try {
      await setDoc(doc(db, 'settings', 'notifications'), { list: settings, updatedAt: new Date().toISOString() });
    } catch {}
  }

  // Reset complete configuration to factory defaults
  public static resetToFactoryDefaults(): void {
    setLocal('modules', INITIAL_MODULES);
    setLocal('features', INITIAL_FEATURES);
    setLocal('workflows', INITIAL_WORKFLOWS);
    setLocal('role_permissions', INITIAL_ROLE_PERMISSIONS);
    setLocal('numbering_rules', INITIAL_NUMBERING_RULES);
    setLocal('company_settings', INITIAL_COMPANY_SETTINGS);
    setLocal('security_settings', INITIAL_SECURITY_SETTINGS);
    setLocal('notification_settings', INITIAL_NOTIFICATIONS_SETTINGS);

    DataService.logAudit('admin_factory_reset', 'system', 'all', 'RÉINITIALISATION GLOBALE : Retour aux paramètres d\'usine de CORESI ERP.');
  }

  // Check if current user is authorized to access Administration
  public static isAuthorizedAdmin(): boolean {
    const user = DataService.getCurrentUser();
    return user.role === 'dg' || user.role === 'admin';
  }
}
