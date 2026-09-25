import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Scale,
  CheckCircle,
  AlertCircle,
  Search,
  DollarSign,
  ArrowRightLeft,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AccountingAccount,
  JournalEntry,
  BankTransaction,
} from '../../types/advancedModules';
import { AccountingService } from '../../services/accountingService';
import { DataService } from '../../services/dataService';
import { DetailSidebar, SidebarSection, SidebarField, SidebarStatusBadge, SidebarDivider } from '../shared/DetailSidebar';

interface AccountingModuleProps {
  accounts: AccountingAccount[];
  entries: JournalEntry[];
  bankTransactions: BankTransaction[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  accounts,
  entries,
  bankTransactions,
  onRefresh,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'entries' | 'ledger' | 'balance' | 'bank'>('entries');
  const [searchQuery, setSearchQuery] = useState('');
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);
  const [viewBankTx, setViewBankTx] = useState<BankTransaction | null>(null);

  // New Journal Entry Form State
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryDesc, setEntryDesc] = useState('');
  const [entryJournal, setEntryJournal] = useState<JournalEntry['journalCode']>('achats');
  const [entryLines, setEntryLines] = useState<
    Array<{ accountCode: string; accountName: string; debit: number; credit: number; description?: string }>
  >([
    { accountCode: '601100', accountName: 'Achats Tubes Acier & Raccords', debit: 0, credit: 0 },
    { accountCode: '401000', accountName: 'Fournisseurs d\'exploitation', debit: 0, credit: 0 },
  ]);

  const totalDebit = entryLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = entryLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleAddLine = () => {
    setEntryLines([
      ...entryLines,
      { accountCode: accounts[0]?.code || '401000', accountName: accounts[0]?.name || '', debit: 0, credit: 0 },
    ]);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      showToast('Impossible d\'enregistrer : L\'écriture comptable est déséquilibrée (Débit ≠ Crédit).');
      return;
    }
    if (!entryDesc.trim()) {
      showToast('Veuillez renseigner le libellé de l\'écriture.');
      return;
    }

    try {
      await AccountingService.createJournalEntry({
        date: entryDate,
        description: entryDesc,
        journalCode: entryJournal,
        lines: entryLines.map((l) => ({
          accountCode: l.accountCode,
          accountName: l.accountName,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description || entryDesc,
        })),
      });

      setNewEntryOpen(false);
      setEntryDesc('');
      setEntryLines([
        { accountCode: '601100', accountName: 'Achats Tubes Acier & Raccords', debit: 0, credit: 0 },
        { accountCode: '401000', accountName: 'Fournisseurs d\'exploitation', debit: 0, credit: 0 },
      ]);
      onRefresh();
      showToast('Écriture comptable équilibrée enregistrée avec succès.');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la validation comptable.');
    }
  };

  const handleValidateEntry = async (entryId: string) => {
    const user = DataService.getCurrentUser();
    await AccountingService.validateJournalEntry(entryId, user.displayName);
    onRefresh();
    showToast('Écriture validée et inscrite au Grand Livre.');
  };

  const handleReconcile = async (txId: string, entryId: string) => {
    await AccountingService.reconcileBankTransaction(txId, entryId);
    onRefresh();
    showToast('Rapprochement bancaire effectué.');
  };

  const ledger = AccountingService.getGeneralLedger();
  const trialBalance = AccountingService.getTrialBalance();

  const filteredEntries = entries.filter(
    (e) =>
      e.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.journalCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Comptabilité Générale Avancée (SYSCOHADA)</h1>
            <p className="text-sm text-slate-400">
              Journaux auxiliaires, Grand Livre, Balance générale et rapprochement bancaire
            </p>
          </div>
        </div>

        <button
          onClick={() => setNewEntryOpen(true)}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-sm transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" /> Passer une Écriture
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'entries'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Journaux ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'ledger'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Grand Livre
          </button>
          <button
            onClick={() => setActiveTab('balance')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'balance'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Balance des Comptes
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'bank'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rapprochement Bancaire ({bankTransactions.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher écriture, compte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tab 1: Journaux d'Écritures */}
      {activeTab === 'entries' && (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => setViewEntry(entry)}
              className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 space-y-3 cursor-pointer transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700">
                    {entry.reference}
                  </span>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    Journal : {entry.journalCode}
                  </span>
                  <span className="text-xs text-slate-400">Date : {entry.date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      entry.status === 'validee'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {entry.status}
                  </span>
                  {entry.status === 'soumise' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleValidateEntry(entry.id);
                      }}
                      className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors"
                    >
                      Valider Écriture
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm font-semibold text-white">{entry.description}</p>

              {/* Lines Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/40 text-slate-500 uppercase">
                    <tr>
                      <th className="p-2">Compte</th>
                      <th className="p-2">Intitulé</th>
                      <th className="p-2">Libellé Ligne</th>
                      <th className="p-2 text-right">Débit (FCFA)</th>
                      <th className="p-2 text-right">Crédit (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {entry.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="p-2 font-mono font-bold text-cyan-400">{l.accountCode}</td>
                        <td className="p-2">{l.accountName}</td>
                        <td className="p-2 text-slate-400">{l.description || '-'}</td>
                        <td className="p-2 text-right font-mono font-semibold text-white">
                          {l.debit > 0 ? l.debit.toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className="p-2 text-right font-mono font-semibold text-white">
                          {l.credit > 0 ? l.credit.toLocaleString('fr-FR') : '-'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-950/80 font-bold border-t border-slate-700">
                      <td colSpan={3} className="p-2 text-right text-slate-400">
                        TOTAL ÉQUILIBRÉ :
                      </td>
                      <td className="p-2 text-right font-mono text-emerald-400">
                        {entry.totalDebit.toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="p-2 text-right font-mono text-emerald-400">
                        {entry.totalCredit.toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {filteredEntries.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              Aucune écriture comptable trouvée.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Grand Livre */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {Object.values(ledger).map((acc) => (
            <div key={acc.code} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {acc.code}
                  </span>
                  <h3 className="font-bold text-white text-base">{acc.name}</h3>
                </div>
                <div className="text-xs font-mono font-bold">
                  Solde :{' '}
                  <span className={acc.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {acc.balance.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/40 text-slate-500 uppercase">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Pièce / Réf</th>
                      <th className="p-2">Libellé</th>
                      <th className="p-2 text-right">Débit</th>
                      <th className="p-2 text-right">Crédit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {acc.lines.map((l: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2 text-slate-400">{l.date}</td>
                        <td className="p-2 font-mono text-cyan-400">{l.entryRef}</td>
                        <td className="p-2">{l.description}</td>
                        <td className="p-2 text-right font-mono text-white">
                          {l.debit > 0 ? l.debit.toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className="p-2 text-right font-mono text-white">
                          {l.credit > 0 ? l.credit.toLocaleString('fr-FR') : '-'}
                        </td>
                      </tr>
                    ))}
                    {acc.lines.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                          Aucun mouvement enregistré sur ce compte pour l'exercice.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Balance Générale des Comptes */}
      {activeTab === 'balance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Compte SYSCOHADA</th>
                  <th className="p-4">Intitulé du Compte</th>
                  <th className="p-4 text-right">Total Débit</th>
                  <th className="p-4 text-right">Total Crédit</th>
                  <th className="p-4 text-right">Solde Débiteur</th>
                  <th className="p-4 text-right">Solde Créditeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {trialBalance.map((item) => (
                  <tr key={item.code} className="hover:bg-slate-800/30 transition-colors text-xs">
                    <td className="p-4 font-mono font-bold text-cyan-400">{item.code}</td>
                    <td className="p-4 font-semibold text-white">{item.name}</td>
                    <td className="p-4 text-right font-mono">
                      {item.totalDebit > 0 ? item.totalDebit.toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="p-4 text-right font-mono">
                      {item.totalCredit > 0 ? item.totalCredit.toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-400">
                      {item.balanceDebit > 0 ? item.balanceDebit.toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-rose-400">
                      {item.balanceCredit > 0 ? item.balanceCredit.toLocaleString('fr-FR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Rapprochement Bancaire */}
      {activeTab === 'bank' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Compte Bancaire</th>
                  <th className="p-4">Référence Opération</th>
                  <th className="p-4">Libellé Relevé Bancaire</th>
                  <th className="p-4 text-right">Mouvement (FCFA)</th>
                  <th className="p-4">État Rapprochement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bankTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setViewBankTx(tx)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="p-4 text-xs text-slate-400">{tx.date}</td>
                    <td className="p-4 font-semibold text-white">{tx.bankAccount}</td>
                    <td className="p-4 font-mono text-cyan-400">{tx.reference}</td>
                    <td className="p-4 text-slate-300">{tx.label}</td>
                    <td className="p-4 text-right font-mono font-bold whitespace-nowrap">
                      {tx.debit > 0 ? (
                        <span className="text-emerald-400">+{tx.debit.toLocaleString('fr-FR')}</span>
                      ) : (
                        <span className="text-rose-400">-{tx.credit.toLocaleString('fr-FR')}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {tx.reconciled ? (
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3.5 h-3.5" /> Rapproché
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3.5 h-3.5" /> Non Rapproché
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Passer une Écriture Comptable */}
      {newEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Saisir une Écriture Comptable Équilibrée</h2>
            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Journal Auxiliaire</label>
                  <select
                    value={entryJournal}
                    onChange={(e) => setEntryJournal(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="achats">Achats</option>
                    <option value="ventes">Ventes</option>
                    <option value="banque">Banque</option>
                    <option value="caisse">Caisse</option>
                    <option value="od">Opérations Diverses (OD)</option>
                    <option value="paie">Paie</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date Comptable</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Libellé de l'Écriture</label>
                <input
                  type="text"
                  placeholder="Ex: Facturation situation n°3 Djeno TotalEnergies..."
                  value={entryDesc}
                  onChange={(e) => setEntryDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              {/* Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Lignes d'écriture (Comptes & Débit/Crédit)</label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    + Ajouter une ligne
                  </button>
                </div>

                {entryLines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                    <select
                      value={line.accountCode}
                      onChange={(e) => {
                        const copy = [...entryLines];
                        const acc = accounts.find((a) => a.code === e.target.value);
                        copy[idx].accountCode = e.target.value;
                        copy[idx].accountName = acc?.name || '';
                        setEntryLines(copy);
                      }}
                      className="w-48 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.code}>
                          {a.code} - {a.name.slice(0, 20)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Débit FCFA"
                      value={line.debit || ''}
                      onChange={(e) => {
                        const copy = [...entryLines];
                        copy[idx].debit = Number(e.target.value);
                        setEntryLines(copy);
                      }}
                      className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Crédit FCFA"
                      value={line.credit || ''}
                      onChange={(e) => {
                        const copy = [...entryLines];
                        copy[idx].credit = Number(e.target.value);
                        setEntryLines(copy);
                      }}
                      className="flex-1 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>
                ))}
              </div>

              {/* Balance Verification Bar */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  isBalanced
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                    : 'bg-rose-950/40 border-rose-800 text-rose-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  <span>
                    {isBalanced ? 'ÉCRITURE ÉQUILIBRÉE' : 'ÉCRITURE DÉSÉQUILIBRÉE (INTERDITE)'}
                  </span>
                </div>
                <div className="font-mono">
                  Débit: {totalDebit.toLocaleString('fr-FR')} F | Crédit: {totalCredit.toLocaleString('fr-FR')} F
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewEntryOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm disabled:opacity-50"
                >
                  Enregistrer l'Écriture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DetailSidebar: Journal Entry Detail */}
      <DetailSidebar
        isOpen={!!viewEntry}
        onClose={() => setViewEntry(null)}
        title={viewEntry?.reference || 'Écriture Comptable'}
        subtitle={viewEntry ? `Journal ${viewEntry.journalCode.toUpperCase()} • ${viewEntry.date}` : ''}
        width="wide"
        referenceCode={viewEntry?.reference}
        badge={
          viewEntry
            ? {
                text: viewEntry.status === 'validee' ? 'Validée & Verrouillée' : 'Soumise / Brouillon',
                color:
                  viewEntry.status === 'validee'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border-amber-800',
              }
            : undefined
        }
        actions={
          viewEntry?.status === 'soumise'
            ? [
                {
                  label: "Valider & Clôturer l'Écriture",
                  icon: <CheckCircle className="w-4 h-4" />,
                  onClick: () => {
                    handleValidateEntry(viewEntry.id);
                    setViewEntry({ ...viewEntry, status: 'validee' });
                  },
                  variant: 'primary',
                },
              ]
            : undefined
        }
      >
        {viewEntry && (
          <>
            <SidebarSection title="Informations de l'Écriture">
              <div className="grid grid-cols-2 gap-3">
                <SidebarField label="Référence Pièce" value={viewEntry.reference} />
                <SidebarField label="Date Comptable" value={viewEntry.date} />
                <SidebarField label="Journal Auxiliaire" value={viewEntry.journalCode.toUpperCase()} />
                <SidebarField label="Statut" value={viewEntry.status} />
              </div>
              <div className="mt-3">
                <SidebarField label="Libellé Général" value={viewEntry.description} />
              </div>
            </SidebarSection>

            <SidebarDivider />

            <SidebarSection title={`Ventilation des Comptes (${viewEntry.lines.length} lignes)`}>
              <div className="space-y-2">
                {viewEntry.lines.map((l) => (
                  <div key={l.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        {l.accountCode}
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        {l.debit > 0
                          ? `Débit : ${l.debit.toLocaleString('fr-FR')} F`
                          : `Crédit : ${l.credit.toLocaleString('fr-FR')} F`}
                      </span>
                    </div>
                    <p className="text-xs text-white font-medium">{l.accountName}</p>
                    {l.description && <p className="text-[11px] text-slate-400">{l.description}</p>}
                  </div>
                ))}
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 mt-3 flex items-center justify-between font-mono text-xs font-bold">
                <span className="text-slate-400">Total Équilibré :</span>
                <span className="text-emerald-400">{viewEntry.totalDebit.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </SidebarSection>

            {viewEntry.documentId && (
              <>
                <SidebarDivider />
                <SidebarSection title="Pièce Justificative (GED)">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-300">Justificatif rattaché</span>
                    <span className="font-mono text-cyan-400 text-xs">{viewEntry.documentId}</span>
                  </div>
                </SidebarSection>
              </>
            )}
          </>
        )}
      </DetailSidebar>

      {/* DetailSidebar: Bank Transaction Detail */}
      <DetailSidebar
        isOpen={!!viewBankTx}
        onClose={() => setViewBankTx(null)}
        title={viewBankTx?.reference || 'Opération Bancaire'}
        subtitle={viewBankTx ? `${viewBankTx.bankAccount} • ${viewBankTx.date}` : ''}
        referenceCode={viewBankTx?.reference}
        width="default"
        badge={
          viewBankTx
            ? {
                text: viewBankTx.reconciled ? 'Rapproché' : 'Non Rapproché',
                color: viewBankTx.reconciled
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800',
              }
            : undefined
        }
      >
        {viewBankTx && (
          <>
            <SidebarSection title="Détails du Mouvement Relevé">
              <div className="space-y-3">
                <SidebarField label="Banque / Compte" value={viewBankTx.bankAccount} />
                <SidebarField label="Libellé Opération" value={viewBankTx.label} />
                <div className="grid grid-cols-2 gap-3">
                  <SidebarField label="Date Relevé" value={viewBankTx.date} />
                  <SidebarField label="Référence Pièce" value={viewBankTx.reference} />
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Montant :</span>
                  <span className={`text-base font-mono font-bold ${viewBankTx.debit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {viewBankTx.debit > 0 ? `+${viewBankTx.debit.toLocaleString('fr-FR')}` : `-${viewBankTx.credit.toLocaleString('fr-FR')}`} FCFA
                  </span>
                </div>
              </div>
            </SidebarSection>

            {(viewBankTx.reconciledWithEntryId || viewBankTx.matchedEntryId) && (
              <>
                <SidebarDivider />
                <SidebarSection title="Rapprochement Comptable">
                  <SidebarField label="Écriture Lettrée" value={viewBankTx.reconciledWithEntryId || viewBankTx.matchedEntryId || ''} />
                </SidebarSection>
              </>
            )}
          </>
        )}
      </DetailSidebar>
    </div>
  );
};
