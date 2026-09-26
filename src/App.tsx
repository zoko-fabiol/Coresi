import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Camera,
  FolderKanban,
  DollarSign,
  Users,
  Wrench,
  ShieldAlert,
  Settings,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building2,
  Lock,
  ArrowRight,
  Menu,
} from 'lucide-react';
import {
  Project,
  DocumentRecord,
  Expense,
  Invoice,
  Employee,
  Material,
  AuditLog,
  UserProfile,
  OperationalSite,
  SiteStockTransfer,
  PurchaseRequest,
  PurchaseOrder,
  GoodsReceipt,
  TechnicalReport,
  Equipment,
  MaintenanceWorkOrder,
  MaintenancePlan,
  Mission,
  PayrollPeriod,
  Payslip,
  AccountingAccount,
  JournalEntry,
  BankTransaction,
  AppNotification,
  OcrResultRecord,
} from './types';
import { DataService } from './services/dataService';
import { testConnection, signOutUser } from './firebase';
import { QuickAccessService } from './services/auth/quickAccessService';
import { useIdleTimer } from './hooks/useIdleTimer';
import {
  ROLE_CONFIGS,
  isModuleAllowedForRole,
  getDefaultModuleForRole,
} from './services/rolePermissions';

import { Navbar } from './components/navigation/Navbar';
import { Sidebar } from './components/navigation/Sidebar';
import { DgDashboard } from './components/dashboard/DgDashboard';
import { GedModule } from './components/ged/GedModule';
import { ProjectsModule } from './components/projects/ProjectsModule';
import { FinanceModule } from './components/finances/FinanceModule';
import { HrModule } from './components/hr/HrModule';
import { MaterialsModule } from './components/materials/MaterialsModule';
import { AuditModule } from './components/audit/AuditModule';
import { PartnersModule } from './components/partners/PartnersModule';
import { AdminModule } from './components/admin/AdminModule';
import { AdminConfigService } from './services/adminConfigService';

// Advanced Industrial Modules
import { PurchasesModule } from './components/purchases/PurchasesModule';
import { ReportsModule } from './components/reports/ReportsModule';
import { GmaoModule } from './components/maintenance/GmaoModule';
import { MissionsModule } from './components/missions/MissionsModule';
import { PayrollModule } from './components/payroll/PayrollModule';
import { AccountingModule } from './components/accounting/AccountingModule';
import { SitesModule } from './components/sites/SitesModule';
import { NotificationCenterModal } from './components/notifications/NotificationCenterModal';
import { OcrValidationModal } from './components/ocr/OcrValidationModal';

import { SmartScannerModal } from './components/scanner/SmartScannerModal';
import { DocumentViewerModal } from './components/ged/DocumentViewerModal';
import { ProjectDetailModal } from './components/projects/ProjectDetailModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { NewExpenseModal } from './components/modals/NewExpenseModal';
import { NewInvoiceModal } from './components/modals/NewInvoiceModal';
import { NewEmployeeModal } from './components/modals/NewEmployeeModal';
import { NewMaterialModal } from './components/modals/NewMaterialModal';
import { AuthModal } from './components/auth/AuthModal';
import { QuickUnlockModal } from './components/auth/QuickUnlockModal';
import { ConstructionLoader } from './components/shared/ConstructionLoader';

export default function App() {
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DataService.getCurrentUser());
  const [currentModule, setCurrentModule] = useState<string>(
    getDefaultModuleForRole(DataService.getCurrentUser().role)
  );

  // Inactivity auto-lock timer (configurable in Settings)
  const [idleTimeoutMinutes] = useState<number>(() => {
    try {
      return typeof QuickAccessService?.getIdleTimeout === 'function'
        ? QuickAccessService.getIdleTimeout()
        : 15;
    } catch {
      return 15;
    }
  });

  useIdleTimer({
    timeoutMinutes: idleTimeoutMinutes,
    onIdle: () => {
      if (!isInitialLoading) {
        setIsSessionLocked(true);
      }
    },
    isEnabled: !isSessionLocked && !isInitialLoading && idleTimeoutMinutes > 0,
  });

  // Application Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Advanced Industrial Modules States
  const [sites, setSites] = useState<OperationalSite[]>([]);
  const [transfers, setTransfers] = useState<SiteStockTransfer[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [technicalReports, setTechnicalReports] = useState<TechnicalReport[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [accountingAccounts, setAccountingAccounts] = useState<AccountingAccount[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ocrRecords, setOcrRecords] = useState<OcrResultRecord[]>([]);

  // Advanced Modals
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [selectedOcrRecord, setSelectedOcrRecord] = useState<OcrResultRecord | null>(null);

  // Modal States
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [scannerContext, setScannerContext] = useState<any>(undefined);

  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  const [projectDetailOpen, setProjectDetailOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [newProjectOpen, setNewProjectOpen] = useState<boolean>(false);
  const [newExpenseOpen, setNewExpenseOpen] = useState<boolean>(false);
  const [newInvoiceOpen, setNewInvoiceOpen] = useState<boolean>(false);
  const [newEmployeeOpen, setNewEmployeeOpen] = useState<boolean>(false);
  const [newMaterialOpen, setNewMaterialOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const reloadData = () => {
    setProjects(DataService.getProjects());
    setDocuments(DataService.getDocuments());
    setExpenses(DataService.getExpenses());
    setInvoices(DataService.getInvoices());
    setEmployees(DataService.getEmployees());
    setMaterials(DataService.getMaterials());
    setClients(DataService.getClients());
    setSuppliers(DataService.getSuppliers());
    setAuditLogs(DataService.getAuditLogs());
    setCurrentUser(DataService.getCurrentUser());

    // Advanced Modules Reload
    setSites(DataService.getSites());
    setTransfers(DataService.getSiteTransfers());
    setPurchaseRequests(DataService.getPurchaseRequests());
    setPurchaseOrders(DataService.getPurchaseOrders());
    setGoodsReceipts(DataService.getGoodsReceipts());
    setTechnicalReports(DataService.getTechnicalReports());
    setEquipment(DataService.getEquipment());
    setWorkOrders(DataService.getWorkOrders());
    setMaintenancePlans(DataService.getMaintenancePlans());
    setMissions(DataService.getMissions());
    setPayrollPeriods(DataService.getPayrollPeriods());
    setPayslips(DataService.getPayslips());
    setAccountingAccounts(DataService.getAccountingAccounts());
    setJournalEntries(DataService.getJournalEntries());
    setBankTransactions(DataService.getBankTransactions());
    setNotifications(DataService.getNotifications());
    setOcrRecords(DataService.getOcrResults());
  };

  useEffect(() => {
    reloadData();
    DataService.initRealtimeSync();
    const unsubData = DataService.onDataChange(() => {
      reloadData();
    });
    testConnection().then((connected) => {
      if (connected) {
        console.log('CORESI ERP: Connexion Cloud Firestore validée.');
      }
    });

    const splashTimer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1200);

    return () => {
      unsubData();
      clearTimeout(splashTimer);
    };
  }, []);

  // Handle Role Switching with automatic tab adjustment
  const handleRoleChange = (newUser: UserProfile) => {
    setCurrentUser(newUser);
    DataService.setCurrentUser(newUser);

    // If the currently open module is not allowed for this role, auto-redirect to their allowed home
    if (!isModuleAllowedForRole(currentModule, newUser.role)) {
      const defaultMod = getDefaultModuleForRole(newUser.role);
      setCurrentModule(defaultMod);
    }
    const roleCfg = ROLE_CONFIGS[newUser.role];
    showToast(`Session basculée sur : ${newUser.displayName} [${roleCfg?.shortLabel || newUser.role.toUpperCase()}]`);
  };

  // Handlers for Scanner
  const handleOpenScanner = (context?: any) => {
    if (!AdminConfigService.isModuleEnabled('scanner')) {
      showToast("Le module Scanner Mobile est actuellement désactivé dans l'Administration.");
      return;
    }
    setScannerContext(context);
    setScannerOpen(true);
  };

  const handleDocumentCreated = (newDoc: DocumentRecord) => {
    reloadData();
    showToast(`Document "${newDoc.title}" (${newDoc.documentNumber}) numérisé et enregistré dans la GED avec succès.`);
    setSelectedDoc(newDoc);
    setViewerOpen(true);
  };

  const handleArchiveDocument = async (id: string) => {
    await DataService.archiveDocument(id);
    reloadData();
    showToast('Document archivé avec succès.');
  };

  const handleDeleteDocument = async (id: string) => {
    await DataService.deleteDocument(id);
    reloadData();
    showToast('Document supprimé définitivement.');
  };

  const handleScanForProject = (prj: Project) => {
    handleOpenScanner({
      projectId: prj.id,
      projectName: prj.name,
      clientId: prj.clientId,
      clientName: prj.clientName,
    });
  };

  const handleScanForEmployee = (emp: Employee) => {
    handleOpenScanner({
      employeeId: emp.id,
      employeeName: emp.fullName,
      projectId: emp.assignedProjectId,
      projectName: emp.assignedProjectName,
    });
  };

  const handleScanForFinance = (type: 'facture' | 'depense') => {
    handleOpenScanner({
      type,
    });
  };

  const handleUpdateProjectProgress = async (projectId: string, newProgress: number) => {
    const prj = projects.find((p) => p.id === projectId);
    if (prj) {
      const updated = { ...prj, progress: newProgress };
      await DataService.saveProject(updated);
      reloadData();
      if (selectedProject?.id === projectId) {
        setSelectedProject(updated);
      }
      showToast(`Avancement du chantier mis à jour à ${newProgress}%.`);
    }
  };

  const currentRoleConfig = ROLE_CONFIGS[currentUser.role] || ROLE_CONFIGS.invite;
  const isModuleActive = (modId: string) => {
    if (modId === 'admin' || modId === 'settings' || modId === 'dashboard') return true;
    return AdminConfigService.isModuleEnabled(modId);
  };

  const isCurrentModuleAllowed = isModuleAllowedForRole(currentModule, currentUser.role);
  const isCurrentModuleActive = isModuleActive(currentModule);

  if (isInitialLoading) {
    return <ConstructionLoader fullScreen message="Démarrage de la plateforme CORESI Gestion & GED..." />;
  }

  return (
    <div className="h-screen h-[100dvh] w-full bg-[--coresi-background] text-[--coresi-text] flex flex-col font-sans overflow-hidden">
      {/* Top Navigation Bar with Direct Role Switcher */}
      <Navbar
        currentUser={currentUser}
        onOpenScanner={() => handleOpenScanner()}
        onOpenSettings={() => setSettingsOpen(true)}
        onLockSession={() => setIsSessionLocked(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onUserRoleChange={handleRoleChange}
        onGlobalSearch={(q) => {
          if (isModuleAllowedForRole('ged', currentUser.role)) {
            setCurrentModule('ged');
          }
        }}
        pendingScansCount={documents.filter((d) => d.status === 'pending_validation').length}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar filtering strictly by role */}
        <Sidebar
          currentModule={currentModule}
          currentUser={currentUser}
          onNavigate={(mod) => {
            if (mod === 'scanner') {
              handleOpenScanner();
            } else if (isModuleAllowedForRole(mod, currentUser.role)) {
              setCurrentModule(mod);
            }
          }}
          documentsCount={documents.length}
          activeProjectsCount={projects.filter((p) => p.status === 'in_progress').length}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Workspace Area with aerated mobile padding */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-8 pb-28 md:pb-8 bg-[--coresi-background] transition-all">
          {/* Permission Guard: if an unauthorized tab is selected */}
          {!isCurrentModuleAllowed ? (
            <div className="max-w-xl mx-auto my-16 bg-[--coresi-surface] dark:bg-[--coresi-surface] border border-[--coresi-border] rounded-3xl p-8 text-center space-y-4 shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-[--coresi-secondary-50] dark:bg-[rgba(229,140,42,0.1)] border border-[--coresi-secondary-200] dark:border-[rgba(229,140,42,0.2)] text-[--coresi-secondary] flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[--coresi-text]">Onglet Restreint par Profil</h3>
              <p className="text-xs text-[--coresi-text-secondary] leading-relaxed max-w-md mx-auto">
                L'onglet <strong className="text-[--coresi-text] uppercase font-mono">{currentModule}</strong> est réservé à un autre département. Votre profil actuel (<strong className="text-[--coresi-primary]">{currentRoleConfig.title}</strong>) ne possède pas les habilitations pour y accéder.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setCurrentModule(currentRoleConfig.defaultModule)}
                  className="px-5 py-2.5 bg-[--coresi-primary] hover:bg-[--coresi-primary-light] text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <span>Accéder à mon espace ({currentRoleConfig.defaultModule.toUpperCase()})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : !isCurrentModuleActive ? (
            <div className="max-w-xl mx-auto my-16 bg-[--coresi-surface] dark:bg-[--coresi-surface] border border-[--coresi-border] rounded-3xl p-8 text-center space-y-4 shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-[--coresi-danger-light] dark:bg-[rgba(220,38,38,0.1)] border border-red-200 dark:border-[rgba(220,38,38,0.2)] text-[--coresi-danger] flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[--coresi-text]">Module Désactivé dans l'Administration</h3>
              <p className="text-xs text-[--coresi-text-secondary] leading-relaxed max-w-md mx-auto">
                Le module <strong className="text-[--coresi-text] uppercase font-mono">{currentModule}</strong> a été désactivé par la Direction Générale. Ses fonctionnalités, formulaires et écritures sont temporairement suspendus.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setCurrentModule('dashboard')}
                  className="px-5 py-2.5 bg-[--coresi-primary] hover:bg-[--coresi-primary-light] text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <span>Retour au Tableau de Bord</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Module Router for Authorized Views */}
              {currentModule === 'dashboard' && (
                <DgDashboard
                  projects={projects}
                  documents={documents}
                  expenses={expenses}
                  invoices={invoices}
                  employees={employees}
                  materials={materials}
                  onNavigate={(mod) => {
                    if (isModuleAllowedForRole(mod, currentUser.role)) {
                      setCurrentModule(mod);
                    }
                  }}
                  onOpenScanner={() => handleOpenScanner()}
                  onSelectProject={(prj) => {
                    setSelectedProject(prj);
                    setProjectDetailOpen(true);
                  }}
                  onSelectDocument={(doc) => {
                    setSelectedDoc(doc);
                    setViewerOpen(true);
                  }}
                />
              )}

              {currentModule === 'ged' && (
                <GedModule
                  documents={documents}
                  currentUserRole={currentUser.role}
                  onOpenScanner={() => handleOpenScanner()}
                  onOpenUpload={() => handleOpenScanner()}
                  onSelectDocument={(doc) => {
                    setSelectedDoc(doc);
                    setViewerOpen(true);
                  }}
                  onArchiveDocument={handleArchiveDocument}
                  onSelectProject={(projectId) => {
                    const prj = projects.find((p) => p.id === projectId);
                    if (prj) {
                      setSelectedProject(prj);
                      setProjectDetailOpen(true);
                    }
                  }}
                />
              )}

              {currentModule === 'projects' && (
                <ProjectsModule
                  projects={projects}
                  documents={documents}
                  expenses={expenses}
                  onOpenProjectDetail={(prj) => {
                    setSelectedProject(prj);
                    setProjectDetailOpen(true);
                  }}
                  onScanForProject={handleScanForProject}
                  onNewProject={() => setNewProjectOpen(true)}
                />
              )}

              {currentModule === 'finances' && (
                <FinanceModule
                  expenses={expenses}
                  invoices={invoices}
                  projects={projects}
                  documents={documents}
                  onOpenScannerForFinance={handleScanForFinance}
                  onSelectDocument={(doc) => {
                    setSelectedDoc(doc);
                    setViewerOpen(true);
                  }}
                  onNewExpense={() => setNewExpenseOpen(true)}
                  onNewInvoice={() => setNewInvoiceOpen(true)}
                  onRefresh={reloadData}
                />
              )}

              {currentModule === 'hr' && (
                <HrModule
                  employees={employees}
                  documents={documents}
                  onOpenScannerForEmployee={handleScanForEmployee}
                  onSelectDocument={(doc) => {
                    setSelectedDoc(doc);
                    setViewerOpen(true);
                  }}
                  onNewEmployee={() => setNewEmployeeOpen(true)}
                  onRefresh={reloadData}
                />
              )}

              {currentModule === 'partners' && (
                <PartnersModule
                  clients={clients}
                  suppliers={suppliers}
                  projects={projects}
                  invoices={invoices}
                  documents={documents}
                  onSelectDocument={(doc) => {
                    setSelectedDoc(doc);
                    setViewerOpen(true);
                  }}
                  onSelectProject={(projectId) => {
                    const prj = projects.find((p) => p.id === projectId);
                    if (prj) {
                      setSelectedProject(prj);
                      setProjectDetailOpen(true);
                    }
                  }}
                  onRefresh={reloadData}
                />
              )}

              {currentModule === 'materials' && (
                <MaterialsModule
                  materials={materials}
                  projects={projects}
                  onNewMaterial={() => setNewMaterialOpen(true)}
                  onRefresh={reloadData}
                />
              )}

              {currentModule === 'audit' && <AuditModule auditLogs={auditLogs} />}

              {currentModule === 'admin' && (
                <AdminModule onModuleStateChange={reloadData} />
              )}

              {currentModule === 'purchases' && (
                <PurchasesModule
                  requests={purchaseRequests}
                  orders={purchaseOrders}
                  receipts={goodsReceipts}
                  suppliers={suppliers}
                  projects={projects}
                  onRefresh={reloadData}
                  showToast={showToast}
                />
              )}

              {currentModule === 'reports' && (
                <ReportsModule
                  reports={technicalReports}
                  projects={projects}
                  onRefresh={reloadData}
                  showToast={showToast}
                />
              )}

              {currentModule === 'maintenance' && (
                <GmaoModule
                  equipment={equipment}
                  workOrders={workOrders}
                  plans={maintenancePlans}
                  projects={projects}
                  onRefresh={reloadData}
                  showToast={showToast}
                />
              )}

              {currentModule === 'missions' && (
                <MissionsModule
                  missions={missions}
                  employees={employees}
                  projects={projects}
                  onRefresh={reloadData}
                  showToast={showToast}
                />
              )}

              {currentModule === 'payroll' && (
                <PayrollModule
                  periods={payrollPeriods}
                  payslips={payslips}
                  employees={employees}
                  onRefresh={reloadData}
                  showToast={showToast}
                />
              )}

              {currentModule === 'accounting' && (
                <AccountingModule
                  accounts={accountingAccounts}
                  entries={journalEntries}
                  bankTransactions={bankTransactions}
                  onRefresh={reloadData}
                  showToast={showToast}
                />
              )}

              {currentModule === 'sites' && (
                <SitesModule
                  sites={sites}
                  transfers={transfers}
                  materials={materials}
                  employees={employees}
                  projects={projects}
                  onRefresh={reloadData}
                  showToast={showToast}
                />
              )}

              {currentModule === 'settings' && (
                <div className="max-w-2xl mx-auto">
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="w-full py-4 bg-[--coresi-surface] border border-[--coresi-border] hover:border-[--coresi-primary] rounded-2xl text-center font-bold text-[--coresi-primary] cursor-pointer transition-colors"
                  >
                    Ouvrir le panneau des paramètres complets
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating Action Bar on Mobile - Modern Glass Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-3 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around z-40 text-xs shadow-2xl transition-all">
        {isModuleAllowedForRole('dashboard', currentUser.role) && (
          <button
            onClick={() => setCurrentModule('dashboard')}
            className={`p-1.5 flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-90 ${
              currentModule === 'dashboard' ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${currentModule === 'dashboard' ? 'bg-cyan-500/10 dark:bg-cyan-400/15' : ''}`}>
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium leading-none">Accueil</span>
          </button>
        )}

        {isModuleAllowedForRole('finances', currentUser.role) && (
          <button
            onClick={() => setCurrentModule('finances')}
            className={`p-1.5 flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-90 ${
              currentModule === 'finances' ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${currentModule === 'finances' ? 'bg-cyan-500/10 dark:bg-cyan-400/15' : ''}`}>
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium leading-none">Finances</span>
          </button>
        )}

        {isModuleAllowedForRole('projects', currentUser.role) && (
          <button
            onClick={() => setCurrentModule('projects')}
            className={`p-1.5 flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-90 ${
              currentModule === 'projects' ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${currentModule === 'projects' ? 'bg-cyan-500/10 dark:bg-cyan-400/15' : ''}`}>
              <FolderKanban className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium leading-none">Chantiers</span>
          </button>
        )}

        {isModuleAllowedForRole('hr', currentUser.role) && (
          <button
            onClick={() => setCurrentModule('hr')}
            className={`p-1.5 flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-90 ${
              currentModule === 'hr' ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${currentModule === 'hr' ? 'bg-cyan-500/10 dark:bg-cyan-400/15' : ''}`}>
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium leading-none">Personnel</span>
          </button>
        )}

        {isModuleAllowedForRole('ged', currentUser.role) && (
          <button
            onClick={() => setCurrentModule('ged')}
            className={`p-1.5 flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-90 ${
              currentModule === 'ged' ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${currentModule === 'ged' ? 'bg-cyan-500/10 dark:bg-cyan-400/15' : ''}`}>
              <FolderOpen className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium leading-none">GED</span>
          </button>
        )}

        {/* Global Menu trigger to open the full module drawer on mobile */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`p-1.5 flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-90 ${
            mobileMenuOpen ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
          title="Tous les modules"
        >
          <div className={`p-1 rounded-xl transition-colors ${mobileMenuOpen ? 'bg-cyan-500/10 dark:bg-cyan-400/15' : ''}`}>
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </button>
      </div>

      {/* Smart Scanner Modal (Adobe Scan style) */}
      <SmartScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDocumentCreated={handleDocumentCreated}
        initialContext={scannerContext}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        document={selectedDoc}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onArchive={handleArchiveDocument}
        onDelete={handleDeleteDocument}
        onOpenOcrValidation={(doc) => {
          const existing = ocrRecords.find((r) => r.documentId === doc.id);
          if (existing) {
            setSelectedOcrRecord(existing);
          } else {
            const rec: OcrResultRecord = {
              id: 'ocr-' + doc.id,
              documentId: doc.id,
              originalFileName: doc.title,
              fileUrl: doc.cloudinary.secureUrl,
              rawText: doc.ocr?.text || '',
              text: doc.ocr?.text || '',
              proposedClassification: (doc.category as any) || 'autre',
              finalClassification: (doc.category as any) || 'autre',
              confidenceScore: doc.ocr?.confidence || 88,
              confidence: doc.ocr?.confidence || 88,
              extractedData: {
                documentNumber: doc.documentNumber,
                documentDate: doc.createdAt ? doc.createdAt.split('T')[0] : '',
                supplierName: doc.context?.supplierName,
                clientName: doc.context?.clientName,
                amountHT: doc.metadata?.amount ? doc.metadata.amount * 0.82 : 0,
                vatAmount: doc.metadata?.amount ? doc.metadata.amount * 0.18 : 0,
                amountTTC: doc.metadata?.amount || 0,
                currency: doc.metadata?.currency || 'FCFA',
                projectId: doc.context?.projectId,
                projectName: doc.context?.projectName,
                confidenceScores: {
                  documentNumber: 90,
                  documentDate: 85,
                  amounts: 92,
                  parties: 88,
                  overall: 88,
                },
              },
              engineUsed: 'gemini_vision',
              status: 'pending_validation',
              processedAt: doc.createdAt || new Date().toISOString(),
            };
            setSelectedOcrRecord(rec);
          }
        }}
        onSelectProject={(projectId) => {
          const prj = projects.find((p) => p.id === projectId);
          if (prj) {
            setSelectedProject(prj);
            setProjectDetailOpen(true);
          }
        }}
      />

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={projectDetailOpen}
        onClose={() => setProjectDetailOpen(false)}
        documents={documents}
        expenses={expenses}
        employees={employees}
        materials={materials}
        onScanForProject={handleScanForProject}
        onSelectDocument={(doc) => {
          setSelectedDoc(doc);
          setViewerOpen(true);
        }}
        onUpdateProjectProgress={handleUpdateProjectProgress}
      />

      {/* Settings & Role Switcher Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentUser={currentUser}
        onUserChanged={handleRoleChange}
        onResetData={() => {
          DataService.resetToDemoData();
          reloadData();
          showToast('Données réinitialisées avec succès.');
        }}
      />

      {/* Creation Modals */}
      <NewProjectModal
        isOpen={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onProjectCreated={(prj) => {
          reloadData();
          showToast(`Projet ${prj.code} créé avec succès.`);
        }}
      />

      <NewExpenseModal
        isOpen={newExpenseOpen}
        onClose={() => setNewExpenseOpen(false)}
        projects={projects}
        onExpenseCreated={(exp) => {
          reloadData();
          showToast(`Dépense ${exp.reference} enregistrée.`);
        }}
      />

      <NewInvoiceModal
        isOpen={newInvoiceOpen}
        onClose={() => setNewInvoiceOpen(false)}
        projects={projects}
        onInvoiceCreated={(inv) => {
          reloadData();
          showToast(`Facture ${inv.invoiceNumber} enregistrée.`);
        }}
      />

      <NewEmployeeModal
        isOpen={newEmployeeOpen}
        onClose={() => setNewEmployeeOpen(false)}
        projects={projects}
        onEmployeeCreated={(emp) => {
          reloadData();
          showToast(`Collaborateur ${emp.fullName} ajouté.`);
        }}
      />

      <NewMaterialModal
        isOpen={newMaterialOpen}
        onClose={() => setNewMaterialOpen(false)}
        projects={projects}
        onMaterialCreated={(mat) => {
          reloadData();
          showToast(`Équipement ${mat.code} (${mat.name}) ajouté au parc.`);
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => reloadData()}
      />

      {/* Screen Lock / Quick Unlock (PIN & Windows Hello) */}
      <QuickUnlockModal
        isOpen={isSessionLocked}
        currentUser={currentUser}
        onUnlock={() => {
          setIsSessionLocked(false);
          showToast('Session déverrouillée avec succès.');
        }}
        onSignOut={() => {
          setIsSessionLocked(false);
          signOutUser();
          showToast('Session fermée.');
        }}
        showToast={showToast}
      />

      {/* Notification Center Modal */}
      {notificationsOpen && (
        <NotificationCenterModal
          notifications={notifications}
          onClose={() => setNotificationsOpen(false)}
          onNavigateToModule={(mod) => {
            if (isModuleAllowedForRole(mod, currentUser.role)) {
              setCurrentModule(mod);
              setNotificationsOpen(false);
            } else {
              showToast(`Accès restreint au module ${mod.toUpperCase()} pour votre profil.`);
            }
          }}
          onRefresh={reloadData}
        />
      )}

      {/* OCR / IA Human Validation Modal */}
      {selectedOcrRecord && (
        <OcrValidationModal
          ocrRecord={selectedOcrRecord}
          onClose={() => setSelectedOcrRecord(null)}
          onValidated={(rec) => {
            reloadData();
            setSelectedOcrRecord(null);
            showToast(`Données document validées : ${rec.finalClassification || rec.proposedClassification}`);
          }}
          showToast={showToast}
        />
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[--coresi-surface] dark:bg-[--coresi-surface-elevated] border border-[--coresi-primary] dark:border-[rgba(59,122,44,0.5)] text-[--coresi-text] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs max-w-md">
          <CheckCircle2 className="w-5 h-5 text-[--coresi-primary] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
