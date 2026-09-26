import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Camera,
  FileCheck,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Building,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  Eye,
  Wallet,
  PiggyBank,
  UserCheck,
  AlertOctagon,
  X,
  Scale,
} from 'lucide-react';
import { Expense, Invoice, DocumentRecord, Project, SalaryAdvance, FinancialLoss, CashMovement } from '../../types';
import { DataService } from '../../services/dataService';
import { DetailSidebar, SidebarSection, SidebarField, SidebarStatusBadge, SidebarDivider } from '../shared/DetailSidebar';
import { FiscalObligationsTab } from './FiscalObligationsTab';

interface FinanceModuleProps {
  expenses: Expense[];
  invoices: Invoice[];
  projects: Project[];
  documents: DocumentRecord[];
  onOpenScannerForFinance: (type: 'facture' | 'depense') => void;
  onSelectDocument: (doc: DocumentRecord) => void;
  onNewExpense: () => void;
  onNewInvoice: () => void;
  onRefresh: () => void;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  expenses,
  invoices,
  projects,
  documents,
  onOpenScannerForFinance,
  onSelectDocument,
  onNewExpense,
  onNewInvoice,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'caisse_banque' | 'avances' | 'pertes' | 'fiscalite'>('invoices');

  // DetailSidebar selection state for all rows
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedCashMove, setSelectedCashMove] = useState<CashMovement | null>(null);
  const [selectedAdvance, setSelectedAdvance] = useState<SalaryAdvance | null>(null);
  const [selectedLoss, setSelectedLoss] = useState<FinancialLoss | null>(null);

  const salaryAdvances = DataService.getSalaryAdvances();
  const financialLosses = DataService.getFinancialLosses();
  const cashMovements = DataService.getCashMovements();
  const fiscalObligations = DataService.getFiscalObligations();

  // Modals for Advances and Losses
  const [newAdvanceOpen, setNewAdvanceOpen] = useState<boolean>(false);
  const [advanceEmpName, setAdvanceEmpName] = useState<string>('Moussa Traoré');
  const [advanceAmount, setAdvanceAmount] = useState<number>(250000);
  const [advanceReason, setAdvanceReason] = useState<string>('');
  const [advanceRepay, setAdvanceRepay] = useState<'retenue_salaire' | 'especes' | 'virement'>('retenue_salaire');

  const [newLossOpen, setNewLossOpen] = useState<boolean>(false);
  const [lossAmount, setLossAmount] = useState<number>(500000);
  const [lossCause, setLossCause] = useState<any>('rebut_matiere');
  const [lossProject, setLossProject] = useState<string>(projects[0]?.id || '');
  const [lossDesc, setLossDesc] = useState<string>('');

  const totalInvoiced = invoices.filter((i) => i.type === 'client').reduce((sum, i) => sum + i.totalAmount, 0);
  const totalCollected = invoices.filter((i) => i.type === 'client').reduce((sum, i) => sum + i.paidAmount, 0);
  const pendingInvoiced = totalInvoiced - totalCollected;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Bank & Cash Balances
  const cashBalance = 2450000;
  const bankBalance = 62600000;

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAdv: SalaryAdvance = {
      id: `adv-${Date.now()}`,
      employeeId: `emp-${Date.now()}`,
      employeeName: advanceEmpName,
      amount: advanceAmount,
      currency: 'FCFA',
      requestDate: new Date().toISOString().split('T')[0],
      reason: advanceReason || 'Avance sur salaire pour mission chantier',
      status: 'accordee',
      repaymentMode: advanceRepay,
      justificationNotes: `Remboursement par ${advanceRepay.replace('_', ' ')}`,
      approvedBy: DataService.getCurrentUser().displayName,
    };
    await DataService.saveSalaryAdvance(newAdv);
    onRefresh();
    setNewAdvanceOpen(false);
  };

  const handleCreateLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    const prj = projects.find((p) => p.id === lossProject);
    const newLoss: FinancialLoss = {
      id: `loss-${Date.now()}`,
      reference: `PERTE-2026-0${Math.floor(10 + Math.random() * 90)}`,
      projectId: lossProject,
      projectName: prj?.name,
      amount: lossAmount,
      currency: 'FCFA',
      cause: lossCause,
      description: lossDesc || `Perte / rebut de chantier constaté sur ${prj?.name || 'chantier'}`,
      date: new Date().toISOString().split('T')[0],
      recordedBy: DataService.getCurrentUser().displayName,
    };
    await DataService.saveFinancialLoss(newLoss);
    onRefresh();
    setNewLossOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Gestion Financière, Caisse &amp; Trésorerie
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Encaissements, dépenses par projet, caisse espèces, banques, avances au personnel et suivi des pertes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenScannerForFinance('facture')}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-transform active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Scanner Facture</span>
          </button>
          <button
            onClick={() => onOpenScannerForFinance('depense')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Scanner Justificatif</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Facturation Client (Ventes)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {totalInvoiced.toLocaleString('fr-FR')} FCFA
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            Encaissé : {totalCollected.toLocaleString('fr-FR')} FCFA
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Factures Impayées / En attente</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {pendingInvoiced.toLocaleString('fr-FR')} FCFA
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Créances à recouvrer</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Dépenses Totales Opérations</span>
            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {totalExpenses.toLocaleString('fr-FR')} FCFA
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{expenses.length} dépenses avec justificatifs</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Trésorerie Disponible (Banque + Caisse)</span>
            <Wallet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-cyan-700 dark:text-cyan-400">
            {(bankBalance + cashBalance).toLocaleString('fr-FR')} FCFA
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Banque: {(bankBalance / 1000000).toFixed(1)}M • Caisse: {(cashBalance / 1000).toFixed(0)}k
          </span>
        </div>
      </div>

      {/* 5-Tabs Navigation */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-xs shadow-xs">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'invoices' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Factures Clients &amp; Fournisseurs ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'expenses' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Dépenses &amp; Achats ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('caisse_banque')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'caisse_banque' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Caisse &amp; Banques ({cashMovements.length})
        </button>
        <button
          onClick={() => setActiveTab('avances')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'avances' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Avances au Personnel ({salaryAdvances.length})
        </button>
        <button
          onClick={() => setActiveTab('pertes')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'pertes' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Pertes &amp; Rebuts ({financialLosses.length})
        </button>
        <button
          onClick={() => setActiveTab('fiscalite')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'fiscalite' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Fiscalité &amp; Quittances ({fiscalObligations.length})</span>
        </button>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Registre des Factures Émises &amp; Reçues</h3>
            <button
              onClick={onNewInvoice}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer une Facture</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">N° Facture</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Partenaire</th>
                  <th className="py-3 px-4">Projet Chantier</th>
                  <th className="py-3 px-4">Échéance</th>
                  <th className="py-3 px-4">Montant Total</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Justificatif Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoices.map((inv) => {
                  const linkedDoc = documents.find((d) => d.id === inv.documentId || d.documentNumber === inv.invoiceNumber);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300 group-hover:text-cyan-200">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 uppercase text-[10px] font-semibold text-slate-300">
                        {inv.type === 'client' ? 'Client (Vente)' : 'Fournisseur (Achat)'}
                      </td>
                      <td className="py-3 px-4 font-medium text-white group-hover:text-cyan-100">{inv.partyName}</td>
                      <td className="py-3 px-4 text-slate-400">{inv.projectName || '-'}</td>
                      <td className="py-3 px-4 text-slate-400">{inv.dueDate}</td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {inv.totalAmount.toLocaleString('fr-FR')} {inv.currency}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            inv.status === 'paye'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : inv.status === 'partiel'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {inv.status === 'paye' ? 'Payé' : inv.status === 'partiel' ? 'Partiel' : 'En attente'}
                        </span>
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        {linkedDoc ? (
                          <button
                            onClick={() => onSelectDocument(linkedDoc)}
                            className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Voir GED</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenScannerForFinance('facture')}
                            className="text-slate-500 hover:text-amber-400 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Numériser</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Dépenses Opérationnelles &amp; Pièces Justificatives</h3>
            <button
              onClick={onNewExpense}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvelle Dépense</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Réf Dépense</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Désignation</th>
                  <th className="py-3 px-4">Chantier / Projet</th>
                  <th className="py-3 px-4">Fournisseur</th>
                  <th className="py-3 px-4">Montant</th>
                  <th className="py-3 px-4">Règlement</th>
                  <th className="py-3 px-4">Justificatif Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {expenses.map((exp) => {
                  const linkedDoc = documents.find((d) => d.id === exp.documentId);

                  return (
                    <tr
                      key={exp.id}
                      onClick={() => setSelectedExpense(exp)}
                      className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300 group-hover:text-cyan-200">{exp.reference}</td>
                      <td className="py-3 px-4 capitalize text-slate-300">{exp.category.replace('_', ' ')}</td>
                      <td className="py-3 px-4 font-medium text-white group-hover:text-cyan-100">{exp.description}</td>
                      <td className="py-3 px-4 text-slate-400">{exp.projectName}</td>
                      <td className="py-3 px-4 text-slate-300">{exp.supplierName || '-'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {exp.amount.toLocaleString('fr-FR')} {exp.currency}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-400">{exp.paymentMethod.replace('_', ' ')}</td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        {linkedDoc ? (
                          <button
                            onClick={() => onSelectDocument(linkedDoc)}
                            className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Voir GED</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenScannerForFinance('depense')}
                            className="text-slate-500 hover:text-amber-400 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Numériser</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CAISSE & BANQUES */}
      {activeTab === 'caisse_banque' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Caisse Espèces Siège</span>
              <p className="text-2xl font-mono font-bold text-white">
                {cashBalance.toLocaleString('fr-FR')} FCFA
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Dépenses urgentes &amp; carburant chantier</p>
            </div>
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Banque Société Générale (SGC)</span>
              <p className="text-2xl font-mono font-bold text-cyan-400">
                33 700 000 FCFA
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Compte principal opérations pétrolières</p>
            </div>
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Banque Ecobank Congo</span>
              <p className="text-2xl font-mono font-bold text-emerald-400">
                28 900 000 FCFA
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Compte secondaire grands marchés</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Relevé des Mouvements de Trésorerie</h3>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Compte</th>
                  <th className="py-3 px-4">Libellé de l'opération</th>
                  <th className="py-3 px-4">Référence</th>
                  <th className="py-3 px-4">Sens</th>
                  <th className="py-3 px-4">Montant</th>
                  <th className="py-3 px-4">Solde Résultant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {cashMovements.map((move) => (
                  <tr
                    key={move.id}
                    onClick={() => setSelectedCashMove(move)}
                    className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 text-slate-400">{move.date}</td>
                    <td className="py-3 px-4 capitalize font-medium text-slate-300">
                      {move.account.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-white font-medium group-hover:text-cyan-200">{move.label}</td>
                    <td className="py-3 px-4 font-mono text-cyan-300">{move.reference}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          move.direction === 'entree'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {move.direction === 'entree' ? '+ Entrée' : '- Sortie'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={move.direction === 'entree' ? 'text-emerald-400' : 'text-red-400'}>
                        {move.amount.toLocaleString('fr-FR')} {move.currency}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {move.balanceAfter ? `${move.balanceAfter.toLocaleString('fr-FR')} FCFA` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AVANCES AU PERSONNEL */}
      {activeTab === 'avances' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Suivi des Avances &amp; Prêts Accordés aux Employés</h3>
                <p className="text-xs text-slate-400">Modalités de remboursement et pièces justificatives des dépenses</p>
              </div>
              <button
                onClick={() => setNewAdvanceOpen(true)}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Accorder une Avance</span>
              </button>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Employé</th>
                  <th className="py-3 px-4">Montant Avancé</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Motif / Déplacement</th>
                  <th className="py-3 px-4">Remboursement</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Justification &amp; Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {salaryAdvances.map((adv) => (
                  <tr
                    key={adv.id}
                    onClick={() => setSelectedAdvance(adv)}
                    className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-semibold text-white group-hover:text-cyan-200">{adv.employeeName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {adv.amount.toLocaleString('fr-FR')} {adv.currency}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{adv.requestDate}</td>
                    <td className="py-3 px-4 text-slate-300">{adv.reason}</td>
                    <td className="py-3 px-4 capitalize text-slate-300">{adv.repaymentMode.replace('_', ' ')}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          adv.status === 'justifiee'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {adv.status === 'justifiee' ? 'Justifiée 100%' : 'Accordée / En cours'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{adv.justificationNotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PERTES & REBUTS */}
      {activeTab === 'pertes' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Registre des Pertes Financières &amp; Rebuts de Chantier</h3>
                <p className="text-xs text-slate-400">Chutes de tuyauterie, avaries outillage, intempéries ou pénalités</p>
              </div>
              <button
                onClick={() => setNewLossOpen(true)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Déclarer une Perte</span>
              </button>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Réf</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Chantier / Projet</th>
                  <th className="py-3 px-4">Cause / Typologie</th>
                  <th className="py-3 px-4">Montant Perte</th>
                  <th className="py-3 px-4">Description Détaillée</th>
                  <th className="py-3 px-4">Constaté par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {financialLosses.map((loss) => (
                  <tr
                    key={loss.id}
                    onClick={() => setSelectedLoss(loss)}
                    className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-red-400 group-hover:text-red-300">{loss.reference}</td>
                    <td className="py-3 px-4 text-slate-400">{loss.date}</td>
                    <td className="py-3 px-4 text-white font-medium group-hover:text-cyan-200">{loss.projectName}</td>
                    <td className="py-3 px-4 capitalize font-semibold text-slate-300">
                      {loss.cause.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-red-400">
                      {loss.amount.toLocaleString('fr-FR')} {loss.currency}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{loss.description}</td>
                    <td className="py-3 px-4 text-slate-400">{loss.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: FISCALITÉ & QUITTANCES (CGA SPE INSPIRATION) */}
      {activeTab === 'fiscalite' && (
        <FiscalObligationsTab obligations={fiscalObligations} onRefresh={onRefresh} />
      )}

      {/* Modal: New Advance */}
      {newAdvanceOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5 text-xs text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Accorder une Avance à un Collaborateur</h4>
              <button onClick={() => setNewAdvanceOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAdvance} className="space-y-3">
              <div>
                <label className="text-slate-300 block mb-1">Nom du Salarié</label>
                <input
                  type="text"
                  value={advanceEmpName}
                  onChange={(e) => setAdvanceEmpName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Montant Avancé (FCFA)</label>
                <input
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Mode de Remboursement Prévu</label>
                <select
                  value={advanceRepay}
                  onChange={(e) => setAdvanceRepay(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="retenue_salaire">Retenue sur salaire fin de mois</option>
                  <option value="especes">Remboursement espèces</option>
                  <option value="virement">Virement bancaire</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Motif / Justification</label>
                <textarea
                  rows={2}
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  placeholder="Ex: Frais de déplacement chantier offshore"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setNewAdvanceOpen(false)} className="px-3 py-1.5 bg-slate-800 rounded-lg">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold">
                  Valider l'Avance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Loss */}
      {newLossOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5 text-xs text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Déclarer une Perte / Rebut de Chantier</h4>
              <button onClick={() => setNewLossOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLoss} className="space-y-3">
              <div>
                <label className="text-slate-300 block mb-1">Chantier Concerné</label>
                <select
                  value={lossProject}
                  onChange={(e) => setLossProject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Montant Estimé de la Perte (FCFA)</label>
                <input
                  type="number"
                  value={lossAmount}
                  onChange={(e) => setLossAmount(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Typologie de la Perte</label>
                <select
                  value={lossCause}
                  onChange={(e) => setLossCause(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="rebut_matiere">Rebut matière / Chute non récupérable</option>
                  <option value="defaut_soudure">Défaut soudure à réusiner</option>
                  <option value="casse_materiel">Casse matériel / Outillage</option>
                  <option value="intemperies">Arrêt intempéries / Inondation</option>
                  <option value="retard_penalite">Pénalité de retard</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Description Circonstanciée</label>
                <textarea
                  rows={2}
                  value={lossDesc}
                  onChange={(e) => setLossDesc(e.target.value)}
                  placeholder="Circonstances et mesures correctives..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setNewLossOpen(false)} className="px-3 py-1.5 bg-slate-800 rounded-lg">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold">
                  Enregistrer la Perte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DetailSidebar: Facture */}
      {selectedInvoice && (() => {
        const linkedDoc = documents.find((d) => d.id === selectedInvoice.documentId || d.documentNumber === selectedInvoice.invoiceNumber);
        return (
          <DetailSidebar
            isOpen={!!selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            title={`Facture ${selectedInvoice.invoiceNumber}`}
            subtitle={`${selectedInvoice.type === 'client' ? 'Client' : 'Fournisseur'} : ${selectedInvoice.partyName}`}
            referenceCode={selectedInvoice.invoiceNumber}
            badge={{
              text: selectedInvoice.status === 'paye' ? 'Soldée / Payée' : selectedInvoice.status === 'partiel' ? 'Partiel' : 'En Attente',
              color: selectedInvoice.status === 'paye' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : selectedInvoice.status === 'partiel' ? 'bg-blue-950 text-blue-400 border-blue-800' : 'bg-amber-950 text-amber-400 border-amber-800'
            }}
            documents={linkedDoc ? [{
              id: linkedDoc.id,
              title: linkedDoc.title,
              type: linkedDoc.category.toUpperCase(),
              url: linkedDoc.cloudinary.secureUrl,
              date: linkedDoc.createdAt?.split('T')[0]
            }] : []}
            onDocumentClick={(doc) => {
              if (linkedDoc) onSelectDocument(linkedDoc);
            }}
            actions={[
              ...(linkedDoc ? [{
                label: 'Consulter dans GED',
                icon: <FileCheck className="w-3.5 h-3.5" />,
                onClick: () => onSelectDocument(linkedDoc),
                variant: 'primary' as const
              }] : [{
                label: 'Numériser Pièce',
                icon: <Camera className="w-3.5 h-3.5" />,
                onClick: () => { setSelectedInvoice(null); onOpenScannerForFinance('facture'); },
                variant: 'primary' as const
              }])
            ]}
          >
            <SidebarSection title="Informations Générales" icon={<FileText className="w-3.5 h-3.5 text-cyan-400" />}>
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <SidebarField label="Type de Facture" value={selectedInvoice.type === 'client' ? 'Vente / Client' : 'Achat / Fournisseur'} highlight />
                <SidebarField label="Partenaire" value={selectedInvoice.partyName} />
                <SidebarField label="Chantier Rattaché" value={selectedInvoice.projectName || 'Siège Central'} />
                <SidebarField label="Date d'Émission" value={selectedInvoice.issueDate || '-'} mono />
                <SidebarField label="Date d'Échéance" value={selectedInvoice.dueDate} mono />
              </div>
            </SidebarSection>

            <SidebarDivider />

            <SidebarSection title="Ventilation Financière" icon={<DollarSign className="w-3.5 h-3.5 text-emerald-400" />}>
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <SidebarField label="Montant HT" value={`${Math.round(selectedInvoice.totalAmount / 1.18).toLocaleString('fr-FR')} ${selectedInvoice.currency}`} mono />
                <SidebarField label="TVA (18%)" value={`${Math.round(selectedInvoice.totalAmount - (selectedInvoice.totalAmount / 1.18)).toLocaleString('fr-FR')} ${selectedInvoice.currency}`} mono />
                <SidebarField label="Total TTC" value={`${selectedInvoice.totalAmount.toLocaleString('fr-FR')} ${selectedInvoice.currency}`} highlight mono />
                <SidebarField label="Montant Encaissé / Réglé" value={`${selectedInvoice.paidAmount.toLocaleString('fr-FR')} ${selectedInvoice.currency}`} mono />
                <SidebarField label="Solde Restant Dû" value={`${(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString('fr-FR')} ${selectedInvoice.currency}`} mono highlight />
              </div>
            </SidebarSection>
          </DetailSidebar>
        );
      })()}

      {/* DetailSidebar: Dépense */}
      {selectedExpense && (() => {
        const linkedDoc = documents.find((d) => d.id === selectedExpense.documentId);
        return (
          <DetailSidebar
            isOpen={!!selectedExpense}
            onClose={() => setSelectedExpense(null)}
            title={selectedExpense.description}
            subtitle={`${selectedExpense.projectName} • ${selectedExpense.supplierName || 'Fournisseur comptoir'}`}
            referenceCode={selectedExpense.reference}
            badge={{
              text: selectedExpense.status.toUpperCase(),
              color: selectedExpense.status === 'valide' || selectedExpense.status === 'paye' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-400 border-amber-800'
            }}
            documents={linkedDoc ? [{
              id: linkedDoc.id,
              title: linkedDoc.title,
              type: linkedDoc.category.toUpperCase(),
              url: linkedDoc.cloudinary.secureUrl,
              date: linkedDoc.createdAt?.split('T')[0]
            }] : []}
            onDocumentClick={(doc) => {
              if (linkedDoc) onSelectDocument(linkedDoc);
            }}
            actions={[
              ...(linkedDoc ? [{
                label: 'Consulter Justificatif GED',
                icon: <FileCheck className="w-3.5 h-3.5" />,
                onClick: () => onSelectDocument(linkedDoc),
                variant: 'primary' as const
              }] : [{
                label: 'Numériser Justificatif',
                icon: <Camera className="w-3.5 h-3.5" />,
                onClick: () => { setSelectedExpense(null); onOpenScannerForFinance('depense'); },
                variant: 'primary' as const
              }])
            ]}
          >
            <SidebarSection title="Détail de la Dépense" icon={<FileText className="w-3.5 h-3.5 text-cyan-400" />}>
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <SidebarField label="Catégorie" value={selectedExpense.category.replace('_', ' ').toUpperCase()} highlight />
                <SidebarField label="Chantier Associé" value={selectedExpense.projectName} />
                <SidebarField label="Bénéficiaire / Fournisseur" value={selectedExpense.supplierName || '-'} />
                <SidebarField label="Date" value={selectedExpense.date} mono />
                <SidebarField label="Mode de Règlement" value={selectedExpense.paymentMethod.replace('_', ' ').toUpperCase()} />
                <SidebarField label="Engagé par" value={selectedExpense.createdBy || 'Alexandre Makosso'} />
              </div>
            </SidebarSection>

            <SidebarDivider />

            <SidebarSection title="Montant Décaissé" icon={<DollarSign className="w-3.5 h-3.5 text-emerald-400" />}>
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <SidebarField label="Montant TTC" value={`${selectedExpense.amount.toLocaleString('fr-FR')} ${selectedExpense.currency}`} highlight mono />
                <SidebarField label="Statut Comptable" value={selectedExpense.status === 'valide' || selectedExpense.status === 'paye' ? 'Validé & Rapproché' : 'En attente validation'} />
              </div>
            </SidebarSection>
          </DetailSidebar>
        );
      })()}

      {/* DetailSidebar: Mouvement de Caisse / Banque */}
      {selectedCashMove && (
        <DetailSidebar
          isOpen={!!selectedCashMove}
          onClose={() => setSelectedCashMove(null)}
          title={selectedCashMove.label}
          subtitle={`Compte : ${selectedCashMove.account.replace('_', ' ').toUpperCase()}`}
          referenceCode={selectedCashMove.reference}
          badge={{
            text: selectedCashMove.direction === 'entree' ? '+ ENCAISSEMENT' : '- DÉCAISSEMENT',
            color: selectedCashMove.direction === 'entree' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-red-950 text-red-400 border-red-800'
          }}
        >
          <SidebarSection title="Détails de l'Opération" icon={<Wallet className="w-3.5 h-3.5 text-cyan-400" />}>
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <SidebarField label="Compte Débit/Crédit" value={selectedCashMove.account.replace('_', ' ').toUpperCase()} highlight />
              <SidebarField label="Date Valeur" value={selectedCashMove.date} mono />
              <SidebarField label="Type d'Opération" value={selectedCashMove.direction === 'entree' ? 'Recette / Approvisionnement' : 'Dépense / Virement'} />
              <SidebarField label="Montant de l'Opération" value={`${selectedCashMove.amount.toLocaleString('fr-FR')} ${selectedCashMove.currency}`} mono highlight />
              <SidebarField label="Solde Résultant du Compte" value={selectedCashMove.balanceAfter ? `${selectedCashMove.balanceAfter.toLocaleString('fr-FR')} FCFA` : '-'} mono />
            </div>
          </SidebarSection>
        </DetailSidebar>
      )}

      {/* DetailSidebar: Avance sur Salaire */}
      {selectedAdvance && (
        <DetailSidebar
          isOpen={!!selectedAdvance}
          onClose={() => setSelectedAdvance(null)}
          title={`Avance : ${selectedAdvance.employeeName}`}
          subtitle={`Motif : ${selectedAdvance.reason}`}
          referenceCode={selectedAdvance.id}
          badge={{
            text: selectedAdvance.status === 'justifiee' ? 'Justifiée 100%' : 'Accordée / En cours',
            color: selectedAdvance.status === 'justifiee' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-400 border-amber-800'
          }}
        >
          <SidebarSection title="Informations Salarié & Avance" icon={<UserCheck className="w-3.5 h-3.5 text-cyan-400" />}>
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <SidebarField label="Bénéficiaire" value={selectedAdvance.employeeName} highlight />
              <SidebarField label="Date de la Demande" value={selectedAdvance.requestDate} mono />
              <SidebarField label="Montant Avancé" value={`${selectedAdvance.amount.toLocaleString('fr-FR')} ${selectedAdvance.currency}`} mono highlight />
              <SidebarField label="Modalité de Remboursement" value={selectedAdvance.repaymentMode.replace('_', ' ').toUpperCase()} />
              <SidebarField label="Approuvé par" value={selectedAdvance.approvedBy || 'Direction Générale'} />
              <SidebarField label="Notes & Justification" value={selectedAdvance.justificationNotes || '-'} />
            </div>
          </SidebarSection>
        </DetailSidebar>
      )}

      {/* DetailSidebar: Perte & Rebut */}
      {selectedLoss && (
        <DetailSidebar
          isOpen={!!selectedLoss}
          onClose={() => setSelectedLoss(null)}
          title={`Perte : ${selectedLoss.cause.replace('_', ' ').toUpperCase()}`}
          subtitle={`Chantier : ${selectedLoss.projectName}`}
          referenceCode={selectedLoss.reference}
          badge={{
            text: 'PERTE / REBUT CONSTATÉ',
            color: 'bg-red-950 text-red-400 border-red-800'
          }}
        >
          <SidebarSection title="Circonstances du Sinistre / Rebut" icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400" />}>
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <SidebarField label="Chantier Concerné" value={selectedLoss.projectName} highlight />
              <SidebarField label="Typologie de la Perte" value={selectedLoss.cause.replace('_', ' ').toUpperCase()} />
              <SidebarField label="Date de Constat" value={selectedLoss.date} mono />
              <SidebarField label="Montant Estimé" value={`${selectedLoss.amount.toLocaleString('fr-FR')} ${selectedLoss.currency}`} mono highlight />
              <SidebarField label="Constaté par" value={selectedLoss.recordedBy} />
              <SidebarField label="Description des Faits" value={selectedLoss.description} />
            </div>
          </SidebarSection>
        </DetailSidebar>
      )}
    </div>
  );
};
