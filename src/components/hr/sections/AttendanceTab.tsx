import React, { useState } from 'react';
import {
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Calendar,
  MapPin,
  User,
  Search,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { AttendanceRecord, Employee } from '../../../types';
import { AttendanceService } from '../../../services/attendanceService';
import { PrintDocumentModal, PrintDocumentData } from '../../shared/PrintDocumentModal';

interface AttendanceTabProps {
  employees: Employee[];
  showToast?: (msg: string) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  employees,
  showToast,
}) => {
  const [records, setRecords] = useState<AttendanceRecord[]>(() =>
    AttendanceService.getRecords(employees)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [newCheckInOpen, setNewCheckInOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [checkInTime, setCheckInTime] = useState('07:00');
  const [checkInSite, setCheckInSite] = useState('Base Djeno (Onshore)');

  // Print Modal State
  const [printDoc, setPrintDoc] = useState<PrintDocumentData | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter((r) => r.date === today);

  const presentCount = todayRecords.filter((r) => r.status === 'present').length;
  const lateCount = todayRecords.filter((r) => r.status === 'retard').length;
  const totalOvertimeMins = todayRecords.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);

  const handleRecordCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === selectedEmpId);
    if (!emp) return;

    const newRec = AttendanceService.recordCheckIn(emp, checkInTime, checkInSite);
    setRecords(AttendanceService.getRecords(employees));
    setNewCheckInOpen(false);
    showToast?.(`Pointage enregistré pour ${emp.fullName} à ${checkInTime}`);
  };

  const handleCheckOut = (recordId: string) => {
    const nowTime = new Date().toTimeString().slice(0, 5);
    AttendanceService.recordCheckOut(recordId, nowTime);
    setRecords(AttendanceService.getRecords(employees));
    showToast?.(`Fin de poste enregistrée à ${nowTime}`);
  };

  const handleOpenPrintRegistry = () => {
    const tableColumns = [
      'Matricule',
      'Collaborateur',
      'Chantier / Site',
      'Entrée',
      'Sortie',
      'Statut',
      'Retard',
      'Heures Sup',
    ];

    const tableRows = todayRecords.map((r) => [
      r.matricule,
      r.employeeName,
      r.siteName || 'Base Djeno',
      r.checkInTime,
      r.checkOutTime || '--:--',
      r.status.toUpperCase(),
      r.delayMinutes > 0 ? `+${r.delayMinutes} min` : 'À l’heure',
      r.overtimeMinutes > 0 ? `${(r.overtimeMinutes / 60).toFixed(1)} h` : '-',
    ]);

    setPrintDoc({
      type: 'attendance',
      title: 'REGISTRE JOURNALIER DE POINTAGE & PRÉSENCES',
      reference: `POINTAGE-${today}`,
      date: today,
      periodLabel: today,
      tableColumns,
      tableRows,
      notes: `Effectif total pointé : ${todayRecords.length} collaborateurs. Présents : ${presentCount} | Retards constatés : ${lateCount}. Émargement certifié par le Chef de Chantier.`,
    });
  };

  const filtered = todayRecords.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.matricule.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSite = selectedSite === 'all' || r.siteName === selectedSite;
    return matchesSearch && matchesSite;
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Présents Chantier</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">{presentCount}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Pointés avant 07h10</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Retards Détectés</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">{lateCount}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Déductions automatiques</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Heures Sup. du Jour</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {(totalOvertimeMins / 60).toFixed(1)} h
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Postes prolongés après 16h30</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-[#E8731A]">Sites Actifs</span>
            <MapPin className="w-4 h-4 text-[#E8731A]" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">4 Bases</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Djeno, Port, Base Sud, Pointe-Noire</p>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher ouvrier, matricule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-green-600"
            />
          </div>

          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-semibold"
          >
            <option value="all">Tous les sites</option>
            <option value="Base Djeno (Onshore)">Base Djeno (Onshore)</option>
            <option value="Chantier Pointe-Noire">Chantier Pointe-Noire</option>
            <option value="Terminal Pétrolier">Terminal Pétrolier</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenPrintRegistry}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer Registre A4</span>
          </button>

          <button
            type="button"
            onClick={() => setNewCheckInOpen(true)}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-green-700/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Pointage</span>
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-slate-950/60 uppercase text-[10px] text-slate-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800 font-bold tracking-wider">
              <tr>
                <th className="p-3.5 sm:p-4">Collaborateur / Matricule</th>
                <th className="p-3.5 sm:p-4">Chantier / Base</th>
                <th className="p-3.5 sm:p-4">Arrivée</th>
                <th className="p-3.5 sm:p-4">Départ</th>
                <th className="p-3.5 sm:p-4">Statut &amp; Ponctualité</th>
                <th className="p-3.5 sm:p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 sm:p-4">
                    <p className="font-extrabold text-slate-900 dark:text-white text-xs">{r.employeeName}</p>
                    <span className="font-mono text-[10px] font-bold text-green-700 dark:text-green-400">
                      {r.matricule}
                    </span>
                  </td>

                  <td className="p-3.5 sm:p-4">
                    <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {r.siteName || 'Base Djeno'}
                    </span>
                  </td>

                  <td className="p-3.5 sm:p-4">
                    <span className="font-mono font-bold text-slate-900 dark:text-white bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {r.checkInTime}
                    </span>
                  </td>

                  <td className="p-3.5 sm:p-4">
                    {r.checkOutTime ? (
                      <span className="font-mono font-bold text-slate-900 dark:text-white bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {r.checkOutTime}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">En poste</span>
                    )}
                  </td>

                  <td className="p-3.5 sm:p-4">
                    {r.status === 'present' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> À l’heure
                      </span>
                    )}
                    {r.status === 'retard' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3 text-amber-600" /> Retard (+{r.delayMinutes} min)
                      </span>
                    )}
                    {r.overtimeMinutes > 0 && (
                      <span className="ml-1.5 text-[10px] font-bold text-green-700 dark:text-green-400">
                        +{(r.overtimeMinutes / 60).toFixed(1)}h sup
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 sm:p-4 text-right">
                    {!r.checkOutTime ? (
                      <button
                        type="button"
                        onClick={() => handleCheckOut(r.id)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Valider Sortie
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">Poste clôturé</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Enregistrer un pointage */}
      {newCheckInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Enregistrer un Pointage Chantier
            </h3>
            <form onSubmit={handleRecordCheckIn} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Collaborateur / Ouvrier
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
                    Heure d'Arrivée
                  </label>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Site d'Affectation
                  </label>
                  <select
                    value={checkInSite}
                    onChange={(e) => setCheckInSite(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
                  >
                    <option value="Base Djeno (Onshore)">Base Djeno (Onshore)</option>
                    <option value="Chantier Pointe-Noire">Chantier Pointe-Noire</option>
                    <option value="Terminal Pétrolier">Terminal Pétrolier</option>
                    <option value="Atelier Préfabrication">Atelier Préfabrication</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewCheckInOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl font-bold"
                >
                  Valider le Pointage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print / Export Modal */}
      {printDoc && (
        <PrintDocumentModal
          isOpen={!!printDoc}
          onClose={() => setPrintDoc(null)}
          documentData={printDoc}
          onDownloaded={() => showToast?.('Registre de pointage téléchargé en PDF.')}
        />
      )}
    </div>
  );
};
