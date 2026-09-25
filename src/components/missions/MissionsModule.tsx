import React, { useState } from 'react';
import {
  Compass,
  Plus,
  CheckCircle,
  Clock,
  Download,
  DollarSign,
  User,
  Calendar,
  MapPin,
  Search,
  FileText,
  AlertCircle,
  Plane,
  Hotel,
  Receipt,
  Banknote,
} from 'lucide-react';
import { Mission, MissionExpense } from '../../types/advancedModules';
import { MissionService } from '../../services/missionService';
import { DataService } from '../../services/dataService';
import { Employee, Project } from '../../types';
import { DetailSidebar, SidebarSection, SidebarField, SidebarDivider } from '../shared/DetailSidebar';

interface MissionsModuleProps {
  missions: Mission[];
  employees: Employee[];
  projects: Project[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const MissionsModule: React.FC<MissionsModuleProps> = ({
  missions,
  employees,
  projects,
  onRefresh,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newMissionOpen, setNewMissionOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [liquidationModalOpen, setLiquidationModalOpen] = useState(false);

  // New Mission Form State
  const [misEmployeeId, setMisEmployeeId] = useState(employees[0]?.id || '');
  const [misProjectId, setMisProjectId] = useState(projects[0]?.id || '');
  const [misDestination, setMisDestination] = useState('');
  const [misPurpose, setMisPurpose] = useState('');
  const [misStartDate, setMisStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [misEndDate, setMisEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [misTransport, setMisTransport] = useState<Mission['transportType']>('route');
  const [misAccommodation, setMisAccommodation] = useState<Mission['accommodation']>('base_vie');
  const [misEstimatedCost, setMisEstimatedCost] = useState(650000);
  const [misAdvanceRequested, setMisAdvanceRequested] = useState(300000);

  // Add Expense State
  const [expCategory, setExpCategory] = useState<MissionExpense['category']>('transport');
  const [expAmount, setExpAmount] = useState(0);
  const [expDescription, setExpDescription] = useState('');

  // Liquidation Notes
  const [liqNotes, setLiqNotes] = useState('');

  const currentUser = DataService.getCurrentUser();

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!misDestination.trim() || !misPurpose.trim()) {
      showToast('Veuillez spécifier la destination et l\'objet de la mission.');
      return;
    }

    const emp = employees.find((e) => e.id === misEmployeeId);
    const proj = projects.find((p) => p.id === misProjectId);

    const start = new Date(misStartDate);
    const end = new Date(misEndDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    await MissionService.requestMission({
      employeeId: misEmployeeId,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Collaborateur',
      employeeMatricule: emp?.matricule || 'MAT-001',
      employeeRole: emp?.role || 'Technicien',
      projectId: misProjectId || undefined,
      projectName: proj?.name || 'Base Industrielle',
      destination: misDestination,
      purpose: misPurpose,
      startDate: misStartDate,
      endDate: misEndDate,
      durationDays: days,
      transportType: misTransport,
      accommodation: misAccommodation,
      estimatedCost: Number(misEstimatedCost) || 0,
      advanceRequested: Number(misAdvanceRequested) || 0,
    });

    setNewMissionOpen(false);
    setMisDestination('');
    setMisPurpose('');
    onRefresh();
    showToast('Demande de mission soumise pour visa Direction Générale.');
  };

  const handleApproveMission = async (mis: Mission) => {
    await MissionService.approveMission(
      mis.id,
      mis.advanceRequested || 0,
      'Virement bancaire / Caisse',
      currentUser.displayName
    );
    onRefresh();
    showToast(`Ordre de mission ${mis.reference} approuvé avec avance accordée.`);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMission || expAmount <= 0 || !expDescription.trim()) {
      showToast('Veuillez remplir le montant et la description du frais.');
      return;
    }

    await MissionService.addExpense(selectedMission.id, {
      category: expCategory,
      date: new Date().toISOString().split('T')[0],
      amount: Number(expAmount),
      currency: 'FCFA',
      description: expDescription,
    });

    setExpenseModalOpen(false);
    setExpAmount(0);
    setExpDescription('');
    onRefresh();

    // Update selected mission in state
    const updated = DataService.getMissions().find((m) => m.id === selectedMission.id);
    if (updated) setSelectedMission(updated);
    showToast('Justificatif de dépense enregistré.');
  };

  const handleLiquidate = async () => {
    if (!selectedMission) return;
    const res = await MissionService.liquidateMission(
      selectedMission.id,
      liqNotes || 'Liquidation régulière des frais de mission et justificatifs contrôlés.'
    );

    setLiquidationModalOpen(false);
    onRefresh();
    const updated = DataService.getMissions().find((m) => m.id === selectedMission.id);
    if (updated) setSelectedMission(updated);

    if (res.refundRequired) {
      showToast(`Mission soldée : Reliquat de ${res.balance.toLocaleString('fr-FR')} FCFA à reverser en caisse.`);
    } else if (res.balance < 0) {
      showToast(`Mission soldée : Complément de ${Math.abs(res.balance).toLocaleString('fr-FR')} FCFA dû au collaborateur.`);
    } else {
      showToast('Mission soldée : Solde strictement équilibré à zéro.');
    }
  };

  const handleDownloadPdf = (mis: Mission) => {
    MissionService.generateMissionOrderPdf(mis);
    showToast(`Ordre de mission PDF généré : ${mis.reference}`);
  };

  const filteredMissions = missions.filter(
    (m) =>
      m.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Missions & Déplacements Professionnels</h1>
            <p className="text-sm text-slate-400">
              Ordres de mission, gestion des avances, justificatifs et liquidation financière
            </p>
          </div>
        </div>

        <button
          onClick={() => setNewMissionOpen(true)}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-sm transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" /> Demander une Mission
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-end">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher mission, collaborateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMissions.map((mis) => (
          <div
            key={mis.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700">
                  {mis.reference}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    mis.status === 'soldee'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : mis.status === 'approuvee_dg'
                      ? 'bg-blue-950 text-blue-400 border border-blue-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {mis.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs">
                  {mis.employeeName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight">{mis.employeeName}</h3>
                  <span className="text-xs text-slate-400">{mis.employeeRole}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold truncate">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{mis.destination}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>
                    {mis.startDate} au {mis.endDate} ({mis.durationDays} j)
                  </span>
                </div>
                <p className="text-slate-400 line-clamp-2 pt-1 border-t border-slate-800/60">
                  {mis.purpose}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/40">
                  <span className="text-slate-500 block">Avance perçue :</span>
                  <strong className="text-white font-mono">
                    {(mis.advanceGiven || 0).toLocaleString('fr-FR')} F
                  </strong>
                </div>
                <div className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/40">
                  <span className="text-slate-500 block">Dépenses réelles :</span>
                  <strong className="text-cyan-400 font-mono">
                    {(mis.actualTotalCost || 0).toLocaleString('fr-FR')} F
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedMission(mis)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Détails & Frais
              </button>

              <div className="flex items-center gap-1.5">
                {mis.status === 'demande' && (
                  <button
                    onClick={() => handleApproveMission(mis)}
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-colors"
                  >
                    Valider Mission
                  </button>
                )}
                <button
                  onClick={() => handleDownloadPdf(mis)}
                  className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl transition-colors"
                  title="Télécharger Ordre de Mission PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredMissions.length === 0 && (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            Aucun ordre de mission enregistré.
          </div>
        )}
      </div>

      {/* DetailSidebar: Mission Details, Expenses & Liquidation */}
      <DetailSidebar
        isOpen={!!selectedMission}
        onClose={() => {
          setSelectedMission(null);
          setExpenseModalOpen(false);
          setLiquidationModalOpen(false);
        }}
        title={selectedMission ? `Mission : ${selectedMission.destination}` : ''}
        subtitle={selectedMission ? `${selectedMission.employeeName} — ${selectedMission.employeeRole}` : ''}
        referenceCode={selectedMission?.reference}
        badge={
          selectedMission
            ? {
                text: selectedMission.status.replace(/_/g, ' '),
                color:
                  selectedMission.status === 'soldee'
                    ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
                    : selectedMission.status === 'approuvee_dg'
                    ? 'bg-blue-900/40 text-blue-300 border-blue-700'
                    : 'bg-amber-900/40 text-amber-300 border-amber-700',
              }
            : undefined
        }
        actions={
          selectedMission
            ? [
                ...(selectedMission.status !== 'soldee'
                  ? [
                      {
                        label: 'Liquider & Clôturer',
                        icon: <Banknote className="w-3.5 h-3.5" />,
                        onClick: () => setLiquidationModalOpen(true),
                        variant: 'success' as const,
                      },
                    ]
                  : []),
                {
                  label: 'Ordre de Mission PDF',
                  icon: <Download className="w-3.5 h-3.5" />,
                  onClick: () => selectedMission && handleDownloadPdf(selectedMission),
                  variant: 'primary' as const,
                },
              ]
            : []
        }
      >
        {selectedMission && (
          <>
            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-500 block">Avance perçue</span>
                <strong className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {(selectedMission.advanceGiven || 0).toLocaleString('fr-FR')} F
                </strong>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-500 block">Dépenses réelles</span>
                <strong className="text-sm font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                  {(selectedMission.actualTotalCost || 0).toLocaleString('fr-FR')} F
                </strong>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-500 block">Solde financier</span>
                <strong
                  className={`text-sm font-bold font-mono ${
                    (selectedMission.balanceAmount || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {(selectedMission.balanceAmount || 0).toLocaleString('fr-FR')} F
                </strong>
              </div>
            </div>

            {/* Mission Info */}
            <SidebarSection title="Informations Mission" icon={<Compass className="w-3.5 h-3.5" />}>
              <SidebarField label="Collaborateur" value={selectedMission.employeeName} highlight />
              <SidebarField label="Matricule" value={selectedMission.employeeMatricule || 'N/A'} mono />
              <SidebarField label="Fonction" value={selectedMission.employeeRole} />
              <SidebarField label="Destination" value={selectedMission.destination} highlight />
              <SidebarField label="Objet" value={selectedMission.purpose} />
              <SidebarField label="Dates" value={`${selectedMission.startDate} → ${selectedMission.endDate}`} />
              <SidebarField label="Durée" value={`${selectedMission.durationDays} jours`} mono />
              <SidebarField
                label="Transport"
                value={
                  selectedMission.transportType === 'avion'
                    ? 'Avion Commercial'
                    : selectedMission.transportType === 'navire_offshore'
                    ? 'Navire Offshore'
                    : selectedMission.transportType === 'route'
                    ? 'Route (Véhicule)'
                    : 'Autre'
                }
              />
              <SidebarField
                label="Hébergement"
                value={
                  selectedMission.accommodation === 'base_vie'
                    ? 'Base Vie Chantier'
                    : selectedMission.accommodation === 'hotel'
                    ? 'Hôtel'
                    : 'Autre Logement'
                }
              />
              {selectedMission.projectName && (
                <SidebarField label="Chantier lié" value={selectedMission.projectName} />
              )}
              <SidebarField label="Budget prévisionnel" value={`${(selectedMission.estimatedCost || 0).toLocaleString('fr-FR')} FCFA`} mono />
              <SidebarField label="Avance demandée" value={`${(selectedMission.advanceRequested || 0).toLocaleString('fr-FR')} FCFA`} mono />
            </SidebarSection>

            <SidebarDivider />

            {/* Expenses */}
            <SidebarSection title={`Justificatifs de Frais (${selectedMission.expenses?.length || 0})`} icon={<Receipt className="w-3.5 h-3.5" />}>
              {selectedMission.expenses?.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 dark:text-white truncate">{exp.description}</div>
                    <div className="text-slate-500 dark:text-slate-500">
                      {exp.category.toUpperCase()} • {exp.date}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-white shrink-0 ml-3">
                    {exp.amount.toLocaleString('fr-FR')} F
                  </span>
                </div>
              ))}
              {(!selectedMission.expenses || selectedMission.expenses.length === 0) && (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-100 dark:bg-slate-800/30 rounded-xl">
                  Aucun justificatif de dépense enregistré.
                </p>
              )}

              {/* Inline Expense Form */}
              {selectedMission.status !== 'soldee' && !expenseModalOpen && (
                <button
                  onClick={() => setExpenseModalOpen(true)}
                  className="w-full mt-1 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold transition-colors text-center"
                >
                  + Ajouter un justificatif de frais
                </button>
              )}

              {expenseModalOpen && selectedMission.status !== 'soldee' && (
                <form
                  onSubmit={handleAddExpense}
                  className="p-3 bg-slate-100 dark:bg-slate-800/40 rounded-xl border border-cyan-500/30 space-y-3 mt-2"
                >
                  <p className="text-[11px] font-bold uppercase text-cyan-600 dark:text-cyan-400">Nouveau justificatif</p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Catégorie</label>
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs"
                    >
                      <option value="transport">Transport</option>
                      <option value="hebergement">Hébergement</option>
                      <option value="repas">Restauration & Per Diem</option>
                      <option value="carburant">Carburant & Péages</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Montant (FCFA)</label>
                    <input
                      type="number"
                      placeholder="85000"
                      value={expAmount}
                      onChange={(e) => setExpAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Désignation</label>
                    <input
                      type="text"
                      placeholder="Facture hôtel, reçu carburant..."
                      value={expDescription}
                      onChange={(e) => setExpDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setExpenseModalOpen(false)}
                      className="flex-1 px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 font-bold rounded-xl text-xs"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              )}
            </SidebarSection>

            {/* Liquidation Notes */}
            {selectedMission.liquidationNotes && (
              <>
                <SidebarDivider />
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
                  <strong>Notes de liquidation comptable :</strong> {selectedMission.liquidationNotes}
                </div>
              </>
            )}

            {/* Inline Liquidation Form */}
            {liquidationModalOpen && selectedMission.status !== 'soldee' && (
              <>
                <SidebarDivider />
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Liquidation Financière</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 dark:text-slate-400">Avance reçue :</span>
                      <span className="font-mono text-slate-800 dark:text-white">{(selectedMission.advanceGiven || 0).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 dark:text-slate-400">Total justificatifs :</span>
                      <span className="font-mono text-cyan-600 dark:text-cyan-400">{(selectedMission.actualTotalCost || 0).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex justify-between py-1 border-t border-emerald-200 dark:border-emerald-800 mt-1 font-bold">
                      <span className="text-slate-800 dark:text-white">Solde liquidation :</span>
                      <span
                        className={`font-mono ${
                          (selectedMission.advanceGiven || 0) - (selectedMission.actualTotalCost || 0) >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {((selectedMission.advanceGiven || 0) - (selectedMission.actualTotalCost || 0)).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Observations du comptable</label>
                    <textarea
                      rows={2}
                      placeholder="Pièces conformes et vérifiées, reliquat reversé en caisse..."
                      value={liqNotes}
                      onChange={(e) => setLiqNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLiquidationModalOpen(false)}
                      className="flex-1 px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleLiquidate}
                      className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold rounded-xl text-xs"
                    >
                      Valider & Clôturer
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </DetailSidebar>

      {/* Modal: Nouvelle Demande de Mission */}
      {newMissionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Demande d'Ordre de Mission</h2>
            <form onSubmit={handleCreateMission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Collaborateur concerné</label>
                <select
                  value={misEmployeeId}
                  onChange={(e) => setMisEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} — {emp.role} ({emp.matricule || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Projet / Chantier lié</label>
                <select
                  value={misProjectId}
                  onChange={(e) => setMisProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                >
                  <option value="">Mission de Direction / Générale</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Destination précise</label>
                <input
                  type="text"
                  placeholder="Ex: Plateforme Pétrolière Nkossa Offshore..."
                  value={misDestination}
                  onChange={(e) => setMisDestination(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Objet détaillé de la mission</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Supervision technique épreuves hydrauliques, contrôle soudures..."
                  value={misPurpose}
                  onChange={(e) => setMisPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date départ</label>
                  <input
                    type="date"
                    value={misStartDate}
                    onChange={(e) => setMisStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date retour prévue</label>
                  <input
                    type="date"
                    value={misEndDate}
                    onChange={(e) => setMisEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Moyen de transport</label>
                  <select
                    value={misTransport}
                    onChange={(e) => setMisTransport(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="route">Route (Véhicule Chantier)</option>
                    <option value="avion">Avion Commercial</option>
                    <option value="navire_offshore">Navire Ravitaillement Offshore</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Hébergement</label>
                  <select
                    value={misAccommodation}
                    onChange={(e) => setMisAccommodation(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="base_vie">Base Vie Chantier / Offshore</option>
                    <option value="hotel">Hôtel</option>
                    <option value="autre">Autre Logement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Budget prévisionnel (FCFA)</label>
                  <input
                    type="number"
                    value={misEstimatedCost}
                    onChange={(e) => setMisEstimatedCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Avance demandée (FCFA)</label>
                  <input
                    type="number"
                    value={misAdvanceRequested}
                    onChange={(e) => setMisAdvanceRequested(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewMissionOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm"
                >
                  Transmettre à la Direction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

