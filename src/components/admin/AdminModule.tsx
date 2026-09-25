import React, { useState, useMemo } from 'react';
import {
  Settings,
  Layers,
  Sliders,
  GitBranch,
  ShieldCheck,
  DollarSign,
  FolderOpen,
  Camera,
  FolderKanban,
  Package,
  Users,
  Bell,
  Hash,
  Lock,
  Unlock,
  Building2,
  Server,
  History,
  AlertTriangle,
  CheckCircle2,
  Search,
  RefreshCw,
  Power,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
  Check,
  X,
  FileText,
  Clock,
  ChevronRight,
  TrendingUp,
  Download,
} from 'lucide-react';
import {
  AdminConfigService,
  INITIAL_MODULES,
  INITIAL_FEATURES,
  INITIAL_WORKFLOWS,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_NUMBERING_RULES,
  INITIAL_COMPANY_SETTINGS,
  INITIAL_SECURITY_SETTINGS,
  INITIAL_NOTIFICATIONS_SETTINGS,
} from '../../services/adminConfigService';
import { SpecializedSettings } from './SpecializedSettings';
import {
  SystemModule,
  SystemFeature,
  WorkflowConfig,
  RolePermissions,
  NumberingRule,
  CompanySettings,
  NotificationSetting,
  SecuritySettings,
} from '../../types/admin';
import { DataService } from '../../services/dataService';
import { auth, firebaseConfig } from '../../firebase';
import { UserManagementView } from './UserManagementView';
import { SystemHealthView } from './SystemHealthView';

interface AdminModuleProps {
  onModuleStateChange?: () => void;
}

export type AdminTab =
  | 'overview'
  | 'users'
  | 'modules'
  | 'features'
  | 'workflows'
  | 'roles'
  | 'finance'
  | 'ged'
  | 'scanner_ocr'
  | 'projects'
  | 'stock'
  | 'hr'
  | 'notifications'
  | 'numbering'
  | 'security'
  | 'company'
  | 'system'
  | 'audit';

export const AdminModule: React.FC<AdminModuleProps> = ({ onModuleStateChange }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // States loaded from AdminConfigService
  const [modules, setModules] = useState<SystemModule[]>(AdminConfigService.getModules());
  const [features, setFeatures] = useState<SystemFeature[]>(AdminConfigService.getFeatures());
  const [workflows, setWorkflows] = useState<WorkflowConfig[]>(AdminConfigService.getWorkflows());
  const [rolePermissions, setRolePermissions] = useState<Record<string, RolePermissions>>(
    AdminConfigService.getRolePermissions()
  );
  const [numberingRules, setNumberingRules] = useState<NumberingRule[]>(
    AdminConfigService.getNumberingRules()
  );
  const [companySettings, setCompanySettings] = useState<CompanySettings>(
    AdminConfigService.getCompanySettings()
  );
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(
    AdminConfigService.getSecuritySettings()
  );
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>(
    AdminConfigService.getNotificationSettings()
  );

  // Critical Confirmation Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [pendingModuleAction, setPendingModuleAction] = useState<{
    moduleId: string;
    newStatus: boolean;
    moduleName: string;
    dependents: string[];
  } | null>(null);
  const [actionReason, setActionReason] = useState<string>('');

  // Selected feature category filter
  const [featureCategory, setFeatureCategory] = useState<string>('all');
  // Selected role for permissions matrix
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>('dg');

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const refreshAllStates = () => {
    setModules(AdminConfigService.getModules());
    setFeatures(AdminConfigService.getFeatures());
    setWorkflows(AdminConfigService.getWorkflows());
    setRolePermissions(AdminConfigService.getRolePermissions());
    setNumberingRules(AdminConfigService.getNumberingRules());
    setCompanySettings(AdminConfigService.getCompanySettings());
    setSecuritySettings(AdminConfigService.getSecuritySettings());
    setNotificationSettings(AdminConfigService.getNotificationSettings());
    if (onModuleStateChange) onModuleStateChange();
  };

  // Metrics
  const activeModulesCount = modules.filter((m) => m.enabled).length;
  const activeFeaturesCount = features.filter((f) => f.enabled).length;
  const auditLogs = DataService.getAuditLogs().filter((l) => l.action.startsWith('admin_'));

  // Handle module toggle with dependency safety
  const handleToggleModule = (mod: SystemModule) => {
    const isLocked = AdminConfigService.isSectionLocked('modules');
    if (isLocked) {
      alert('La section Modules est actuellement verrouillée. Déverrouillez-la dans "Sécurité" pour modifier les modules.');
      return;
    }

    const newStatus = !mod.enabled;

    if (!newStatus) {
      // Disabling: check if other modules depend on this
      const dependents = modules.filter((m) => m.enabled && m.dependencies.includes(mod.id)).map((m) => m.name);
      if (dependents.length > 0 || mod.isCore) {
        setPendingModuleAction({
          moduleId: mod.id,
          newStatus: false,
          moduleName: mod.name,
          dependents,
        });
        setConfirmModalOpen(true);
        return;
      }
    }

    executeModuleToggle(mod.id, newStatus);
  };

  const executeModuleToggle = async (moduleId: string, newStatus: boolean, reason?: string) => {
    const res = await AdminConfigService.setModuleStatus(moduleId, newStatus, reason);
    if (res.success) {
      refreshAllStates();
      showNotification(res.message);
    } else {
      alert(res.message);
    }
    setConfirmModalOpen(false);
    setPendingModuleAction(null);
    setActionReason('');
  };

  // Handle feature toggle
  const handleToggleFeature = async (feat: SystemFeature) => {
    const newStatus = !feat.enabled;
    const ok = await AdminConfigService.setFeatureStatus(feat.id, newStatus);
    if (ok) {
      refreshAllStates();
      showNotification(`Fonctionnalité "${feat.name}" : ${newStatus ? 'ACTIVÉE' : 'DÉSACTIVÉE'}`);
    }
  };

  // Handle feature option change
  const handleOptionChange = async (featureId: string, optionId: string, val: any) => {
    await AdminConfigService.updateFeatureOption(featureId, optionId, val);
    refreshAllStates();
    showNotification(`Option mise à jour.`);
  };

  // Toggle role permission cell
  const handleTogglePermission = async (
    roleId: string,
    moduleId: string,
    action: 'view' | 'create' | 'edit' | 'validate' | 'export' | 'archive' | 'delete'
  ) => {
    const currentVal = rolePermissions[roleId]?.modulePermissions[moduleId]?.[action] || false;
    await AdminConfigService.updateRolePermission(roleId, moduleId, action, !currentVal);
    refreshAllStates();
  };

  // Section lock toggle
  const handleToggleLock = async (sectionId: string) => {
    const isLocked = AdminConfigService.isSectionLocked(sectionId);
    await AdminConfigService.toggleSectionLock(sectionId, !isLocked);
    refreshAllStates();
    showNotification(`Section "${sectionId}" : ${!isLocked ? 'VERROUILLÉE' : 'DÉVERROUILLÉE'}`);
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    if (window.confirm('ATTENTION: Voulez-vous réinitialiser toutes les configurations aux paramètres d\'usine ? Cette opération sera tracée dans le journal d\'audit.')) {
      AdminConfigService.resetToFactoryDefaults();
      refreshAllStates();
      showNotification('Configuration réinitialisée aux réglages d\'usine.');
    }
  };

  const navTabs: { id: AdminTab; label: string; icon: any; badge?: number | string; badgeColor?: string }[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
    { id: 'users', label: 'Comptes & Rôles', icon: Users },
    { id: 'modules', label: 'Modules Système', icon: Layers, badge: `${activeModulesCount}/${modules.length}`, badgeColor: 'bg-cyan-500/20 text-cyan-400' },
    { id: 'features', label: 'Fonctionnalités', icon: Sliders, badge: `${activeFeaturesCount}/${features.length}`, badgeColor: 'bg-emerald-500/20 text-emerald-400' },
    { id: 'workflows', label: 'Workflows de Validation', icon: GitBranch, badge: workflows.length },
    { id: 'roles', label: 'Rôles & Permissions', icon: ShieldCheck },
    { id: 'finance', label: 'Paramètres Finance', icon: DollarSign },
    { id: 'ged', label: 'Paramètres GED', icon: FolderOpen },
    { id: 'scanner_ocr', label: 'Scanner & OCR', icon: Camera },
    { id: 'projects', label: 'Paramètres Projets', icon: FolderKanban },
    { id: 'stock', label: 'Paramètres Stock', icon: Package },
    { id: 'hr', label: 'Paramètres RH', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'numbering', label: 'Numérotation', icon: Hash },
    { id: 'security', label: 'Sécurité & Verrouillage', icon: Lock },
    { id: 'company', label: 'Identité Entreprise', icon: Building2 },
    { id: 'system', label: 'État Technique', icon: Server },
    { id: 'audit', label: 'Piste d\'Audit Config', icon: History, badge: auditLogs.length },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium">{successToast}</p>
        </div>
      )}

      {/* Main Admin Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800 p-0.5 shadow-lg flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Settings className="w-7 h-7 text-cyan-400 animate-spin-slow" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-md">
                Direction Générale &amp; Supervision
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Moteur Actif
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Centre d'Administration &amp; Configuration Avancée
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Activez/désactivez les modules, paramétrez les règles de gestion, définissez les circuits de validation et pilotez l'intégralité du système sans modification de code source.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={refreshAllStates}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title="Rafraîchir les paramètres"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Actualiser</span>
          </button>
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title="Rétablir les paramètres d'usine"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-lg overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : tab.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT ROUTING */}
      {/* 1. OVERVIEW HUB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Modules Actifs</p>
                <h3 className="text-2xl font-black text-white mt-1">
                  {activeModulesCount} <span className="text-xs text-slate-500 font-normal">/ {modules.length}</span>
                </h3>
                <p className="text-[10px] text-cyan-400 mt-1">
                  {Math.round((activeModulesCount / modules.length) * 100)}% de couverture opérationnelle
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Fonctionnalités Actives</p>
                <h3 className="text-2xl font-black text-emerald-400 mt-1">
                  {activeFeaturesCount} <span className="text-xs text-slate-500 font-normal">/ {features.length}</span>
                </h3>
                <p className="text-[10px] text-emerald-400/80 mt-1">7 catégories métier configurées</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                <Sliders className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Circuits de Validation</p>
                <h3 className="text-2xl font-black text-blue-400 mt-1">{workflows.length}</h3>
                <p className="text-[10px] text-slate-400 mt-1">Dépenses, Achats, Facturation</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center">
                <GitBranch className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Modifications Auditées</p>
                <h3 className="text-2xl font-black text-amber-400 mt-1">{auditLogs.length}</h3>
                <p className="text-[10px] text-amber-400/80 mt-1">Traçabilité immuable active</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Hub Navigation Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Centres de Configuration Spécialisés</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {navTabs.filter((t) => t.id !== 'overview').map((tab) => {
                const Icon = tab.icon;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-cyan-500/50 flex items-center justify-center text-cyan-400 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      {tab.badge !== undefined && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 font-bold">
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {tab.label}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        Accéder aux réglages et paramètres
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. MODULES MANAGER */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Gestionnaire des Modules Métier (20 modules)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Désactiver un module masque ses routes, menus, widgets et bloque réellement les opérations associées.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggleLock('modules')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  AdminConfigService.isSectionLocked('modules')
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {AdminConfigService.isSectionLocked('modules') ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{AdminConfigService.isSectionLocked('modules') ? 'Verrouillé' : 'Déverrouillé'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-md flex flex-col justify-between transition-all ${
                  mod.enabled ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/50 opacity-60 bg-slate-950'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                          {mod.category}
                        </span>
                        {mod.isCore && (
                          <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.2 rounded font-semibold">
                            Fondamental
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1">{mod.name}</h4>
                    </div>

                    {/* Toggle Switch Button */}
                    <button
                      onClick={() => handleToggleModule(mod)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        mod.enabled ? 'bg-cyan-600' : 'bg-slate-700'
                      }`}
                      title={mod.enabled ? 'Désactiver le module' : 'Activer le module'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          mod.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{mod.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Fonctionnalités actives :</span>
                    <span className="font-mono font-bold text-white">
                      {mod.activeFeaturesCount} / {mod.featuresCount}
                    </span>
                  </div>

                  {mod.dependencies.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Dépendances requises :</span>
                      <div className="flex gap-1">
                        {mod.dependencies.map((d) => (
                          <span
                            key={d}
                            className={`px-1.5 py-0.2 rounded font-mono text-[9px] border ${
                              AdminConfigService.isModuleEnabled(d)
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : 'bg-red-950 text-red-300 border-red-800 font-bold'
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Modifié par :</span>
                    <span className="truncate max-w-[150px]">{mod.updatedBy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. USER MANAGEMENT & RBAC */}
      {activeTab === 'users' && <UserManagementView />}

      {/* 3. FEATURES & OPTIONS MANAGER */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Gestionnaire de Fonctionnalités &amp; Niveaux d'Options</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hiérarchie à 3 niveaux : Module → Fonctionnalité (ON/OFF) → Options fines.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['all', 'Finance', 'GED', 'Projets', 'RH', 'Stock', 'Achats', 'Notifications'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFeatureCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    featureCategory === cat
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'Toutes les catégories' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {features
              .filter((f) => featureCategory === 'all' || f.category === featureCategory)
              .map((feat) => {
                const isParentActive = AdminConfigService.isModuleEnabled(feat.moduleId);
                return (
                  <div
                    key={feat.id}
                    className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition-all ${
                      feat.enabled && isParentActive
                        ? 'border-slate-800'
                        : 'border-slate-800/40 opacity-70 bg-slate-950'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-slate-950 text-cyan-400 border border-slate-800">
                            {feat.category}
                          </span>
                          {!isParentActive && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                              Module parent ({feat.moduleId}) désactivé
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-white">{feat.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">{feat.description}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleToggleFeature(feat)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            feat.enabled && isParentActive ? 'bg-emerald-600' : 'bg-slate-700'
                          }`}
                          title={feat.enabled ? 'Désactiver la fonctionnalité' : 'Activer'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              feat.enabled && isParentActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Level 3: Options Sub-panel */}
                    {feat.options.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80 bg-slate-950/60 p-3.5 rounded-xl space-y-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Options de configuration ({feat.name})
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {feat.options.map((opt) => (
                            <div
                              key={opt.id}
                              className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                            >
                              <div>
                                <p className="font-medium text-white">{opt.name}</p>
                                <p className="text-[10px] text-slate-400">{opt.description}</p>
                              </div>

                              <div>
                                {opt.type === 'boolean' && (
                                  <input
                                    type="checkbox"
                                    checked={opt.value}
                                    onChange={(e) => handleOptionChange(feat.id, opt.id, e.target.checked)}
                                    className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer"
                                  />
                                )}
                                {opt.type === 'number' && (
                                  <input
                                    type="number"
                                    value={opt.value}
                                    onChange={(e) => handleOptionChange(feat.id, opt.id, Number(e.target.value))}
                                    className="w-24 bg-slate-950 border border-slate-700 rounded p-1 text-white font-mono text-xs text-right"
                                  />
                                )}
                                {opt.type === 'select' && (
                                  <select
                                    value={opt.value}
                                    onChange={(e) => handleOptionChange(feat.id, opt.id, e.target.value)}
                                    className="bg-slate-950 border border-slate-700 rounded p-1 text-white text-xs"
                                  >
                                    {opt.options?.map((o) => (
                                      <option key={o.value} value={o.value}>
                                        {o.label}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 4. WORKFLOWS MANAGER */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-400" />
                <span>Circuits de Validation &amp; Seuils Financiers</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Définissez les paliers en FCFA et les validateurs obligatoires (Chef de chantier, Comptable, DG).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {workflows.map((wf) => (
              <div key={wf.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{wf.name}</h4>
                    <p className="text-xs text-slate-400">{wf.description}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-bold uppercase">
                    {wf.type}
                  </span>
                </div>

                {/* Validation Levels Timeline */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Paliers de validation configurés
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {wf.levels.map((lvl, idx) => (
                      <div
                        key={lvl.id}
                        className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-400 font-mono">Palier #{idx + 1}</span>
                          <span className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                            {lvl.validatorRoleTitle}
                          </span>
                        </div>

                        <div className="py-2 border-y border-slate-800/80">
                          <p className="text-[10px] text-slate-400">Fourchette de montant :</p>
                          <p className="font-mono text-xs font-bold text-white mt-0.5">
                            {lvl.thresholdMin.toLocaleString('fr-FR')} à{' '}
                            {lvl.thresholdMax > 100000000 ? 'Illimité' : `${lvl.thresholdMax.toLocaleString('fr-FR')} FCFA`}
                          </p>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-400">
                          <p className="flex items-center gap-1.5">
                            {lvl.requiredReceipt ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-600" />
                            )}
                            <span>Justificatif scanné obligatoire</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            {lvl.requiresJustification ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-600" />
                            )}
                            <span>Motivation écrite requise</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reject reasons */}
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Motifs de rejet prédéfinis
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {wf.rejectReasons.map((reason, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ROLES & PERMISSIONS MATRIX */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Matrice des Permissions par Profil &amp; Rôle (RBAC)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Définissez les droits d'action par module : Voir, Créer, Modifier, Valider, Exporter, Archiver, Supprimer.
              </p>
            </div>

            {/* Select Role */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Rôle sélectionné :</span>
              <select
                value={selectedRoleKey}
                onChange={(e) => setSelectedRoleKey(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold"
              >
                {Object.keys(rolePermissions).map((rKey) => (
                  <option key={rKey} value={rKey}>
                    {rolePermissions[rKey].roleTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Module Métier</th>
                    <th className="py-3 px-3 text-center">Voir</th>
                    <th className="py-3 px-3 text-center">Créer</th>
                    <th className="py-3 px-3 text-center">Modifier</th>
                    <th className="py-3 px-3 text-center">Valider</th>
                    <th className="py-3 px-3 text-center">Exporter</th>
                    <th className="py-3 px-3 text-center">Archiver</th>
                    <th className="py-3 px-3 text-center">Supprimer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {modules.map((mod) => {
                    const perm = rolePermissions[selectedRoleKey]?.modulePermissions?.[mod.id] || {
                      view: false,
                      create: false,
                      edit: false,
                      validate: false,
                      export: false,
                      archive: false,
                      delete: false,
                    };

                    return (
                      <tr key={mod.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${mod.enabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          <span>{mod.name}</span>
                          {!mod.enabled && (
                            <span className="text-[9px] text-slate-500 font-normal">(Module OFF)</span>
                          )}
                        </td>
                        {(['view', 'create', 'edit', 'validate', 'export', 'archive', 'delete'] as const).map(
                          (action) => (
                            <td key={action} className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleTogglePermission(selectedRoleKey, mod.id, action)}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center mx-auto transition-colors cursor-pointer border ${
                                  perm[action]
                                    ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                                    : 'bg-slate-950 text-slate-600 border-slate-800 hover:border-slate-700'
                                }`}
                                title={`${perm[action] ? 'Interdire' : 'Autoriser'} ${action}`}
                              >
                                {perm[action] ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          )
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. NUMBERING RULES */}
      {activeTab === 'numbering' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Hash className="w-4 h-4 text-cyan-400" />
                <span>Format de Numérotation des Pièces Officielles</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configurez les masques : PROJ-2026-0001, FAC-2026-0001, DEP-2026-0001, etc.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numberingRules.map((rule) => (
              <div key={rule.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white">{rule.entityName}</h4>
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {rule.samplePreview}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Préfixe</label>
                    <input
                      type="text"
                      value={rule.prefix}
                      onChange={(e) => {
                        const updated = {
                          ...rule,
                          prefix: e.target.value.toUpperCase(),
                          samplePreview: `${e.target.value.toUpperCase()}-${new Date().getFullYear()}-${String(
                            rule.currentCounter
                          ).padStart(rule.digitPadding, '0')}`,
                        };
                        AdminConfigService.saveNumberingRule(updated);
                        refreshAllStates();
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Longueur chiffres</label>
                    <input
                      type="number"
                      min={3}
                      max={8}
                      value={rule.digitPadding}
                      onChange={(e) => {
                        const digits = Number(e.target.value);
                        const updated = {
                          ...rule,
                          digitPadding: digits,
                          samplePreview: `${rule.prefix}-${new Date().getFullYear()}-${String(
                            rule.currentCounter
                          ).padStart(digits, '0')}`,
                        };
                        AdminConfigService.saveNumberingRule(updated);
                        refreshAllStates();
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Compteur actuel</label>
                    <input
                      type="number"
                      value={rule.currentCounter}
                      onChange={(e) => {
                        const cnt = Number(e.target.value);
                        const updated = {
                          ...rule,
                          currentCounter: cnt,
                          samplePreview: `${rule.prefix}-${new Date().getFullYear()}-${String(cnt).padStart(
                            rule.digitPadding,
                            '0'
                          )}`,
                        };
                        AdminConfigService.saveNumberingRule(updated);
                        refreshAllStates();
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-center font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.resetAnnually}
                      onChange={(e) => {
                        const updated = { ...rule, resetAnnually: e.target.checked };
                        AdminConfigService.saveNumberingRule(updated);
                        refreshAllStates();
                      }}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span>Réinitialiser à 1 chaque 1er janvier</span>
                  </label>
                  <span>Dernier reset : {rule.lastResetYear}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPECIALIZED DOMAIN SETTINGS (Finance, GED, Scanner/OCR, Projects, Stock, HR, Notifications) */}
      {['finance', 'ged', 'scanner_ocr', 'projects', 'stock', 'hr', 'notifications'].includes(activeTab) && (
        <SpecializedSettings
          section={activeTab as any}
          onSaved={(msg) => {
            refreshAllStates();
            showNotification(msg);
          }}
        />
      )}

      {/* 7. COMPANY SETTINGS */}
      {activeTab === 'company' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Identité &amp; Coordonnées CORESI INTERNATIONAL</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Raison Sociale</label>
              <input
                type="text"
                value={companySettings.name}
                onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-semibold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Forme Juridique</label>
              <input
                type="text"
                value={companySettings.legalForm}
                onChange={(e) => setCompanySettings({ ...companySettings, legalForm: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Registre du Commerce (RCCM)</label>
              <input
                type="text"
                value={companySettings.registrationNumber}
                onChange={(e) => setCompanySettings({ ...companySettings, registrationNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Identifiant Fiscal (NIF)</label>
              <input
                type="text"
                value={companySettings.taxId}
                onChange={(e) => setCompanySettings({ ...companySettings, taxId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Devise Principale</label>
              <input
                type="text"
                value={companySettings.currency}
                onChange={(e) => setCompanySettings({ ...companySettings, currency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Fuseau Horaire</label>
              <input
                type="text"
                value={companySettings.timezone}
                onChange={(e) => setCompanySettings({ ...companySettings, timezone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-slate-400 block mb-1">Adresse Siège &amp; Ateliers</label>
              <input
                type="text"
                value={companySettings.address}
                onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Téléphone de Contact</label>
              <input
                type="text"
                value={companySettings.phone}
                onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={async () => {
                await AdminConfigService.saveCompanySettings(companySettings);
                refreshAllStates();
                showNotification('Coordonnées d\'entreprise enregistrées avec succès.');
              }}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Enregistrer les coordonnées
            </button>
          </div>
        </div>
      )}

      {/* 8. SECURITY & LOCK */}
      {activeTab === 'security' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Sécurité, Délai de Session &amp; Verrouillage des Sections</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Durée maximale de session (minutes)</label>
              <input
                type="number"
                value={securitySettings.sessionDurationMinutes}
                onChange={(e) =>
                  setSecuritySettings({ ...securitySettings, sessionDurationMinutes: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Délai d'inactivité avant verrouillage (minutes)</label>
              <input
                type="number"
                value={securitySettings.idleTimeoutMinutes}
                onChange={(e) =>
                  setSecuritySettings({ ...securitySettings, idleTimeoutMinutes: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Tentatives de connexion max avant blocage</label>
              <input
                type="number"
                value={securitySettings.maxFailedLogins}
                onChange={(e) =>
                  setSecuritySettings({ ...securitySettings, maxFailedLogins: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <p className="text-xs font-bold text-white">Sections Sensibles Verrouillées</p>
            <div className="flex flex-wrap gap-2">
              {['modules', 'features', 'workflows', 'roles', 'numbering', 'security'].map((sec) => {
                const isSecLocked = securitySettings.lockedSections.includes(sec);
                return (
                  <button
                    key={sec}
                    onClick={() => handleToggleLock(sec)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      isSecLocked
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {isSecLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span className="capitalize">{sec}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={async () => {
                await AdminConfigService.saveSecuritySettings(securitySettings);
                refreshAllStates();
                showNotification('Paramètres de sécurité mis à jour.');
              }}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Enregistrer la politique de sécurité
            </button>
          </div>
        </div>
      )}

      {/* 9. TECHNICAL & SYSTEM STATUS */}
      {activeTab === 'system' && <SystemHealthView />}

      {/* 10. AUDIT LOGS FOR ADMIN SETTINGS */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Historique d'Audit des Configurations &amp; Paramètres</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{auditLogs.length} événements enregistrés</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Date &amp; Heure</th>
                  <th className="py-2.5 px-3">Opérateur</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Paramètre / Cible</th>
                  <th className="py-2.5 px-4">Détails de l'Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                      Aucune modification de configuration enregistrée pour le moment.
                    </td>
                  </tr>
                ) : (
                  auditLogs.slice(0, 30).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white">
                        {log.userName}{' '}
                        <span className="text-[10px] text-cyan-400 font-mono">({log.userRole})</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-cyan-300">
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{log.entityId}</td>
                      <td className="py-2.5 px-4 text-slate-300 leading-relaxed">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR CRITICAL ACTIONS */}
      {confirmModalOpen && pendingModuleAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/50 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">
                Confirmation renforcée : Désactivation de module
              </h3>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Vous êtes sur le point de désactiver le module{' '}
              <strong className="text-white uppercase font-mono">{pendingModuleAction.moduleName}</strong>.
            </p>

            {pendingModuleAction.dependents.length > 0 && (
              <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl space-y-1.5">
                <p className="font-bold text-red-300">Impacts &amp; Dépendances en cascade :</p>
                <p className="text-slate-300 text-[11px]">
                  Les modules suivants dépendent de ce module et seront également désactivés :
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {pendingModuleAction.dependents.map((dep) => (
                    <span
                      key={dep}
                      className="px-2 py-0.5 bg-red-900/60 border border-red-700 text-red-200 rounded font-bold"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Motif obligatoire de la désactivation :
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Indiquez la raison organisationnelle ou opérationnelle..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => {
                  setConfirmModalOpen(false);
                  setPendingModuleAction(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (!actionReason.trim()) {
                    alert('Veuillez renseigner un motif pour valider la désactivation.');
                    return;
                  }
                  executeModuleToggle(
                    pendingModuleAction.moduleId,
                    pendingModuleAction.newStatus,
                    actionReason
                  );
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg cursor-pointer"
              >
                Confirmer la désactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
