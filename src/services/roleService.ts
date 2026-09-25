import { UserProfile, UserRole } from '../types';

export interface PredefinedProfile {
  id: string;
  user: UserProfile;
  roleDescription: string;
  allowedModules: string[];
  color: string;
  badge: string;
  iconName: string;
}

export const PREDEFINED_PROFILES: PredefinedProfile[] = [
  {
    id: 'profile-dg',
    user: {
      uid: 'emp-001',
      email: 'j.ndoundo@coresi-international.com',
      displayName: 'Dr. Joseph Ndoundo',
      role: 'dg',
      department: 'Direction Générale',
    },
    roleDescription: 'Vision globale 360°, validation des dépenses et accès temps réel à tous les mouvements.',
    allowedModules: ['dashboard', 'ged', 'projects', 'finances', 'hr', 'partners', 'materials', 'audit', 'settings'],
    color: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-950 text-amber-300 border-amber-800',
    iconName: 'Crown',
  },
  {
    id: 'profile-comptable',
    user: {
      uid: 'emp-004',
      email: 'c.bantsimba@coresi-international.com',
      displayName: 'Clarisse Bantsimba',
      role: 'comptable',
      department: 'Comptabilité & Finances',
    },
    roleDescription: 'Gestion des finances, factures clients/fournisseurs, caisse espèces, banques et dépenses.',
    allowedModules: ['finances', 'ged', 'partners', 'projects', 'settings'],
    color: 'from-emerald-600 to-teal-600',
    badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    iconName: 'DollarSign',
  },
  {
    id: 'profile-rh',
    user: {
      uid: 'emp-rh-01',
      email: 'rh@coresi-international.com',
      displayName: 'Béatrice Malonga',
      role: 'rh',
      department: 'Ressources Humaines',
    },
    roleDescription: 'Dossiers du personnel, contrats, salaires, qualifications soudeurs, congés et archivage.',
    allowedModules: ['hr', 'ged', 'settings'],
    color: 'from-indigo-600 to-purple-600',
    badge: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    iconName: 'Users',
  },
  {
    id: 'profile-chef-projet',
    user: {
      uid: 'emp-002',
      email: 'p.kimbembe@coresi-international.com',
      displayName: 'Ing. Paul Kimbembe',
      role: 'chef_projet',
      department: 'Ingénierie & Projets',
    },
    roleDescription: 'Supervision des chantiers (Tuyauterie HP Djeno), rapports d\'avancement, photos et dépenses associées.',
    allowedModules: ['projects', 'ged', 'materials', 'settings'],
    color: 'from-blue-600 to-cyan-600',
    badge: 'bg-blue-950 text-blue-300 border-blue-800',
    iconName: 'FolderKanban',
  },
  {
    id: 'profile-magasinier',
    user: {
      uid: 'emp-003',
      email: 'a.makosso@coresi-international.com',
      displayName: 'Alexandre Makosso',
      role: 'magasinier',
      department: 'Logistique & Magasin Base',
    },
    roleDescription: 'Parc outillage, suivi des stocks, émission des bons de sortie (BS/BE) et maintenance du matériel.',
    allowedModules: ['materials', 'ged', 'settings'],
    color: 'from-yellow-600 to-amber-600',
    badge: 'bg-amber-950 text-amber-300 border-amber-800',
    iconName: 'Wrench',
  },
  {
    id: 'profile-employe',
    user: {
      uid: 'emp-005',
      email: 'm.traore@coresi-international.com',
      displayName: 'Moussa Traoré',
      role: 'employe',
      department: 'Tuyauterie Industrielle',
    },
    roleDescription: 'Accès limité à ses propres informations (contrat, certifications ASME, missions, avances).',
    allowedModules: ['my_space', 'ged', 'settings'],
    color: 'from-slate-600 to-slate-700',
    badge: 'bg-slate-850 text-slate-300 border-slate-700',
    iconName: 'UserCheck',
  },
];

export class RoleService {
  public static canAccessModule(role: UserRole, moduleId: string): boolean {
    if (role === 'admin' || role === 'dg') {
      return true; // DG has 100% full real-time access
    }

    const profile = PREDEFINED_PROFILES.find((p) => p.user.role === role);
    if (!profile) return false;

    // Direct match
    if (profile.allowedModules.includes(moduleId)) return true;

    // Special mappings
    if (moduleId === 'scanner') return true; // Everyone can use scanner to submit receipts/docs

    return false;
  }

  public static canViewSalaries(role: UserRole): boolean {
    return role === 'admin' || role === 'dg' || role === 'rh';
  }

  public static canApproveExpenses(role: UserRole): boolean {
    return role === 'admin' || role === 'dg';
  }

  public static canManageFinance(role: UserRole): boolean {
    return role === 'admin' || role === 'dg' || role === 'comptable';
  }

  public static canManageEmployees(role: UserRole): boolean {
    return role === 'admin' || role === 'dg' || role === 'rh';
  }

  public static canManageMaterials(role: UserRole): boolean {
    return role === 'admin' || role === 'dg' || role === 'magasinier' || role === 'chef_projet';
  }

  public static canViewAuditLogs(role: UserRole): boolean {
    return role === 'admin' || role === 'dg';
  }

  public static getDefaultModuleForRole(role: UserRole): string {
    switch (role) {
      case 'dg':
      case 'admin':
        return 'dashboard';
      case 'comptable':
        return 'finances';
      case 'rh':
        return 'hr';
      case 'chef_projet':
        return 'projects';
      case 'magasinier':
        return 'materials';
      case 'employe':
        return 'my_space';
      default:
        return 'ged';
    }
  }

  public static getRoleLabel(role: UserRole): string {
    switch (role) {
      case 'dg':
        return 'Direction Générale (DG)';
      case 'comptable':
        return 'Comptabilité & Finance';
      case 'rh':
        return 'Ressources Humaines';
      case 'chef_projet':
        return 'Responsable de Projet';
      case 'magasinier':
        return 'Magasinier / Stocks';
      case 'employe':
        return 'Employé Collaborateur';
      case 'admin':
        return 'Administrateur Système';
      default:
        return 'Invité';
    }
  }
}
