import React, { useState } from 'react';
import {
  Banknote,
  Plus,
  CheckCircle,
  Lock,
  Download,
  Eye,
  Search,
  DollarSign,
  Users,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { PayrollPeriod, Payslip } from '../../types/advancedModules';
import { PayrollService } from '../../services/payrollService';
import { DataService } from '../../services/dataService';
import { Employee } from '../../types';
import { DetailSidebar, SidebarSection, SidebarField, SidebarDivider } from '../shared/DetailSidebar';

interface PayrollModuleProps {
  periods: PayrollPeriod[];
  payslips: Payslip[];
  employees: Employee[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  periods,
  payslips,
  employees,
  onRefresh,
  showToast,
}) => {
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>(
    periods[0]?.periodKey || '2026-09'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlip, setSelectedSlip] = useState<Payslip | null>(null);
  const [calculating, setCalculating] = useState(false);

  const currentUser = DataService.getCurrentUser();

  const currentPeriod =
    periods.find((p) => p.periodKey === selectedPeriodKey) || periods[0];

  const currentSlips = payslips.filter((s) => s.periodKey === selectedPeriodKey);

  const filteredSlips = currentSlips.filter(
    (s) =>
      s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGeneratePeriod = async () => {
    setCalculating(true);
    try {
      await PayrollService.generatePayrollPeriod(selectedPeriodKey);
      onRefresh();
      showToast(`Période de paie ${selectedPeriodKey} calculée avec succès.`);
    } catch (e: any) {
      showToast(e.message || 'Erreur lors du calcul de la paie.');
    } finally {
      setCalculating(false);
    }
  };

  const handleValidatePeriod = async () => {
    if (!currentPeriod) return;
    await PayrollService.validatePeriod(currentPeriod.id, currentUser.displayName);
    onRefresh();
    showToast(`Période de paie ${currentPeriod.periodKey} formellement validée.`);
  };

  const handleClosePeriod = async () => {
    if (!currentPeriod) return;
    await PayrollService.closePeriod(currentPeriod.id, currentUser.displayName);
    onRefresh();
    showToast(`Période de paie ${currentPeriod.periodKey} clôturée et définitivement verrouillée.`);
  };

  const handleDownloadSlipPdf = (slip: Payslip) => {
    PayrollService.generatePayslipPdf(slip);
    showToast(`Bulletin de paie PDF généré : ${slip.reference}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Paie & Rémunérations (SYSCOHADA)</h1>
            <p className="text-sm text-slate-400">
              Calcul des salaires, cotisations CNSS, impôt IRPP et bulletins dématérialisés
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <select
            value={selectedPeriodKey}
            onChange={(e) => setSelectedPeriodKey(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-semibold"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.periodKey}>
                Période {p.periodKey} ({p.status.toUpperCase()})
              </option>
            ))}
            {!periods.some((p) => p.periodKey === '2026-10') && (
              <option value="2026-10">Période 2026-10 (À créer)</option>
            )}
          </select>

          {currentPeriod?.status !== 'cloture' && (
            <button
              onClick={handleGeneratePeriod}
              disabled={calculating}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {calculating ? 'Calcul en cours...' : 'Calculer la Période'}
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards for the active period */}
      {currentPeriod && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Masse Salariale Brute</span>
            <div className="text-2xl font-bold text-white font-mono">
              {currentPeriod.totalGross.toLocaleString('fr-FR')} FCFA
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              {currentPeriod.employeesCount} collaborateurs inclus
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Net Total à Payer</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {currentPeriod.totalNet.toLocaleString('fr-FR')} FCFA
            </div>
            <span className="text-xs text-emerald-500 mt-1 block">Prêts pour virement bancaire</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Retenues (CNSS + IRPP)</span>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {currentPeriod.totalDeductions.toLocaleString('fr-FR')} FCFA
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Dettes sociales et fiscales</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Charges Patronales (CNSS 16%)</span>
            <div className="text-2xl font-bold text-cyan-400 font-mono">
              {currentPeriod.totalEmployerContributions.toLocaleString('fr-FR')} FCFA
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Coût entreprise employeur</span>
          </div>
        </div>
      )}

      {/* Period Status & Action Bar */}
      {currentPeriod && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                currentPeriod.status === 'cloture'
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : currentPeriod.status === 'valide'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              Statut : {currentPeriod.status}
            </span>
            {currentPeriod.validatedBy && (
              <span className="text-xs text-slate-400">
                Validé par : <strong className="text-white">{currentPeriod.validatedBy}</strong>
              </span>
            )}
            {currentPeriod.closedBy && (
              <span className="text-xs text-rose-300">
                Clôturé par : <strong>{currentPeriod.closedBy}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentPeriod.status === 'controle' && (
              <button
                onClick={handleValidatePeriod}
                className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Valider Période (DG)
              </button>
            )}
            {currentPeriod.status === 'valide' && (
              <button
                onClick={handleClosePeriod}
                className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-4 h-4" /> Clôturer Définitivement
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bulletins Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <h3 className="font-bold text-white text-sm">
            Bulletins de Salaire Individuels ({filteredSlips.length})
          </h3>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Chercher collaborateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Réf Bulletin</th>
                <th className="p-4">Collaborateur</th>
                <th className="p-4">Poste & Département</th>
                <th className="p-4">Salaire de Base</th>
                <th className="p-4">Primes / H.Sup</th>
                <th className="p-4">Retenues CNSS/Taxe</th>
                <th className="p-4">Salaire Net</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSlips.map((slip) => (
                <tr key={slip.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-cyan-400">{slip.reference}</td>
                  <td className="p-4">
                    <div className="font-semibold text-white">{slip.employeeName}</div>
                    <div className="text-xs text-slate-400">Matricule : {slip.matricule}</div>
                  </td>
                  <td className="p-4 text-xs">
                    <div className="text-white">{slip.role}</div>
                    <div className="text-slate-400 uppercase">{slip.department}</div>
                  </td>
                  <td className="p-4 font-mono text-slate-300">
                    {slip.baseSalary.toLocaleString('fr-FR')} F
                  </td>
                  <td className="p-4 font-mono text-cyan-400">
                    +{(slip.grossSalary - slip.baseSalary).toLocaleString('fr-FR')} F
                  </td>
                  <td className="p-4 font-mono text-rose-400">
                    -{slip.totalDeductions.toLocaleString('fr-FR')} F
                  </td>
                  <td className="p-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                    {slip.netSalary.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedSlip(slip)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors"
                    >
                      Détails
                    </button>
                    <button
                      onClick={() => handleDownloadSlipPdf(slip)}
                      className="p-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg transition-colors"
                      title="Télécharger Bulletin PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSlips.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Aucun bulletin calculé pour cette période. Cliquez sur "Calculer la Période".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DetailSidebar: Bulletin de Paie */}
      <DetailSidebar
        isOpen={!!selectedSlip}
        onClose={() => setSelectedSlip(null)}
        title={selectedSlip?.employeeName || ''}
        subtitle={selectedSlip ? `${selectedSlip.role} • Matricule : ${selectedSlip.matricule} • Période : ${selectedSlip.periodKey}` : ''}
        referenceCode={selectedSlip?.reference}
        actions={
          selectedSlip
            ? [{
                label: 'Télécharger Bulletin PDF',
                icon: <Download className="w-3.5 h-3.5" />,
                onClick: () => selectedSlip && handleDownloadSlipPdf(selectedSlip),
                variant: 'primary' as const,
              }]
            : []
        }
      >
        {selectedSlip && (
          <>
            {/* Earnings */}
            <SidebarSection title="Rémunération Brute" icon={<DollarSign className="w-3.5 h-3.5" />}>
              <SidebarField label="Salaire de base" value={`${selectedSlip.baseSalary.toLocaleString('fr-FR')} FCFA`} mono highlight />
              <SidebarField label={`Heures suppl. (${selectedSlip.overtimeHours}h)`} value={`+${selectedSlip.overtimeAmount.toLocaleString('fr-FR')} FCFA`} mono />
              <SidebarField label="Primes (Anc., Offshore, Panier)" value={`+${(selectedSlip.seniorityBonus + selectedSlip.offshoreBonus + selectedSlip.hazardBonus).toLocaleString('fr-FR')} FCFA`} mono />
              <SidebarField label="Indemnités (Transport & Logement)" value={`+${(selectedSlip.transportAllowance + selectedSlip.housingAllowance).toLocaleString('fr-FR')} FCFA`} mono />
              <div className="mt-2 py-2 px-3 bg-slate-100 dark:bg-slate-950 rounded-lg flex justify-between font-bold text-sm">
                <span className="text-slate-800 dark:text-white">SALAIRE BRUT TOTAL</span>
                <span className="font-mono text-slate-800 dark:text-white">{selectedSlip.grossSalary.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </SidebarSection>

            <SidebarDivider />

            {/* Deductions */}
            <SidebarSection title="Retenues & Charges" icon={<AlertCircle className="w-3.5 h-3.5" />}>
              <div className="flex justify-between py-1 text-xs text-red-600 dark:text-rose-400">
                <span>Cotisation Salariale CNSS (4.2%)</span>
                <span className="font-mono">-{selectedSlip.employeeCnss.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between py-1 text-xs text-red-600 dark:text-rose-400">
                <span>Impôt sur le Revenu (IRPP)</span>
                <span className="font-mono">-{selectedSlip.incomeTax.toLocaleString('fr-FR')} FCFA</span>
              </div>
              {selectedSlip.advanceDeduction > 0 && (
                <div className="flex justify-between py-1 text-xs text-red-600 dark:text-rose-400">
                  <span>Remboursement Acompte / Avance</span>
                  <span className="font-mono">-{selectedSlip.advanceDeduction.toLocaleString('fr-FR')} FCFA</span>
                </div>
              )}
            </SidebarSection>

            <SidebarDivider />

            {/* Net */}
            <div className="py-3 px-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex justify-between items-center">
              <span className="font-bold text-emerald-700 dark:text-emerald-300">NET À PAYER</span>
              <span className="font-mono font-bold text-lg text-emerald-700 dark:text-emerald-400">{selectedSlip.netSalary.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </>
        )}
      </DetailSidebar>
    </div>
  );
};
