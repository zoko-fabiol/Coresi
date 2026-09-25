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
    <div className="space-y-6">
      {/* Welcome & Quick Action Hero */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
          isLight
            ? 'bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-indigo-50/80 border-blue-200/80 shadow-sm'
            : 'bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 border-slate-800 shadow-xl'
        }`}
      >
        <div className="relative z-10 max-w-2xl">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
              isLight
                ? 'bg-white border border-blue-200 text-blue-900 shadow-xs'
                : 'bg-cyan-950/80 border border-cyan-800 text-cyan-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            CORESI INTERNATIONAL SARL • Direction Générale
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
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
            className={`w-full sm:w-auto px-4 py-3 font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
            }`}
          >
            <Printer className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
            <span className="text-slate-900 dark:text-cyan-300 font-semibold">Rapport Exécutif DG</span>
          </button>

          {scannerEnabled && (
            <button
              onClick={onOpenScanner}
              className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-transform active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-slate-950" />
              <span>Numériser un Document</span>
            </button>
          )}
        </div>

        {/* Subtle background decoration */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Industrial Priority Alerts Banner (Point 8) */}
      {(certsExpiringSoon.length > 0 || budgetAlertProjects.length > 0 || overdueInvoices.length > 0) && (
        <div
          className={`p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border ${
            isLight
              ? 'bg-amber-50/90 border-amber-200 text-amber-950 shadow-sm'
              : 'bg-amber-950/40 border-amber-800/60 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-xl shrink-0 ${isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400'}`}>
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <p className={`font-bold ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                Vigilance &amp; Alertes Opérationnelles
              </p>
              <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-0.5 text-[11px] ${isLight ? 'text-amber-800 font-medium' : 'text-slate-300'}`}>
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
                    <BarChart3 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{budgetAlertProjects.length} chantier(s) sous tension budgétaire (&gt;85% consommé).</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {hrEnabled && (
            <button
              onClick={() => onNavigate('hr')}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors ${
                isLight
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
              }`}
            >
              Vérifier Habilitations
            </button>
          )}
        </div>
      )}

      {/* Top KPI Cards (filtered dynamically by active modules) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects */}
        {projectsEnabled && (
          <div
            onClick={() => onNavigate('projects')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 p-5 rounded-2xl shadow-sm cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-medium">Chantiers en cours</span>
              <span className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl">
                <FolderKanban className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mb-1">{activeProjects.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Budget total : {(totalBudget / 1000000).toFixed(1)} M FCFA
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-blue-700 dark:text-cyan-400 font-semibold">
              <span>Voir les chantiers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Invoiced & Cashflow */}
        {financesEnabled && (
          <div
            onClick={() => onNavigate('finances')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 p-5 rounded-2xl shadow-sm cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-medium">Facturation Client</span>
              <span className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mb-1">
                {(totalInvoiced / 1000000).toFixed(1)} M FCFA
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                Encaissé : {(totalCollected / 1000000).toFixed(1)} M FCFA
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
              <span>Reste à percevoir : {(pendingInvoiced / 1000000).toFixed(1)} M</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* GED Electronic Documents */}
        {gedEnabled && (
          <div
            onClick={() => onNavigate('ged')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 p-5 rounded-2xl shadow-sm cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-medium">GED &amp; Documents Scannés</span>
              <span className="p-2 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 rounded-xl">
                <FileText className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mb-1">{documents.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">100% indexés OCR &amp; Cloudinary</p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-700 dark:text-cyan-400 font-semibold">
              <span>Consulter les archives GED</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Staff & Equipment Deployment */}
        {(hrEnabled || materialsEnabled) && (
          <div
            onClick={() => onNavigate(hrEnabled ? 'hr' : 'materials')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/60 p-5 rounded-2xl shadow-sm cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-medium">Main-d'Œuvre &amp; Matériel</span>
              <span className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-xl">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div>
            <p className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mb-1">{employees.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {materials.filter((m) => m.status === 'assigne').length} engins déployés sur site
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-purple-700 dark:text-purple-400 font-semibold">
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
            <span className="text-[10px] bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 px-2 py-0.5 rounded-full font-bold border border-cyan-300 dark:border-cyan-800">
              9 Modules Connectés
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Achats */}
          <div
            onClick={() => onNavigate('purchases')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold truncate">Achats &amp; DA</span>
              <ShoppingCart className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {pendingPurchasesCount}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">DA à valider</p>
            </div>
          </div>

          {/* 2. GMAO */}
          <div
            onClick={() => onNavigate('maintenance')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold truncate">GMAO Parc</span>
              <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {activeWorkOrdersCount}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">OT en cours</p>
            </div>
          </div>

          {/* 3. Missions */}
          <div
            onClick={() => onNavigate('missions')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold truncate">Missions</span>
              <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {activeMissionsCount}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">En déplacement</p>
            </div>
          </div>

          {/* 4. Paie */}
          <div
            onClick={() => onNavigate('payroll')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold truncate">Paie RH</span>
              <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {currentPayPeriod ? (currentPayPeriod.totalNet / 1000000).toFixed(1) + 'M' : 'Prête'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Net {currentPayPeriod?.periodKey || '2026-09'}</p>
            </div>
          </div>

          {/* 5. Comptabilité */}
          <div
            onClick={() => onNavigate('accounting')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/60 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold truncate">Comptabilité</span>
              <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {pendingEntriesCount}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Écritures soumises</p>
            </div>
          </div>

          {/* 6. Multi-Sites */}
          <div
            onClick={() => onNavigate('sites')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold truncate">Multi-Sites</span>
              <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {sitesList.length}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Bases &amp; Chantiers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Projects Overview vs Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Projects Progress & Financial Health */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Chantiers Actifs &amp; Consommation Budgétaire</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Avancement physique comparé aux dépenses enregistrées</p>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs text-cyan-700 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1"
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
                  className="bg-slate-50/70 hover:bg-slate-100/80 dark:bg-slate-950 dark:hover:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-900 text-cyan-800 dark:text-cyan-400 border border-slate-300 dark:border-slate-800">
                          {prj.code}
                        </span>
                        <span className="text-[11px] capitalize text-slate-600 dark:text-slate-300 font-medium">
                          {prj.category.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors">
                        {prj.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{prj.clientName} • {prj.location}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">{prj.progress}% réalisé</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {prj.spent.toLocaleString('fr-FR')} / {prj.budget.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>

                  {/* Dual progress bar: Physical Progress vs Financial spent */}
                  <div className="space-y-1 mt-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-300 dark:border-slate-800">
                      <div
                        className="bg-cyan-600 dark:bg-cyan-500 h-2 rounded-full"
                        style={{ width: `${prj.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Avancement physique ({prj.progress}%)</span>
                      <span className={spentRatio > 90 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}>
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Derniers Scans GED</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Documents traités par l'OCR</p>
              </div>
              <button
                onClick={onOpenScanner}
                className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30 rounded-lg text-xs"
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
                  className="p-2.5 bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl cursor-pointer transition-all flex items-center gap-3"
                >
                  <img
                    src={doc.cloudinary.secureUrl}
                    alt=""
                    className="w-10 h-13 object-cover rounded border border-slate-300 dark:border-slate-700 shrink-0"
                  />
                  <div className="overflow-hidden flex-1">
                    <p className="font-semibold text-xs text-slate-900 dark:text-white truncate hover:text-cyan-700 dark:hover:text-cyan-300">
                      {doc.title}
                    </p>
                    <p className="font-mono text-[10px] text-cyan-700 dark:text-cyan-300 font-semibold">{doc.documentNumber}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {doc.context.projectName || doc.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('ged')}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-transparent rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Ouvrir toute la GED</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Executive Report Modal (Point 8) */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 text-xs max-h-[90vh]">
            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-400 rounded-lg">
                  <Printer className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Rapport Synthétique Exécutif - CORESI INTERNATIONAL SARL</h3>
                  <p className="text-slate-500 dark:text-slate-400">Direction Générale • Généré en temps réel le {new Date().toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReport}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer / Exporter PDF</span>
                </button>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Header Company Details */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">CORESI INTERNATIONAL SARL</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Ingénierie, Tuyauterie Industrielle, Chaudronnerie &amp; Maintenance</p>
                  <p className="text-[11px] text-slate-500">Pointe-Noire, République du Congo</p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-cyan-700 dark:text-cyan-400 font-bold">DIRECTION GÉNÉRALE</span>
                  <p className="text-slate-600 dark:text-slate-400">Dr. Joseph Ndoundo</p>
                </div>
              </div>

              {/* Financial Recap Table */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">1. Synthèse Financière &amp; Trésorerie</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Facturation Totale</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">{totalInvoiced.toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Encaissé Client</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">{totalCollected.toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Créances en cours</span>
                    <strong className="text-amber-700 dark:text-amber-400 font-mono text-sm">{pendingInvoiced.toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Dépenses Opérationnelles</span>
                    <strong className="text-red-700 dark:text-red-400 font-mono text-sm">{totalSpent.toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                </div>
              </div>

              {/* Projects Table */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">2. État d'Avancement des Projets &amp; Chantiers</h4>
                <table className="w-full text-xs text-left bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Réf</th>
                      <th className="py-2.5 px-3">Projet</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Budget Prévu</th>
                      <th className="py-2.5 px-3">Dépenses Réelles</th>
                      <th className="py-2.5 px-3">Avancement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {projects.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 font-mono font-bold text-cyan-700 dark:text-cyan-300">{p.code}</td>
                        <td className="py-2 px-3 text-slate-900 dark:text-white font-medium">{p.name}</td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{p.clientName}</td>
                        <td className="py-2 px-3 font-mono text-slate-900 dark:text-white">{p.budget.toLocaleString('fr-FR')} FCFA</td>
                        <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">{p.spent.toLocaleString('fr-FR')} FCFA</td>
                        <td className="py-2 px-3 font-mono font-bold text-cyan-700 dark:text-cyan-400">{p.progress}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resources Summary */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">3. Situation des Ressources Humaines &amp; Parc Matériel</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block mb-1">Ressources Humaines :</span>
                    <p className="text-slate-700 dark:text-slate-300">• Collaborateurs actifs : {employees.filter((e) => e.status === 'actif').length}</p>
                    <p className="text-slate-700 dark:text-slate-300">• Collaborateurs en mission chantier : {employees.filter((e) => e.assignedProjectId).length}</p>
                    <p className="text-slate-700 dark:text-slate-300">• Collaborateurs archivés : {employees.filter((e) => e.status === 'archive').length}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block mb-1">Parc Outillage &amp; Matériel :</span>
                    <p className="text-slate-700 dark:text-slate-300">• Total machines enregistrées : {materials.length}</p>
                    <p className="text-slate-700 dark:text-slate-300">• Machines déployées sur chantiers : {materials.filter((m) => m.status === 'assigne').length}</p>
                    <p className="text-slate-700 dark:text-slate-300">• Machines disponibles en base : {materials.filter((m) => m.status === 'disponible').length}</p>
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
