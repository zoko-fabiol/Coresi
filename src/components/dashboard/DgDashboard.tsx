import React, { useState } from 'react';
import {
  FolderKanban,
  DollarSign,
  FileText,
  Camera,
  Users,
  Wrench,
  AlertTriangle,
  CreditCard,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle,
  Printer,
  Download,
  ShieldAlert,
  Clock,
  X,
  FileCheck,
  ChevronRight,
  ShoppingCart,
  ClipboardList,
  Compass,
  Banknote,
  BookOpen,
  MapPin,
} from 'lucide-react';
import { Project, DocumentRecord, Expense, Invoice, Employee, Material } from '../../types';
import { DataService } from '../../services/dataService';
import { AdminConfigService } from '../../services/adminConfigService';
import { useTheme } from '../../context/ThemeContext';

interface DgDashboardProps {
  projects: Project[];
  documents: DocumentRecord[];
  expenses: Expense[];
  invoices: Invoice[];
  employees: Employee[];
  materials: Material[];
  onNavigate: (module: string) => void;
  onOpenScanner: () => void;
  onSelectProject: (project: Project) => void;
  onSelectDocument: (doc: DocumentRecord) => void;
}

export const DgDashboard: React.FC<DgDashboardProps> = ({
  projects,
  documents,
  expenses,
  invoices,
  employees,
  materials,
  onNavigate,
  onOpenScanner,
  onSelectProject,
  onSelectDocument,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

  const projectsEnabled = AdminConfigService.isModuleEnabled('projects');
  const financesEnabled = AdminConfigService.isModuleEnabled('finances');
  const gedEnabled = AdminConfigService.isModuleEnabled('ged');
  const materialsEnabled = AdminConfigService.isModuleEnabled('materials');
  const scannerEnabled = AdminConfigService.isModuleEnabled('scanner');
  const hrEnabled = AdminConfigService.isModuleEnabled('hr');

  const activeProjects = projects.filter((p) => p.status === 'in_progress');
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const totalInvoiced = invoices.filter((i) => i.type === 'client').reduce((sum, i) => sum + i.totalAmount, 0);
  const totalCollected = invoices.filter((i) => i.type === 'client').reduce((sum, i) => sum + i.paidAmount, 0);
  const pendingInvoiced = totalInvoiced - totalCollected;

  const recentDocs = documents.slice(0, 5);
  const certifications = DataService.getCertifications();
  const certsExpiringSoon = certifications.filter((c) => c.status === 'expire_bientot');

  // Advanced modules live indicators
  const purchaseRequests = DataService.getPurchaseRequests();
  const pendingPurchasesCount = purchaseRequests.filter((r) => r.status === 'submitted').length;

  const workOrdersList = DataService.getWorkOrders();
  const activeWorkOrdersCount = workOrdersList.filter((w) => w.status !== 'cloture').length;

  const missionsList = DataService.getMissions();
  const activeMissionsCount = missionsList.filter((m) => m.status === 'approuvee_dg' || m.status === 'en_cours').length;

  const payrollPeriodsList = DataService.getPayrollPeriods();
  const currentPayPeriod = payrollPeriodsList[payrollPeriodsList.length - 1];

  const journalEntriesList = DataService.getJournalEntries();
  const pendingEntriesCount = journalEntriesList.filter((j) => j.status === 'soumise').length;

  const sitesList = DataService.getSites();

  // Critical alerts calculation
  const budgetAlertProjects = projects.filter((p) => p.spent > p.budget * 0.85 && p.progress < 70);
  const overdueInvoices = invoices.filter((i) => i.status !== 'paye' && new Date(i.dueDate) < new Date());

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome & Quick Action Hero */}
      <div className="module-header-gradient p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all shadow-sm dark:shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-green-800 dark:text-green-300 shadow-xs backdrop-blur-xs">
            <span className="badge-live w-2 h-2 rounded-full bg-emerald-500 text-emerald-500 shrink-0" />
            CORESI INTERNATIONAL SARL • Direction Générale
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
            Supervision Opérationnelle &amp; GED Industrielle
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Centralisation des chantiers (chaudronnerie, tuyauterie, génie civil), traçabilité documentaire intelligente avec scanner OCR et contrôle financier en temps réel.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setReportModalOpen(true)}
            className="w-full sm:w-auto px-4 py-3 font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer bg-white/90 hover:bg-slate-50 text-slate-800 border border-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 shadow-xs active:scale-95"
          >
            <Printer className="w-4 h-4 text-green-700 dark:text-green-400" />
            <span className="font-semibold">Rapport Exécutif DG</span>
          </button>

          {scannerEnabled && (
            <button
              onClick={onOpenScanner}
              className="scanner-btn-glow w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span>Numériser un Document</span>
            </button>
          )}
        </div>

        {/* Ambient orb decorations */}
        <div className="ambient-orb w-80 h-80 bg-green-600/10 right-0 top-0 blur-[60px]" />
        <div className="ambient-orb w-48 h-48 bg-orange-500/10 right-40 bottom-0 blur-[40px]" />
      </div>

      {/* Industrial Priority Alerts Banner (Point 8) */}
      {(certsExpiringSoon.length > 0 || budgetAlertProjects.length > 0 || overdueInvoices.length > 0) && (
        <div className="alert-pulse-border p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/30 text-slate-800 dark:text-slate-200 shadow-sm backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl shrink-0 bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <p className="font-bold text-amber-700 dark:text-amber-400">
                Vigilance &amp; Alertes Opérationnelles
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                {certsExpiringSoon.length > 0 && hrEnabled && (
                  <span className="inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{certsExpiringSoon.length} qualification(s) ou visite(s) médicale(s) arrivant à échéance (&lt;30j).</span>
                  </span>
                )}
                {overdueInvoices.length > 0 && financesEnabled && (
                  <span className="inline-flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{overdueInvoices.length} facture(s) en attente de règlement échue(s).</span>
                  </span>
                )}
                {budgetAlertProjects.length > 0 && projectsEnabled && (
                  <span className="inline-flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{budgetAlertProjects.length} chantier(s) sous tension budgétaire (&gt;85% consommé).</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {hrEnabled && (
            <button
              onClick={() => onNavigate('hr')}
              className="px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all cursor-pointer bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 active:scale-95 text-xs"
            >
              Vérifier Habilitations
            </button>
          )}
        </div>
      )}

      {/* Top Bento-Grid KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects */}
        {projectsEnabled && (
          <div
            onClick={() => onNavigate('projects')}
            className="kpi-card bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl cursor-pointer flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Chantiers en cours</span>
              <span className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <FolderKanban className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="kpi-number text-3xl font-black text-slate-900 dark:text-white mb-1">{activeProjects.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Budget : <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{(totalBudget / 1000000).toFixed(1)} M FCFA</span>
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-green-700 dark:text-green-400 font-bold">
              <span>Voir les chantiers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Invoiced & Cashflow */}
        {financesEnabled && (
          <div
            onClick={() => onNavigate('finances')}
            className="kpi-card bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl cursor-pointer flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Facturation Client</span>
              <span className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="kpi-number text-2xl font-black text-slate-900 dark:text-white mb-1">
                {(totalInvoiced / 1000000).toFixed(1)} M FCFA
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                Encaissé : {(totalCollected / 1000000).toFixed(1)} M
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              <span>Reste : {(pendingInvoiced / 1000000).toFixed(1)} M FCFA</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* GED Electronic Documents */}
        {gedEnabled && (
          <div
            onClick={() => onNavigate('ged')}
            className="kpi-card bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl cursor-pointer flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
              <span className="font-semibold uppercase tracking-wider text-[10px]">GED &amp; Documents</span>
              <span className="p-2 bg-green-600/10 text-green-700 dark:text-green-400 rounded-xl">
                <FileText className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="kpi-number text-3xl font-black text-slate-900 dark:text-white mb-1">{documents.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">100% indexés OCR &amp; Cloudinary</p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-green-700 dark:text-green-400 font-bold">
              <span>Archives GED</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Staff & Equipment Deployment */}
        {(hrEnabled || materialsEnabled) && (
          <div
            onClick={() => onNavigate(hrEnabled ? 'hr' : 'materials')}
            className="kpi-card bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl cursor-pointer flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Main-d&apos;Œuvre &amp; Matériel</span>
              <span className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="kpi-number text-3xl font-black text-slate-900 dark:text-white mb-1">{employees.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {materials.filter((m) => m.status === 'assigne').length} engins déployés
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
              <span>Gérer le personnel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* Advanced Modules Operational Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>Pilotage Intégré des Opérations &amp; Chantiers</span>
            <span className="text-[10px] bg-green-50 text-green-800 dark:bg-green-950/80 dark:text-green-300 px-2.5 py-0.5 rounded-full font-mono font-bold border border-green-200 dark:border-green-800">
              9 Modules Connectés
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Achats */}
          <div
            onClick={() => onNavigate('purchases')}
            className="card-hover-modern bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold truncate">Achats &amp; DA</span>
              <ShoppingCart className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {pendingPurchasesCount}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">DA à valider</p>
            </div>
          </div>

          {/* 2. GMAO */}
          <div
            onClick={() => onNavigate('maintenance')}
            className="card-hover-modern bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold truncate">GMAO Parc</span>
              <Wrench className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {activeWorkOrdersCount}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">OT en cours</p>
            </div>
          </div>

          {/* 3. Missions */}
          <div
            onClick={() => onNavigate('missions')}
            className="card-hover-modern bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold truncate">Missions</span>
              <Compass className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {activeMissionsCount}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">En déplacement</p>
            </div>
          </div>

          {/* 4. Paie */}
          <div
            onClick={() => onNavigate('payroll')}
            className="card-hover-modern bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold truncate">Paie RH</span>
              <Banknote className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            </div>
            <div>
              <p className="text-lg font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                {currentPayPeriod ? (currentPayPeriod.totalNet / 1000000).toFixed(1) + 'M' : 'Prête'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Net {currentPayPeriod?.periodKey || '2026-09'}</p>
            </div>
          </div>

          {/* 5. Comptabilité */}
          <div
            onClick={() => onNavigate('accounting')}
            className="card-hover-modern bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold truncate">Comptabilité</span>
              <BookOpen className="w-3.5 h-3.5 text-teal-500 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {pendingEntriesCount}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Écritures soumises</p>
            </div>
          </div>

          {/* 6. Multi-Sites */}
          <div
            onClick={() => onNavigate('sites')}
            className="card-hover-modern bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold truncate">Multi-Sites</span>
              <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {sitesList.length}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Bases &amp; Chantiers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Projects Overview vs Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Projects Progress & Financial Health */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Chantiers Actifs &amp; Consommation Budgétaire</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avancement physique comparé aux dépenses enregistrées</p>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs text-green-700 dark:text-green-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Tous les projets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {activeProjects.map((prj) => {
              const spentRatio = Math.min(100, Math.round((prj.spent / prj.budget) * 100));

              return (
                <div
                  key={prj.id}
                  onClick={() => onSelectProject(prj)}
                  className="bg-slate-50/70 dark:bg-slate-950/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/80 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                          {prj.code}
                        </span>
                        <span className="text-[11px] capitalize text-slate-500 dark:text-slate-400 font-medium">
                          {prj.category.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white hover:text-green-700 dark:hover:text-green-400 transition-colors">
                        {prj.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{prj.clientName} • {prj.location}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-green-700 dark:text-green-400">{prj.progress}% réalisé</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {prj.spent.toLocaleString('fr-FR')} / {prj.budget.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>

                  {/* Dual progress bar: Physical Progress vs Financial spent */}
                  <div className="space-y-1.5 mt-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-600 to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${prj.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>Avancement physique ({prj.progress}%)</span>
                      <span className={spentRatio > 90 ? 'text-amber-500 font-bold' : ''}>
                        Budget engagé : {spentRatio}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recent Scanned Documents Feed */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Derniers Scans GED</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Documents traités par l'OCR</p>
              </div>
              <button
                onClick={onOpenScanner}
                className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs cursor-pointer transition-all active:scale-95"
                title="Numériser"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc)}
                  className="p-2.5 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <img
                    src={doc.cloudinary.secureUrl}
                    alt=""
                    className="w-10 h-13 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 group-hover:border-green-600 transition-colors"
                  />
                  <div className="overflow-hidden flex-1">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                      {doc.title}
                    </p>
                    <p className="font-mono text-[10px] text-green-700 dark:text-green-400 font-bold">{doc.documentNumber}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">
                      {doc.context.projectName || doc.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('ged')}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <span>Ouvrir toute la GED</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Executive Report Modal (Point 8) */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[--coresi-surface] border border-[--coresi-border] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[--coresi-text] text-xs max-h-[90vh]">
            <div className="bg-[--coresi-surface-alt] px-6 py-4 border-b border-[--coresi-border] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[--coresi-primary-50] dark:bg-[--coresi-primary-900]/40 text-[--coresi-primary] rounded-lg">
                  <Printer className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-[--coresi-text]">Rapport Synthétique Exécutif - CORESI INTERNATIONAL SARL</h3>
                  <p className="text-[--coresi-text-muted]">Direction Générale • Généré en temps réel le {new Date().toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReport}
                  className="px-3.5 py-1.5 bg-[--coresi-primary] hover:bg-[--coresi-primary-light] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer / Exporter PDF</span>
                </button>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="p-1.5 hover:bg-[--coresi-surface-hover] text-[--coresi-text-muted] hover:text-[--coresi-text] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Header Company Details */}
              <div className="border-b border-[--coresi-border] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[--coresi-text]">CORESI INTERNATIONAL SARL</h2>
                  <p className="text-xs text-[--coresi-text-secondary]">Ingénierie, Tuyauterie Industrielle, Chaudronnerie &amp; Maintenance</p>
                  <p className="text-[11px] text-[--coresi-text-muted]">Pointe-Noire, République du Congo</p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-[--coresi-primary] font-bold">DIRECTION GÉNÉRALE</span>
                  <p className="text-[--coresi-text-secondary]">Dr. Joseph Ndoundo</p>
                </div>
              </div>

              {/* Financial Recap Table */}
              <div>
                <h4 className="font-bold text-sm text-[--coresi-text] mb-2">1. Synthèse Financière &amp; Trésorerie</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[--coresi-surface-alt] p-4 rounded-xl border border-[--coresi-border]">
                  <div>
                    <span className="text-[--coresi-text-muted] block">Facturation Totale</span>
                    <strong className="text-[--coresi-text] font-mono text-sm">{totalInvoiced.toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                  <div>
                    <span className="text-[--coresi-text-muted] block">Encaissé Client</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">{totalCollected.toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                  <div>
                    <span className="text-[--coresi-text-muted] block">Créances en cours</span>
                    <strong className="text-[--coresi-secondary] font-mono text-sm">{pendingInvoiced.toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                  <div>
                    <span className="text-[--coresi-text-muted] block">Dépenses Opérationnelles</span>
                    <strong className="text-red-700 dark:text-red-400 font-mono text-sm">{totalSpent.toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                </div>
              </div>

              {/* Projects Table */}
              <div>
                <h4 className="font-bold text-sm text-[--coresi-text] mb-2">2. État d'Avancement des Projets &amp; Chantiers</h4>
                <table className="w-full text-xs text-left bg-[--coresi-surface-alt] rounded-xl overflow-hidden border border-[--coresi-border]">
                  <thead className="bg-[--coresi-surface-hover] border-b border-[--coresi-border] text-[--coresi-text-secondary]">
                    <tr>
                      <th className="py-2.5 px-3">Réf</th>
                      <th className="py-2.5 px-3">Projet</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Budget Prévu</th>
                      <th className="py-2.5 px-3">Dépenses Réelles</th>
                      <th className="py-2.5 px-3">Avancement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[--coresi-border]">
                    {projects.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 font-mono font-bold text-[--coresi-primary]">{p.code}</td>
                        <td className="py-2 px-3 text-[--coresi-text] font-medium">{p.name}</td>
                        <td className="py-2 px-3 text-[--coresi-text-secondary]">{p.clientName}</td>
                        <td className="py-2 px-3 font-mono text-[--coresi-text]">{p.budget.toLocaleString('fr-FR')} FCFA</td>
                        <td className="py-2 px-3 font-mono text-[--coresi-text-secondary]">{p.spent.toLocaleString('fr-FR')} FCFA</td>
                        <td className="py-2 px-3 font-mono font-bold text-[--coresi-secondary]">{p.progress}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resources Summary */}
              <div>
                <h4 className="font-bold text-sm text-[--coresi-text] mb-2">3. Situation des Ressources Humaines &amp; Parc Matériel</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[--coresi-surface-alt] p-4 rounded-xl border border-[--coresi-border]">
                  <div>
                    <span className="font-semibold text-[--coresi-text] block mb-1">Ressources Humaines :</span>
                    <p className="text-[--coresi-text-secondary]">• Collaborateurs actifs : {employees.filter((e) => e.status === 'actif').length}</p>
                    <p className="text-[--coresi-text-secondary]">• Collaborateurs en mission chantier : {employees.filter((e) => e.assignedProjectId).length}</p>
                    <p className="text-[--coresi-text-secondary]">• Collaborateurs archivés : {employees.filter((e) => e.status === 'archive').length}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-[--coresi-text] block mb-1">Parc Outillage &amp; Matériel :</span>
                    <p className="text-[--coresi-text-secondary]">• Total machines enregistrées : {materials.length}</p>
                    <p className="text-[--coresi-text-secondary]">• Machines déployées sur chantiers : {materials.filter((m) => m.status === 'assigne').length}</p>
                    <p className="text-[--coresi-text-secondary]">• Machines disponibles en base : {materials.filter((m) => m.status === 'disponible').length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
