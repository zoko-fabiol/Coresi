import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Paperclip,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Filter,
  Upload,
  X,
  User,
  Calendar,
  Layers,
  Wrench,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { Project, ProjectTask, ProjectPhase } from '../../types';
import { DataService } from '../../services/dataService';
import { DocumentViewerModal } from '../shared/DocumentViewerModal';
import { uploadFileWithProgress } from '../../services/cloudinaryService';

interface ProjectsKanbanViewProps {
  projects: Project[];
  onRefresh?: () => void;
}

const PHASES: { id: ProjectPhase; label: string; sub: string; color: string; border: string; bg: string }[] = [
  {
    id: 'etude_appro',
    label: '1. Études & Appro',
    sub: 'Plans ISO, matières, approvisionnement',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-950/20',
  },
  {
    id: 'atelier_soudure',
    label: '2. Préfab Atelier',
    sub: 'Débit, assemblage & soudures qualifiées',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-950/20',
  },
  {
    id: 'montage_site',
    label: '3. Montage Site',
    sub: 'Levage, boulonnage & raccordements',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-950/20',
  },
  {
    id: 'epreuve_reception',
    label: '4. Épreuve & Réception',
    sub: 'Tests sous pression, PV et quitus',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-950/20',
  },
];

export const ProjectsKanbanView: React.FC<ProjectsKanbanViewProps> = ({ projects, onRefresh }) => {
  const [tasks, setTasks] = useState<ProjectTask[]>(DataService.getProjectTasks());
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [viewerItem, setViewerItem] = useState<{ url: string; name: string; type?: string; metadata?: Record<string, string> } | null>(null);

  // New task modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetProjectId, setTargetProjectId] = useState(projects[0]?.id || '');
  const [targetPhase, setTargetPhase] = useState<ProjectPhase>('etude_appro');
  const [assignedTo, setAssignedTo] = useState('Ing. Marc Mbemba');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'normale' | 'urgente' | 'critique'>('normale');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadPercent(0);
    try {
      const res = await uploadFileWithProgress(file, {
        folder: 'chantiers_demarches',
        onProgress: (p) => setUploadPercent(p.percent),
      });
      setAttachmentUrl(res.secureUrl);
      setAttachmentName(file.name);
    } catch (err: any) {
      alert(`Erreur d'upload : ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const prj = projects.find((p) => p.id === targetProjectId);
    const newTask: ProjectTask = {
      id: `task-${Date.now()}`,
      projectId: targetProjectId,
      projectCode: prj?.code || 'PRJ',
      title,
      description,
      phase: targetPhase,
      assignedTo,
      dueDate,
      priority,
      progressPercent: targetPhase === 'epreuve_reception' ? 90 : targetPhase === 'montage_site' ? 60 : targetPhase === 'atelier_soudure' ? 35 : 10,
      attachments: attachmentUrl
        ? [
            {
              id: `att-${Date.now()}`,
              name: attachmentName || 'Pièce jointe',
              url: attachmentUrl,
              type: attachmentUrl.match(/\.(jpg|jpeg|png|webp)/i) ? 'image' : 'pdf',
              uploadedAt: new Date().toISOString(),
            },
          ]
        : [],
    };

    await DataService.saveProjectTask(newTask);
    setTasks(DataService.getProjectTasks());
    setIsModalOpen(false);
    resetForm();
    onRefresh?.();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAttachmentUrl('');
    setAttachmentName('');
    setUploadPercent(0);
  };

  const handleMovePhase = async (taskId: string, direction: 'prev' | 'next') => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const phaseKeys: ProjectPhase[] = ['etude_appro', 'atelier_soudure', 'montage_site', 'epreuve_reception'];
    const currentIndex = phaseKeys.indexOf(task.phase);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex < 0 || newIndex >= phaseKeys.length) return;
    const newPhase = phaseKeys[newIndex];

    await DataService.updateProjectTaskPhase(taskId, newPhase);
    setTasks(DataService.getProjectTasks());
    onRefresh?.();
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300">Filtrer par Chantier :</span>
          </div>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">Tous les chantiers ({tasks.length} démarches)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-transform active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Démarche / Étape Chantier</span>
        </button>
      </div>

      {/* 4-Columns Industrial Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {PHASES.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.phase === col.id);

          return (
            <div
              key={col.id}
              className={`rounded-2xl border ${col.border} ${col.bg} p-3.5 flex flex-col min-h-[580px] bg-slate-900/60 shadow-lg`}
            >
              {/* Column Header */}
              <div className="pb-3 border-b border-slate-800/80 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-bold text-xs ${col.color} tracking-wide uppercase flex items-center gap-1.5`}>
                    <Layers className="w-3.5 h-3.5" />
                    <span>{col.label}</span>
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                    {colTasks.length}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{col.sub}</p>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl p-4">
                    <CheckSquare className="w-6 h-6 mb-1 opacity-40" />
                    <span>Aucune tâche à cette étape</span>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isUrgent = task.priority === 'urgente' || task.priority === 'critique';
                    const prj = projects.find((p) => p.id === task.projectId);

                    return (
                      <div
                        key={task.id}
                        className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 shadow-md transition-all group"
                      >
                        {/* Project Code & Priority */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {task.projectCode}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold ${
                              isUrgent
                                ? 'bg-red-950 text-red-400 border border-red-800/60'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors mb-1">
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mb-2.5">
                          {task.description}
                        </p>

                        {/* Project Name context */}
                        <div className="text-[10px] text-slate-500 truncate mb-2">
                          🏗️ {prj?.name || 'Chantier CORESI'}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 mb-2.5">
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Avancement</span>
                            <span className="text-cyan-400 font-semibold">{task.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${task.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Attachments (Photos / Plans / PV) */}
                        {task.attachments && task.attachments.length > 0 && (
                          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 mb-2.5 space-y-1.5">
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                              <Paperclip className="w-3 h-3 text-cyan-400" />
                              <span>Pièces jointes &amp; Photos ({task.attachments.length})</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {task.attachments.map((att) => (
                                <button
                                  key={att.id}
                                  onClick={() =>
                                    setViewerItem({
                                      url: att.url,
                                      name: `${task.projectCode} - ${att.name}`,
                                      type: att.type,
                                      metadata: {
                                        Chantier: prj?.name || task.projectCode,
                                        Étape: col.label,
                                        Responsable: task.assignedTo,
                                        Date: att.uploadedAt.split('T')[0],
                                      },
                                    })
                                  }
                                  className="text-[10px] px-2 py-1 bg-slate-950 hover:bg-cyan-950/40 text-cyan-300 hover:text-cyan-200 border border-slate-700/80 rounded flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Inspecter avec zoom HD & rotation"
                                >
                                  {att.type === 'image' ? (
                                    <ImageIcon className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <FileText className="w-3 h-3 text-blue-400" />
                                  )}
                                  <span className="max-w-[120px] truncate">{att.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assignee & Due Date */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80 mb-2">
                          <span className="flex items-center gap-1 truncate max-w-[120px]" title={task.assignedTo}>
                            <User className="w-3 h-3 text-slate-500" />
                            {task.assignedTo}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {task.dueDate}
                          </span>
                        </div>

                        {/* Move Actions (CGA SPE Workflow) */}
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <button
                            onClick={() => handleMovePhase(task.id, 'prev')}
                            disabled={col.id === 'etude_appro'}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Phase précédente"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Retour</span>
                          </button>

                          <button
                            onClick={() => handleMovePhase(task.id, 'next')}
                            disabled={col.id === 'epreuve_reception'}
                            className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 disabled:opacity-30 disabled:hover:bg-cyan-600/20 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Avancer à l'étape suivante"
                          >
                            <span>Avancer</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Industrial Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-5 text-xs text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg">
                  <Wrench className="w-4 h-4" />
                </span>
                <h4 className="font-bold text-sm text-white">Nouvelle Démarche Opérationnelle Chantier</h4>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-slate-300 block mb-1">Chantier / Projet Concerné</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
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
                <label className="text-slate-300 block mb-1">Intitulé de la Tâche / Démarche</label>
                <input
                  type="text"
                  placeholder="Ex: Soudure TIG passes de fond piping 8 pouces"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Description Technique</label>
                <textarea
                  rows={2}
                  placeholder="Détails du travail, outillages requis, normes (ASME, CODAP)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Phase Industrielle Initiale</label>
                  <select
                    value={targetPhase}
                    onChange={(e) => setTargetPhase(e.target.value as ProjectPhase)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="etude_appro">1. Études &amp; Appro</option>
                    <option value="atelier_soudure">2. Préfabrication Atelier</option>
                    <option value="montage_site">3. Montage sur Site</option>
                    <option value="epreuve_reception">4. Épreuve &amp; Réception</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Priorité</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="normale">Normale</option>
                    <option value="urgente">Urgente</option>
                    <option value="critique">Critique (Chemin critique)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Responsable / Chef d'équipe</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Date d'échéance cible</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Photo or Document Upload via Cloudinary */}
              <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  Pièce jointe (Photo chantier, Plan ISO, PV d'épreuve...)
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="w-full text-slate-400 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600/30 file:text-cyan-300 hover:file:bg-cyan-600/50 cursor-pointer"
                />

                {isUploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-cyan-400">
                      <span>Téléversement Cloudinary en cours...</span>
                      <span>{uploadPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-cyan-500 h-1.5 transition-all" style={{ width: `${uploadPercent}%` }} />
                    </div>
                  </div>
                )}

                {attachmentUrl && (
                  <div className="p-2 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-400 text-[11px] flex items-center justify-between">
                    <span className="truncate max-w-[260px]">✓ {attachmentName || 'Fichier prêt'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentUrl('');
                        setAttachmentName('');
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !title.trim()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer la démarche</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Document & Photo Viewer Modal */}
      {viewerItem && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setViewerItem(null)}
          documentUrl={viewerItem.url}
          title={viewerItem.name}
          fileType={viewerItem.type}
          metadata={viewerItem.metadata}
        />
      )}
    </div>
  );
};
