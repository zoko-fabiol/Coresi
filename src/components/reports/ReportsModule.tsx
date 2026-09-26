import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  FileCheck,
  Download,
  CheckCircle,
  Eye,
  Calendar,
  User,
  MapPin,
  Search,
  Filter,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { TechnicalReport } from '../../types/advancedModules';
import { ReportService } from '../../services/reportService';
import { DataService } from '../../services/dataService';
import { Project } from '../../types';
import { DetailSidebar, SidebarSection, SidebarField, SidebarDivider } from '../shared/DetailSidebar';

interface ReportsModuleProps {
  reports: TechnicalReport[];
  projects: Project[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  reports,
  projects,
  onRefresh,
  showToast,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<TechnicalReport | null>(null);
  const [newReportOpen, setNewReportOpen] = useState(false);

  // Form State
  const [repType, setRepType] = useState<TechnicalReport['type']>('rapport_chantier');
  const [repTitle, setRepTitle] = useState('');
  const [repProjectId, setRepProjectId] = useState(projects[0]?.id || '');
  const [repParticipants, setRepParticipants] = useState('');
  const [repSummary, setRepSummary] = useState('');
  const [repWorkPerformed, setRepWorkPerformed] = useState('');
  const [repObservations, setRepObservations] = useState('');
  const [repIssues, setRepIssues] = useState('');
  const [repReserves, setRepReserves] = useState('');
  const [repRecommendations, setRepRecommendations] = useState('');

  const currentUser = DataService.getCurrentUser();

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repTitle.trim() || !repSummary.trim()) {
      showToast('Veuillez renseigner au minimum le titre et la synthèse.');
      return;
    }

    const proj = projects.find((p) => p.id === repProjectId);
    const participantsList = repParticipants
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    await ReportService.createReport({
      type: repType,
      title: repTitle,
      projectId: repProjectId || undefined,
      projectName: proj?.name || 'Base Industrielle',
      authorId: currentUser.uid,
      authorName: currentUser.displayName,
      date: new Date().toISOString().split('T')[0],
      participants: participantsList.length > 0 ? participantsList : [currentUser.displayName],
      summary: repSummary,
      workPerformed: repWorkPerformed,
      observations: repObservations,
      issues: repIssues || undefined,
      reserves: repReserves || undefined,
      recommendations: repRecommendations || undefined,
      actionItems: [],
      attachments: [],
    });

    setNewReportOpen(false);
    setRepTitle('');
    setRepSummary('');
    setRepWorkPerformed('');
    setRepObservations('');
    setRepIssues('');
    setRepReserves('');
    setRepRecommendations('');
    onRefresh();
    showToast('Rapport / PV technique enregistré avec succès.');
  };

  const handleValidateReport = async (rep: TechnicalReport) => {
    await ReportService.validateReport(rep.id, currentUser.displayName, currentUser.role);
    onRefresh();
    if (selectedReport && selectedReport.id === rep.id) {
      setSelectedReport({
        ...rep,
        status: 'valide',
        validatedBy: `${currentUser.displayName} (${currentUser.role.toUpperCase()})`,
        validatedAt: new Date().toISOString(),
      });
    }
    showToast(`Rapport ${rep.reference} validé formellement.`);
  };

  const handleDownloadPdf = (rep: TechnicalReport) => {
    ReportService.generatePdf(rep);
    showToast(`Export PDF généré pour : ${rep.reference}`);
  };

  const filteredReports = reports.filter((r) => {
    const matchesType = selectedType === 'all' || r.type === selectedType;
    const matchesSearch =
      r.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.projectName && r.projectName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-600/10 border border-green-600/20 flex items-center justify-center text-green-400">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Rapports & Procès-Verbaux (PV)</h1>
            <p className="text-sm text-slate-400">
              Rapports de chantier, épreuves hydrauliques, PV de réception et constats techniques
            </p>
          </div>
        </div>

        <button
          onClick={() => setNewReportOpen(true)}
          className="px-4 py-2.5 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition-colors shadow-lg shadow-green-700/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Rédiger un Rapport / PV
        </button>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'rapport_chantier', label: 'Chantiers' },
            { id: 'epreuve_hydraulique', label: 'Épreuves HP' },
            { id: 'pv_reception', label: 'PV Réception' },
            { id: 'inspection', label: 'Inspections & CND' },
            { id: 'securite_hse', label: 'HSE & Sécurité' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-green-700 text-white shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher rapport, PV..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-green-600"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((rep) => (
          <div
            key={rep.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-green-400 border border-slate-700">
                  {rep.reference}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    rep.status === 'valide'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {rep.status}
                </span>
              </div>

              <h3 className="font-bold text-white text-base mb-2 group-hover:text-green-400 transition-colors line-clamp-2">
                {rep.title}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-3 mb-4">{rep.summary}</p>

              <div className="space-y-1.5 text-xs text-slate-400 mb-4 pt-3 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{rep.date}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{rep.projectName || 'Base Industrielle'}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{rep.authorName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedReport(rep)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> Consulter
              </button>

              <div className="flex items-center gap-1.5">
                {rep.status === 'soumis' && (
                  <button
                    onClick={() => handleValidateReport(rep)}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors"
                  >
                    Valider
                  </button>
                )}
                <button
                  onClick={() => handleDownloadPdf(rep)}
                  className="p-1.5 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-600/30 rounded-xl transition-colors cursor-pointer"
                  title="Télécharger en PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredReports.length === 0 && (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            Aucun rapport ou procès-verbal trouvé dans cette catégorie.
          </div>
        )}
      </div>

      {/* DetailSidebar: Report/PV Detail */}
      <DetailSidebar
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={selectedReport?.title || ''}
        subtitle={selectedReport ? `${selectedReport.projectName || 'Base'} • ${selectedReport.date} • ${selectedReport.authorName}` : ''}
        referenceCode={selectedReport?.reference}
        width="wide"
        badge={
          selectedReport
            ? {
                text: selectedReport.status,
                color:
                  selectedReport.status === 'valide'
                    ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
                    : 'bg-amber-900/40 text-amber-300 border-amber-700',
              }
            : undefined
        }
        actions={
          selectedReport
            ? [
                ...(selectedReport.status === 'soumis'
                  ? [{
                      label: 'Valider le Document',
                      icon: <CheckCircle className="w-3.5 h-3.5" />,
                      onClick: () => { handleValidateReport(selectedReport); },
                      variant: 'success' as const,
                    }]
                  : []),
                {
                  label: 'Télécharger PDF',
                  icon: <Download className="w-3.5 h-3.5" />,
                  onClick: () => selectedReport && handleDownloadPdf(selectedReport),
                  variant: 'primary' as const,
                },
              ]
            : []
        }
      >
        {selectedReport && (
          <>
            <SidebarSection title="Participants / Équipe" icon={<User className="w-3.5 h-3.5" />}>
              <p className="text-xs bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                {selectedReport.participants?.join(' • ') || 'Non spécifié'}
              </p>
            </SidebarSection>

            <SidebarDivider />

            <SidebarSection title="1. Synthèse / Objet" icon={<BookOpen className="w-3.5 h-3.5" />}>
              <p className="text-xs bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {selectedReport.summary}
              </p>
            </SidebarSection>

            <SidebarSection title="2. Travaux & Constatations">
              <p className="text-xs bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {selectedReport.workPerformed || selectedReport.observations}
              </p>
            </SidebarSection>

            {selectedReport.issues && (
              <SidebarSection title="3. Points Bloquants / Anomalies">
                <p className="text-xs bg-red-50 dark:bg-rose-950/20 p-3 rounded-xl border border-red-200 dark:border-rose-900/40 text-red-700 dark:text-rose-200">
                  {selectedReport.issues}
                </p>
              </SidebarSection>
            )}

            {selectedReport.reserves && (
              <SidebarSection title="4. Réserves Formulées">
                <p className="text-xs bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-200">
                  {selectedReport.reserves}
                </p>
              </SidebarSection>
            )}

            {selectedReport.recommendations && (
              <SidebarSection title="5. Recommandations">
                <p className="text-xs bg-green-50 dark:bg-green-950/20 p-3 rounded-xl border border-green-200 dark:border-green-900/40 text-green-700 dark:text-green-200">
                  {selectedReport.recommendations}
                </p>
              </SidebarSection>
            )}

            {selectedReport.validatedBy && (
              <>
                <SidebarDivider />
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold">Document Officiellement Validé</div>
                    <div>Par {selectedReport.validatedBy} le {selectedReport.validatedAt?.split('T')[0]}</div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </DetailSidebar>

      {/* Modal: Nouveau Rapport / PV */}
      {newReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Rédiger un Rapport ou Procès-Verbal (PV)</h2>
            <form onSubmit={handleCreateReport} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Type de Document</label>
                  <select
                    value={repType}
                    onChange={(e) => setRepType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="rapport_chantier">Rapport de Chantier</option>
                    <option value="epreuve_hydraulique">PV d'Épreuve Hydraulique (HP)</option>
                    <option value="pv_reception">PV de Réception de Travaux</option>
                    <option value="inspection">Rapport d'Inspection / CND</option>
                    <option value="maintenance">Rapport d'Intervention Maintenance</option>
                    <option value="securite_hse">Rapport Sécurité / HSE</option>
                    <option value="qualite">Fiche Qualité / Non-Conformité</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Projet / Chantier</label>
                  <select
                    value={repProjectId}
                    onChange={(e) => setRepProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Titre Officiel du Document</label>
                <input
                  type="text"
                  placeholder="Ex: Procès-Verbal d'Épreuve Hydraulique Ligne 4 pouces Djeno..."
                  value={repTitle}
                  onChange={(e) => setRepTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Participants / Signataires (séparés par des virgules)</label>
                <input
                  type="text"
                  placeholder="Ex: Ing. Paul Kimbembe (CORESI), Inspecteur Bureau Veritas, Représentant TotalEnergies..."
                  value={repParticipants}
                  onChange={(e) => setRepParticipants(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">1. Objet & Synthèse</label>
                <textarea
                  rows={2}
                  placeholder="Synthèse claire de l'intervention ou du constat..."
                  value={repSummary}
                  onChange={(e) => setRepSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">2. Travaux Réalisés / Constatations Détaillées</label>
                <textarea
                  rows={3}
                  placeholder="Détails techniques, pressions appliquées, contrôles ressuage, métrologie..."
                  value={repWorkPerformed}
                  onChange={(e) => setRepWorkPerformed(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Réserves éventuelles</label>
                  <textarea
                    rows={2}
                    placeholder="Réserves mineures ou majeures..."
                    value={repReserves}
                    onChange={(e) => setRepReserves(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Recommandations techniques</label>
                  <textarea
                    rows={2}
                    placeholder="Actions requises avant mise en service..."
                    value={repRecommendations}
                    onChange={(e) => setRepRecommendations(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewReportOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Enregistrer et Soumettre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
