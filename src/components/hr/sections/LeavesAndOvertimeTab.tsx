import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Printer,
  User,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Employee, OvertimeRecord, EmployeeLeave } from '../../../types';
import { AttendanceService } from '../../../services/attendanceService';
import { DataService } from '../../../services/dataService';
import { PrintDocumentModal, PrintDocumentData } from '../../shared/PrintDocumentModal';

interface LeavesAndOvertimeTabProps {
  employees: Employee[];
  showToast?: (msg: string) => void;
}

export const LeavesAndOvertimeTab: React.FC<LeavesAndOvertimeTabProps> = ({
  employees,
  showToast,
}) => {
  const [subTab, setSubTab] = useState<'overtime' | 'leaves'>('overtime');
  const [overtimeList, setOvertimeList] = useState<OvertimeRecord[]>(() =>
    AttendanceService.getOvertimeRecords()
  );
  const [leavesList, setLeavesList] = useState<EmployeeLeave[]>(() =>
    DataService.getEmployeeLeaves()
  );

  // New Overtime modal state
  const [newOvertimeOpen, setNewOvertimeOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [otHours, setOtHours] = useState<number>(2);
  const [otRate, setOtRate] = useState<'25%' | '50%' | '100%'>('25%');
  const [otTask, setOtTask] = useState('');

  // Print modal state
  const [printDoc, setPrintDoc] = useState<PrintDocumentData | null>(null);

  const currentUser = DataService.getCurrentUser();

  const handleCreateOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === selectedEmpId);
    if (!emp) return;

    AttendanceService.addOvertimeRecord({
      employeeId: emp.id,
      employeeName: emp.fullName,
      matricule: emp.matricule,
      date: new Date().toISOString().split('T')[0],
      hoursCount: Number(otHours),
      rate: otRate,
      taskDescription: otTask || 'Travaux de soudure / tuyauterie supplémentaires sur chantier',
    });

    setOvertimeList(AttendanceService.getOvertimeRecords());
    setNewOvertimeOpen(false);
    setOtTask('');
    showToast?.(`Heures supplémentaires déclarées pour ${emp.fullName}.`);
  };

  const handleValidateOvertime = (otId: string) => {
    AttendanceService.validateOvertime(otId, `${currentUser.displayName} (${currentUser.role.toUpperCase()})`);
    setOvertimeList(AttendanceService.getOvertimeRecords());
    showToast?.('Heures supplémentaires validées et transmises en paie.');
  };

  const handlePrintBilan = () => {
    const today = new Date().toISOString().split('T')[0];
    if (subTab === 'overtime') {
      const tableColumns = ['Matricule', 'Collaborateur', 'Date', 'Heures', 'Taux Majoré', 'Tâche Chantier', 'Statut'];
      const tableRows = overtimeList.map((ot) => [
        ot.matricule,
        ot.employeeName,
        ot.date,
        `${ot.hoursCount} h`,
        ot.rate,
        ot.taskDescription,
        ot.status.toUpperCase(),
      ]);

      setPrintDoc({
        type: 'generic',
        title: 'ÉTAT DES HEURES SUPPLÉMENTAIRES CHANTIERS',
        reference: `HS-CORESI-${today}`,
        date: today,
        tableColumns,
        tableRows,
        notes: 'Document certifié pour transmission au Service Paie & Comptabilité. Conforme au barème des majorations légales (25% jour, 50% nuit/samedi, 100% dimanche).',
      });
    } else {
      const tableColumns = ['Collaborateur', 'Type de Congé', 'Date Début', 'Date Fin', 'Statut'];
      const tableRows = leavesList.map((l) => [
        l.employeeName,
        l.type.replace('_', ' ').toUpperCase(),
        l.startDate,
        l.endDate,
        l.status.toUpperCase(),
      ]);

      setPrintDoc({
        type: 'generic',
        title: 'PLANNING & ÉTAT DES CONGÉS DU PERSONNEL',
        reference: `CONGES-CORESI-${today}`,
        date: today,
        tableColumns,
        tableRows,
        notes: 'Enregistrement RH des congés annuels, absences autorisées et indisponibilités chantiers.',
      });
    }
  };

  const totalValidatedHours = overtimeList
    .filter((o) => o.status === 'valide')
    .reduce((sum, o) => sum + o.hoursCount, 0);

  return (
    <div className="space-y-6">
      {/* Sub Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-stone-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-stone-200 dark:border-slate-800 w-fit">
          <button
            type="button"
            onClick={() => setSubTab('overtime')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'overtime'
                ? 'bg-green-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Heures Supplémentaires ({overtimeList.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('leaves')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'leaves'
                ? 'bg-green-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Congés &amp; Absences ({leavesList.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintBilan}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer Bilan A4</span>
          </button>

          {subTab === 'overtime' && (
            <button
              type="button"
              onClick={() => setNewOvertimeOpen(true)}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-green-700/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Déclarer Heures Sup</span>
            </button>
          )}
        </div>
      </div>

      {/* OVERTIME VIEW */}
      {subTab === 'overtime' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Total Heures Validées
              </span>
              <p className="text-2xl font-black font-mono text-[#3B7A2C] dark:text-emerald-400">
                {totalValidatedHours} h
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Prêtes pour intégration sur bulletin</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Majoration Nuit / Samedi (50%)
              </span>
              <p className="text-2xl font-black font-mono text-[#E8731A]">
                {overtimeList.filter((o) => o.rate === '50%').length} fiches
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Postes de nuit &amp; week-end</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                En Attente de Visa
              </span>
              <p className="text-2xl font-black font-mono text-amber-600">
                {overtimeList.filter((o) => o.status === 'soumis').length}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">À valider par le chef de chantier</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-slate-950/60 uppercase text-[10px] text-slate-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800 font-bold tracking-wider">
                <tr>
                  <th className="p-3.5 sm:p-4">Collaborateur</th>
                  <th className="p-3.5 sm:p-4">Date</th>
                  <th className="p-3.5 sm:p-4">Volume</th>
                  <th className="p-3.5 sm:p-4">Taux Majoré</th>
                  <th className="p-3.5 sm:p-4">Motif / Tâche Chantier</th>
                  <th className="p-3.5 sm:p-4">Statut</th>
                  <th className="p-3.5 sm:p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
                {overtimeList.map((ot) => (
                  <tr key={ot.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 sm:p-4">
                      <p className="font-extrabold text-slate-900 dark:text-white text-xs">{ot.employeeName}</p>
                      <span className="font-mono text-[10px] text-green-700 dark:text-green-400">{ot.matricule}</span>
                    </td>
                    <td className="p-3.5 sm:p-4 font-mono text-slate-600 dark:text-slate-300">{ot.date}</td>
                    <td className="p-3.5 sm:p-4 font-extrabold text-slate-900 dark:text-white font-mono">
                      {ot.hoursCount} h
                    </td>
                    <td className="p-3.5 sm:p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {ot.rate}
                      </span>
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {ot.taskDescription}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {ot.status === 'valide' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 sm:p-4 text-right">
                      {ot.status === 'soumis' && (
                        <button
                          type="button"
                          onClick={() => handleValidateOvertime(ot.id)}
                          className="px-2.5 py-1 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Valider
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAVES VIEW */}
      {subTab === 'leaves' && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-slate-950/60 uppercase text-[10px] text-slate-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800 font-bold tracking-wider">
              <tr>
                <th className="p-3.5 sm:p-4">Collaborateur</th>
                <th className="p-3.5 sm:p-4">Type de Congé</th>
                <th className="p-3.5 sm:p-4">Période du Congé</th>
                <th className="p-3.5 sm:p-4">Statut Approbation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
              {leavesList.map((leave) => (
                <tr key={leave.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 sm:p-4 font-bold text-slate-900 dark:text-white">
                    {leave.employeeName}
                  </td>
                  <td className="p-3.5 sm:p-4 text-slate-700 dark:text-slate-300 font-medium">
                    {leave.type.replace('_', ' ').toUpperCase()}
                  </td>
                  <td className="p-3.5 sm:p-4 font-mono text-slate-600 dark:text-slate-300">
                    {leave.startDate} au {leave.endDate}
                  </td>
                  <td className="p-3.5 sm:p-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Déclarer Heures Supplémentaires */}
      {newOvertimeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Déclaration d'Heures Supplémentaires
            </h3>
            <form onSubmit={handleCreateOvertime} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Collaborateur / Équipe
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.matricule}) — {e.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Volume Horaire (Heures)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={otHours}
                    onChange={(e) => setOtHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Barème de Majoration
                  </label>
                  <select
                    value={otRate}
                    onChange={(e) => setOtRate(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-bold"
                  >
                    <option value="25%">25% (Journée au-delà de 8h)</option>
                    <option value="50%">50% (Poste de Nuit ou Samedi)</option>
                    <option value="100%">100% (Dimanche / Jour Férié)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Motif &amp; Tâche Réalisée
                </label>
                <textarea
                  rows={2}
                  value={otTask}
                  onChange={(e) => setOtTask(e.target.value)}
                  placeholder="Ex: Soudage tuyauterie d'urgence sur Skid B..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewOvertimeOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl font-bold"
                >
                  Enregistrer les Heures
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Document Modal */}
      {printDoc && (
        <PrintDocumentModal
          isOpen={!!printDoc}
          onClose={() => setPrintDoc(null)}
          documentData={printDoc}
          onDownloaded={() => showToast?.('Document RH téléchargé en PDF.')}
        />
      )}
    </div>
  );
};
