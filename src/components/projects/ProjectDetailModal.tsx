import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  FileText,
  DollarSign,
  Users,
  Wrench,
  Calendar,
  MapPin,
  Building2,
  TrendingUp,
  Download,
  Eye,
  Plus,
  Clock,
  CheckCircle,
  Image as ImageIcon,
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { Project, DocumentRecord, Expense, Employee, Material, ProjectPhoto } from '../../types';
import { DataService } from '../../services/dataService';
import { jsPDF } from 'jspdf';
import { CloudinaryService } from '../../services/cloudinaryService';
import { DetailSidebar } from '../shared/DetailSidebar';
import { PrintDocumentModal, PrintDocumentData } from '../shared/PrintDocumentModal';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentRecord[];
  expenses: Expense[];
  employees: Employee[];
  materials: Material[];
  onScanForProject: (project: Project) => void;
  onSelectDocument: (doc: DocumentRecord) => void;
  onUpdateProjectProgress: (projectId: string, newProgress: number) => void;
  onRefresh?: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  documents,
  expenses,
  employees,
  materials,
  onScanForProject,
  onSelectDocument,
  onUpdateProjectProgress,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'finances' | 'team' | 'materials' | 'photos'>('overview');
  const [editingProgress, setEditingProgress] = useState<number>(project?.progress || 0);
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  const [printDoc, setPrintDoc] = useState<PrintDocumentData | null>(null);

  useEffect(() => {
    if (project) {
      setEditingProgress(project.progress || 0);
    }
  }, [project?.id, project?.progress, isOpen]);

  if (!isOpen || !project) return null;

  const projectDocs = documents.filter((d) => d.context.projectId === project.id);
  const projectExpenses = expenses.filter((e) => e.projectId === project.id);
  const projectWorkers = employees.filter((e) => e.assignedProjectId === project.id);
  const projectMaterials = materials.filter((m) => m.assignedProjectId === project.id);
  const projectPhotos: ProjectPhoto[] = DataService.getProjectPhotos(project.id);

  const spentRatio = Math.min(100, Math.round((project.spent / project.budget) * 100));

  const handlePreviewProjectReport = () => {
    const docData: PrintDocumentData = {
      type: 'project_summary',
      title: `SYNTHÈSE TECHNIQUE & FINANCIÈRE DE CHANTIER - ${project.code}`,
      reference: `RAP-${project.code}-${new Date().getMonth() + 1}`,
      date: new Date().toISOString().split('T')[0],
      clientName: project.clientName,
      siteName: `${project.name} (${project.location})`,
      periodLabel: `Du ${project.startDate} au ${project.endDate}`,
      statusLabel: project.status.toUpperCase(),
      totalHT: project.spent,
      totalTTC: project.budget,
      tableColumns: ['Indicateur Chantier', 'Valeur Réalisée / Cible', 'Taux & Performance', 'Commentaires'],
      tableRows: [
        ['Avancement Physique des Travaux', `${project.progress}%`, `${project.progress}%`, 'Conforme au planning jalons'],
        ['Budget Global Alloué (TTC)', `${project.budget.toLocaleString('fr-FR')} FCFA`, '100%', 'Plafond contractuel'],
        ['Dépenses & Engagements Cumulés', `${project.spent.toLocaleString('fr-FR')} FCFA`, `${spentRatio}%`, `Solde restant : ${(project.budget - project.spent).toLocaleString('fr-FR')} FCFA`],
        ['Effectif Mobilisé sur Site', `${projectWorkers.length} agents qualifiés`, 'Opérationnel', 'Personnel agréé CORESI'],
        ['Équipements & Engins Affectés', `${projectMaterials.length} matériels lourds`, 'En service', 'Parc outillage certifié'],
        ['Pièces GED Archivées', `${projectDocs.length} documents / PV`, 'Archivé GED', 'Traçabilité complète'],
      ],
      summaryItems: [
        { label: 'Avancement Travaux', value: `${project.progress}%`, highlight: true },
        { label: 'Consommation Budget', value: `${spentRatio}%` },
        { label: 'Chef de Projet', value: project.managerName },
        { label: 'Localisation', value: project.location },
      ],
      notes: 'Rapport officiel CORESI. Conforme aux spécifications techniques et aux normes de soudage ASME IX / ISO 9606-1.',
      visaText: 'Dr. Joseph Ndoundo - Directeur Général',
    };
    setPrintDoc(docData);
  };

  // Generate real PDF Progress Report for this Project and archive it to GED!
  const handleGenerateProjectReport = async () => {
    setGeneratingReport(true);
    const pdf = new jsPDF();

    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, 210, 40, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text('CORESI INTERNATIONAL SARL', 14, 20);

    pdf.setFontSize(10);
    pdf.setTextColor(6, 182, 212); // cyan
    pdf.text('RAPPORT DE CHANTIER & ÉVOLUTION DES TRAVAUX', 14, 30);

    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(14);
    pdf.text(`Chantier : ${project.code} - ${project.name}`, 14, 55);

    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Client Donneur d'Ordre : ${project.clientName}`, 14, 65);
    pdf.text(`Localisation : ${project.location} | Chef de Projet : ${project.managerName}`, 14, 72);
    pdf.text(`Période : ${project.startDate} au ${project.endDate}`, 14, 79);

    // Box KPI
    pdf.setDrawColor(203, 213, 225);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(14, 88, 182, 35, 3, 3, 'FD');

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(11);
    pdf.text(`Budget Prévu : ${project.budget.toLocaleString('fr-FR')} FCFA`, 20, 100);
    pdf.text(`Dépenses Engagées : ${project.spent.toLocaleString('fr-FR')} FCFA (${spentRatio}%)`, 20, 108);
    pdf.text(`Avancement Physique des Travaux : ${project.progress}%`, 20, 116);

    // Section documents & expenses summary
    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Synthèse des Pièces et Équipes :', 14, 140);

    pdf.setFontSize(10);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`• Nombre de documents GED numérisés & validés : ${projectDocs.length}`, 14, 150);
    pdf.text(`• Effectif technique mobilisé sur site : ${projectWorkers.length} agents qualifiés`, 14, 158);
    pdf.text(`• Équipements lourds et outillage affectés : ${projectMaterials.length} unités`, 14, 166);
    pdf.text(`• Nombre de dépenses enregistrées avec justificatif : ${projectExpenses.length}`, 14, 174);

    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text('VISA ET APPROBATION DIRECTION GÉNÉRALE :', 14, 210);
    pdf.text('Dr. Joseph Ndoundo - Directeur Général', 14, 240);

    const pdfDataUri = pdf.output('datauristring');

    // Archive automatically to GED!
    const cloudinaryMeta = await CloudinaryService.uploadFile(
      pdfDataUri,
      `Rapport_Chantier_${project.code}_${new Date().toISOString().split('T')[0]}.pdf`,
      `projects/${project.id}/reports`,
      'raw'
    );

    const reportDoc: DocumentRecord = {
      id: `doc-rep-${Date.now()}`,
      title: `Rapport d'Avancement Chantier - ${project.code}`,
      documentNumber: `RAP-${project.code}-${new Date().getMonth() + 1}`,
      category: 'rapports',
      cloudinary: cloudinaryMeta,
      ocr: {
        text: `RAPPORT D'AVANCEMENT DE CHANTIER CORESI - ${project.name} - Budget ${project.budget} FCFA - Avancement ${project.progress}%`,
        confidence: 100,
        processedAt: new Date().toISOString(),
      },
      context: {
        projectId: project.id,
        projectName: project.name,
        clientId: project.clientId,
        clientName: project.clientName,
      },
      metadata: {
        documentDate: new Date().toISOString().split('T')[0],
        description: `Rapport généré automatiquement pour le chantier ${project.name}`,
        tags: ['rapport', 'avancement', project.code.toLowerCase(), 'direction'],
      },
      status: 'validated',
      uploadedBy: DataService.getCurrentUser().displayName,
      uploadedById: DataService.getCurrentUser().uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await DataService.saveDocument(reportDoc);
    setGeneratingReport(false);
    if (onRefresh) onRefresh();
    alert(`Le rapport de chantier ${project.code} a été généré et archivé directement dans la GED !`);
  };

  return (
    <>
      <DetailSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={project.name}
      subtitle={`${project.clientName} • ${project.location}`}
      referenceCode={project.code}
      badge={{
        text: project.status === 'in_progress' ? 'En cours' : project.status === 'completed' ? 'Livré' : 'Planifié',
        color: project.status === 'in_progress' ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
      }}
      width="full"
      documents={projectDocs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        type: doc.category.toUpperCase(),
        url: doc.cloudinary.secureUrl,
        date: doc.createdAt?.split('T')[0],
      }))}
      onDocumentClick={(doc) => {
        const found = documents.find((d) => d.id === doc.id);
        if (found) onSelectDocument(found);
      }}
      actions={[
        {
          label: 'Aperçu A4 Synthèse',
          icon: <Printer className="w-3.5 h-3.5 text-emerald-400" />,
          onClick: handlePreviewProjectReport,
          variant: 'secondary',
        },
        {
          label: generatingReport ? 'Génération...' : 'Archiver PDF GED',
          icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
          onClick: handleGenerateProjectReport,
          disabled: generatingReport,
          variant: 'secondary',
        },
        {
          label: 'Numériser',
          icon: <Camera className="w-3.5 h-3.5" />,
          onClick: () => onScanForProject(project),
          variant: 'primary',
        },
      ]}
    >
      {/* Tab switcher */}
      <div className="bg-slate-100 dark:bg-slate-950/60 -mx-5 -mt-4 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'documents' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documents GED ({projectDocs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('finances')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'finances' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Finances &amp; Justificatifs ({projectExpenses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'photos' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos Chantier ({projectPhotos.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'team' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Équipe ({projectWorkers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'materials' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Matériel ({projectMaterials.length})</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="pt-2">
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-4xl">
              {/* Financial & physical progress banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Budget Total Contractuel</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {project.budget.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Dépenses Réalisées</span>
                  <span className={`text-xl font-bold font-mono ${spentRatio > 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {project.spent.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className="text-[11px] text-slate-400 ml-1">({spentRatio}% consommé)</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 sm:col-span-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200">Avancement Physique des Travaux</span>
                        <p className="text-[10px] text-slate-400">Ajustez le curseur pour voir la projection en direct avant d'enregistrer</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block leading-none">Niveau Actuel</span>
                        <span className="text-xs font-mono font-semibold text-slate-300">{project.progress}%</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                      <div className="px-2.5 py-1 rounded-xl bg-green-950/80 border border-green-700 text-green-300 font-mono text-sm font-black flex items-center gap-1.5 shadow-xs">
                        <span>Cible : {editingProgress}%</span>
                        {editingProgress !== project.progress && (
                          <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${editingProgress > project.progress ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                            {editingProgress > project.progress ? `+${editingProgress - project.progress}%` : `${editingProgress - project.progress}%`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dual-layer Live Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-900 rounded-full h-3.5 p-0.5 border border-slate-800 relative overflow-hidden flex items-center">
                      {/* Dynamic target ghost preview bar */}
                      <div
                        className="h-full rounded-full transition-all duration-150 opacity-40 bg-gradient-to-r from-emerald-400 to-green-500 absolute left-0.5 top-0.5"
                        style={{ width: `calc(${editingProgress}% - 4px)` }}
                      />
                      {/* Solid registered baseline bar */}
                      <div
                        className="h-full rounded-full transition-all duration-300 bg-[#3B7A2C] relative z-10 shadow-xs"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono px-0.5">
                      <span>0% (Démarrage)</span>
                      <span>50% (Mi-parcours)</span>
                      <span>100% (Réception provisoire)</span>
                    </div>
                  </div>

                  {/* Controls: Step buttons, Slider, and Quick Milestones */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
                    <div className="sm:col-span-8 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProgress((prev) => Math.max(0, prev - 5))}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer shrink-0"
                        title="-5%"
                      >
                        -5%
                      </button>

                      <div className="flex-1 relative flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editingProgress}
                          onChange={(e) => setEditingProgress(Number(e.target.value))}
                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#3B7A2C]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingProgress((prev) => Math.min(100, prev + 5))}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer shrink-0"
                        title="+5%"
                      >
                        +5%
                      </button>

                      <div className="w-16 shrink-0 relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingProgress}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val)) setEditingProgress(Math.max(0, Math.min(100, val)));
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-mono font-bold text-white focus:border-green-600 focus:outline-none"
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 pointer-events-none">%</span>
                      </div>
                    </div>

                    {/* Milestones & Save action */}
                    <div className="sm:col-span-4 flex items-center justify-end gap-2">
                      {editingProgress !== project.progress && (
                        <button
                          type="button"
                          onClick={() => setEditingProgress(project.progress || 0)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Annuler les modifications et revenir à la valeur enregistrée"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onUpdateProjectProgress(project.id, editingProgress)}
                        disabled={editingProgress === project.progress}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          editingProgress !== project.progress
                            ? 'bg-[#3B7A2C] hover:bg-[#2D6020] text-white shadow-md shadow-emerald-950/30 active:scale-95'
                            : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {editingProgress !== project.progress
                            ? `Enregistrer : ${editingProgress}%`
                            : `À jour (${project.progress}%)`}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Fast Milestone Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                    <span className="text-slate-500 mr-1">Paliers rapides :</span>
                    {[
                      { val: 10, label: '10% Démarrage' },
                      { val: 25, label: '25% Ébauche' },
                      { val: 50, label: '50% Montage' },
                      { val: 75, label: '75% Soudure/CND' },
                      { val: 90, label: '90% Épreuves' },
                      { val: 100, label: '100% Terminé' },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setEditingProgress(p.val)}
                        className={`px-2 py-0.5 rounded-md border font-mono transition-colors cursor-pointer ${
                          editingProgress === p.val
                            ? 'bg-green-700/30 border-green-600 text-green-300 font-bold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description & Technical details */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="font-semibold text-sm text-white">Spécifications et Descriptif Technique</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{project.description}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Localisation</span>
                    <span className="font-medium text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {project.location}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Chef de Projet</span>
                    <span className="font-medium text-white">{project.managerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date Début</span>
                    <span className="font-medium text-white">{project.startDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Livraison Prévue</span>
                    <span className="font-medium text-white">{project.endDate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Documents GED attachés à ce projet</h4>
                <button
                  onClick={() => onScanForProject(project)}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Numériser un document</span>
                </button>
              </div>

              {projectDocs.length === 0 ? (
                <div className="text-center py-12 bg-slate-950 rounded-xl border border-slate-800 p-6">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 mb-3">Aucun document n'a encore été associé à ce chantier.</p>
                  <button
                    onClick={() => onScanForProject(project)}
                    className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Numériser le premier document
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {projectDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => onSelectDocument(doc)}
                      className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer flex gap-3 transition-colors"
                    >
                      <img
                        src={doc.cloudinary.secureUrl}
                        alt=""
                        className="w-12 h-16 object-cover rounded border border-slate-700 shrink-0"
                      />
                      <div className="overflow-hidden flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-semibold text-xs text-white truncate">{doc.title}</p>
                          <p className="font-mono text-[10px] text-cyan-300">{doc.documentNumber}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{doc.category.replace('_', ' ')}</p>
                        </div>
                        <span className="text-[10px] text-slate-500">{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Galerie Photos &amp; Évolutions de Chantier</h4>
                  <p className="text-xs text-slate-400">Suivi visuel des soudures, épreuves et montage métallique</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {projectPhotos.map((photo) => (
                  <div key={photo.id} className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
                    <div className="aspect-[4/3] bg-black overflow-hidden">
                      <img src={photo.photoUrl} alt={photo.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-3 text-xs">
                      <span className="text-[10px] font-semibold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {photo.phase}
                      </span>
                      <p className="font-semibold text-white mt-1.5">{photo.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Prise le {photo.date} par {photo.uploadedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'finances' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white">Dépenses engagées et justificatifs</h4>
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Réf Dépense</th>
                      <th className="py-2.5 px-3">Désignation</th>
                      <th className="py-2.5 px-3">Fournisseur</th>
                      <th className="py-2.5 px-3">Montant</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Justificatif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {projectExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 font-mono text-cyan-300">{exp.reference}</td>
                        <td className="py-2.5 px-3 text-white">{exp.description}</td>
                        <td className="py-2.5 px-3 text-slate-300">{exp.supplierName || '-'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                          {exp.amount.toLocaleString('fr-FR')} {exp.currency}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{exp.date}</td>
                        <td className="py-2.5 px-3">
                          {exp.documentId ? (
                            <span className="text-xs text-cyan-400 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              GED Lié
                            </span>
                          ) : (
                            <span className="text-slate-500">Non attaché</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white">Techniciens et ingénieurs affectés au chantier</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projectWorkers.map((emp) => (
                  <div key={emp.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold flex items-center justify-center text-xs">
                      {emp.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-white">{emp.fullName}</p>
                      <p className="text-[11px] text-slate-400">{emp.role}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{emp.phone} • {emp.matricule}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white">Engins et outillages déployés sur site</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projectMaterials.map((mat) => (
                  <div key={mat.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {mat.code}
                      </span>
                      <p className="font-semibold text-xs text-white mt-1">{mat.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Quantité : {mat.quantity} {mat.unit} • État : {mat.condition.replace('_', ' ')}
                      </p>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                      Sur site
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DetailSidebar>

      {/* Universal A4 Document Preview Modal */}
      <PrintDocumentModal
        isOpen={!!printDoc}
        onClose={() => setPrintDoc(null)}
        documentData={printDoc}
      />
    </>
  );
};
