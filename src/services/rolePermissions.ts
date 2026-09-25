import { UserRole } from '../types';

export interface RoleConfig {
  role: UserRole;
  title: string;
  shortLabel: string;
  defaultUserName: string;
  department: string;
  allowedModules: string[];
  defaultModule: string;
  badgeColor: string;
  description: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  dg: {
    role: 'dg',
    title: 'Directeur Général (DG)',
    shortLabel: 'DG (Accès Global)',
    defaultUserName: 'Dr. Joseph Ndoundo',
    department: 'direction',
    allowedModules: [
      'dashboard',
      'ged',
      'scanner',
      'projects',
      'finances',
      'hr',
      'partners',
      'materials',
      'purchases',
      'reports',
      'maintenance',
      'missions',
      'payroll',
      'accounting',
      'sites',
      'audit',
      'settings',
      'admin',
    ],
    defaultModule: 'dashboard',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    description: 'Accès intégral temps réel à l’ensemble des mouvements et tableaux de bord de l’entreprise.',
  },
  admin: {
    role: 'admin',
    title: 'Administrateur Système',
    shortLabel: 'Admin Système',
    defaultUserName: 'Administrateur CORESI',
    department: 'direction',
    allowedModules: [
      'dashboard',
      'ged',
      'scanner',
      'projects',
      'finances',
      'hr',
      'partners',
      'materials',
      'purchases',
      'reports',
      'maintenance',
      'missions',
      'payroll',
      'accounting',
      'sites',
      'audit',
      'settings',
      'admin',
    ],
    defaultModule: 'dashboard',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
    description: 'Administration technique, journal d’audit et paramétrage sécurité.',
  },
  comptable: {
    role: 'comptable',
    title: 'Comptabilité & Finance (RAF)',
    shortLabel: 'Comptabilité',
    defaultUserName: 'Clarisse Bantsimba',
    department: 'comptabilite',
    allowedModules: [
      'finances',
      'accounting',
      'purchases',
      'payroll',
      'missions',
      'partners',
      'ged',
      'scanner',
      'settings',
    ],
    defaultModule: 'finances',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    description: 'Accès réservé aux finances, factures, comptabilité SYSCOHADA, achats, paie et trésorerie.',
  },
  rh: {
    role: 'rh',
    title: 'Ressources Humaines (RH)',
    shortLabel: 'Ressources Humaines',
    defaultUserName: 'Awa Diallo',
    department: 'rh',
    allowedModules: ['hr', 'payroll', 'missions', 'ged', 'scanner', 'settings'],
    defaultModule: 'hr',
    badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    description: 'Accès réservé à la gestion du personnel, paie, ordres de mission, congés et qualifications.',
  },
  chef_projet: {
    role: 'chef_projet',
    title: 'Responsable Projets & Chantiers',
    shortLabel: 'Chef de Projets',
    defaultUserName: 'Ing. Paul Kimbembe',
    department: 'ingenierie',
    allowedModules: [
      'projects',
      'sites',
      'reports',
      'maintenance',
      'purchases',
      'missions',
      'materials',
      'ged',
      'scanner',
      'settings',
    ],
    defaultModule: 'projects',
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
    description: 'Accès réservé au suivi des chantiers déportés, rapports & PV, GMAO, achats chantier et missions.',
  },
  magasinier: {
    role: 'magasinier',
    title: 'Gestionnaire Parc & Magasinier',
    shortLabel: 'Magasinier / Stocks',
    defaultUserName: 'Alexandre Makosso',
    department: 'chaudronnerie',
    allowedModules: [
      'materials',
      'maintenance',
      'purchases',
      'sites',
      'ged',
      'scanner',
      'settings',
    ],
    defaultModule: 'materials',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    description: 'Accès réservé aux stocks, réceptions de commandes, GMAO et transferts inter-sites.',
  },
  employe: {
    role: 'employe',
    title: 'Employé / Collaborateur',
    shortLabel: 'Employé',
    defaultUserName: 'Moussa Traoré',
    department: 'tuyauterie',
    allowedModules: ['hr', 'missions', 'ged', 'scanner', 'settings'],
    defaultModule: 'hr',
    badgeColor: 'bg-slate-900 text-slate-300 border-slate-700',
    description: 'Accès à sa propre fiche collaborateur, ses ordres de mission et documents personnels.',
  },
  invite: {
    role: 'invite',
    title: 'Visiteur / Invité',
    shortLabel: 'Invité',
    defaultUserName: 'Visiteur Externe',
    department: 'externe',
    allowedModules: ['hr', 'ged', 'settings'],
    defaultModule: 'hr',
    badgeColor: 'bg-slate-900 text-slate-300 border-slate-700',
    description: 'Accès restreint en consultation.',
  },
};

export function isModuleAllowedForRole(module: string, role: UserRole): boolean {
  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.invite;
  return config.allowedModules.includes(module);
}

export function getDefaultModuleForRole(role: UserRole): string {
  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.invite;
  return config.defaultModule;
}
