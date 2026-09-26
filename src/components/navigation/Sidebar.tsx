import React from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Camera,
  FolderKanban,
  DollarSign,
  Users,
  Building2,
  Wrench,
  ShieldAlert,
  Settings,
  Shield,
  Lock,
  Layers,
  ShoppingCart,
  ClipboardList,
  Compass,
  Banknote,
  BookOpen,
  MapPin,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { ROLE_CONFIGS, isModuleAllowedForRole } from '../../services/rolePermissions';
import { AdminConfigService } from '../../services/adminConfigService';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  currentModule: string;
  currentUser: UserProfile;
  onNavigate: (module: string) => void;
  documentsCount: number;
  activeProjectsCount: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  currentUser,
  onNavigate,
  documentsCount,
  activeProjectsCount,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const roleConfig = ROLE_CONFIGS[currentUser.role] || ROLE_CONFIGS.invite;
  const { theme, toggleTheme } = useTheme();

  const allMenuItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      subtext: 'Direction Générale (DG)',
      icon: LayoutDashboard,
    },
    {
      id: 'ged',
      label: 'GED — Documents',
      subtext: 'Archives & OCR',
      icon: FolderOpen,
      badge: documentsCount,
      badgeClass: 'bg-[--coresi-primary-50] text-[--coresi-primary-dark] border-[--coresi-primary-200] dark:bg-[--coresi-primary-950] dark:text-[--coresi-primary-light] dark:border-[--coresi-primary-900]',
    },
    {
      id: 'projects',
      label: 'Chantiers & Projets',
      subtext: 'Tuyauterie & BTP',
      icon: FolderKanban,
      badge: activeProjectsCount,
      badgeClass: 'bg-[--coresi-info-light] text-[--coresi-info-dark] border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    },
    {
      id: 'sites',
      label: 'Multi-Sites & Chantiers',
      subtext: 'Bases & Transferts',
      icon: MapPin,
    },
    {
      id: 'purchases',
      label: 'Achats & Commandes',
      subtext: 'DA & Fournisseurs',
      icon: ShoppingCart,
    },
    {
      id: 'reports',
      label: 'Rapports & PV Techniques',
      subtext: 'Épreuves & Chantiers',
      icon: ClipboardList,
    },
    {
      id: 'finances',
      label: 'Finances & Factures',
      subtext: 'Dépenses & Caisse',
      icon: DollarSign,
    },
    {
      id: 'accounting',
      label: 'Comptabilité Avancée',
      subtext: 'SYSCOHADA & Grand Livre',
      icon: BookOpen,
    },
    {
      id: 'payroll',
      label: 'Paie & Rémunérations',
      subtext: 'Bulletins & CNSS',
      icon: Banknote,
    },
    {
      id: 'missions',
      label: 'Missions & Déplacements',
      subtext: 'Ordres & Frais',
      icon: Compass,
    },
    {
      id: 'maintenance',
      label: 'Maintenance & GMAO',
      subtext: 'Équipements & Pannes',
      icon: Wrench,
    },
    {
      id: 'hr',
      label: 'Personnel & RH',
      subtext: 'Équipes & Contrats',
      icon: Users,
    },
    {
      id: 'partners',
      label: 'Clients & Fournisseurs',
      subtext: 'Donneurs d\'ordre & Tiers',
      icon: Building2,
    },
    {
      id: 'materials',
      label: 'Parc Matériel & Stocks',
      subtext: 'Outillage & Dépôts',
      icon: Layers,
    },
    {
      id: 'audit',
      label: 'Journal d\'Audit',
      subtext: 'Traçabilité & Accès',
      icon: ShieldAlert,
    },
    {
      id: 'admin',
      label: 'Administration',
      subtext: 'Configuration Système',
      icon: Settings,
    },
    {
      id: 'settings',
      label: 'Paramètres Rapides',
      subtext: 'Profil & Cloudinary',
      icon: Settings,
    },
  ];

  // Filter items based on role permissions AND active module configuration
  const visibleMenuItems = allMenuItems.filter((item) => {
    if (!isModuleAllowedForRole(item.id, currentUser.role)) return false;
    // Real system deactivation: if module is toggled OFF in AdminConfigService, hide it completely
    if (item.id !== 'admin' && item.id !== 'settings' && item.id !== 'dashboard') {
      if (!AdminConfigService.isModuleEnabled(item.id)) {
        return false;
      }
    }
    return true;
  });

  const renderNavigationItems = (isMobile: boolean = false) => (
    <>
      <div className="space-y-2">
        {/* Role Scope Header */}
        <div className="px-3.5 py-3 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Espace Métier
            </span>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800">
              {currentUser.role}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1">{roleConfig.title}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{roleConfig.description}</p>
        </div>

        <div className="px-3 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Onglets autorisés ({visibleMenuItems.length})
        </div>

        <div className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (isMobile && onCloseMobile) {
                    onCloseMobile();
                  }
                }}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-300/80 dark:border-cyan-700/80 text-cyan-950 dark:text-cyan-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900 border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="sidebar-active-bar" />
                )}
                <div className="flex items-center gap-3">
                  <span
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-xs shadow-cyan-600/30'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:group-hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <div>
                    <p className={`text-xs leading-tight ${isActive ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                      {item.label}
                    </p>
                    <p className={`text-[10px] leading-tight ${isActive ? 'text-cyan-700 dark:text-cyan-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>{item.subtext}</p>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${item.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Security & Access enforcement badge */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 text-[11px] text-emerald-900 dark:text-emerald-300 space-y-1 mt-4">
        <p className="font-semibold flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Contrôle RBAC Actif</span>
        </p>
        <p className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80">
          Seul le DG a accès à tous les onglets en temps réel. Cloisonnement strict des données.
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between p-3 shrink-0 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex transition-colors">
        {renderNavigationItems(false)}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="animate-slide-in-left relative w-72 max-w-[85vw] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 z-10 shadow-2xl h-full overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-[1.5px] flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-md flex items-center justify-center">
                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-amber-300 text-[8px] tracking-wider">COR</span>
                  </div>
                </div>
                <span className="font-bold text-sm text-slate-900 dark:text-white">Navigation</span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Theme toggle in mobile drawer */}
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                  title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                >
                  {theme === 'dark'
                    ? <Sun className="w-4 h-4 text-amber-400" />
                    : <Moon className="w-4 h-4 text-indigo-500" />
                  }
                </button>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-95 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderNavigationItems(true)}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
