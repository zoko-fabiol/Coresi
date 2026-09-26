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
    color: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-500/30',
    bg: 'bg-blue-50/70 dark:bg-blue-950/20',
  },
  {
    id: 'atelier_soudure',
    label: '2. Préfab Atelier',
    sub: 'Débit, assemblage & soudures qualifiées',
    color: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/30',
    bg: 'bg-amber-50/70 dark:bg-amber-950/20',
  },
  {
    id: 'montage_site',
    label: '3. Montage Site',
    sub: 'Levage, boulonnage & raccordements',
    color: 'text-emerald-700 dark:text-cyan-400',
    border: 'border-emerald-200 dark:border-cyan-500/30',
    bg: 'bg-emerald-50/70 dark:bg-cyan-950/20',
  },
  {
    id: 'epreuve_reception',
    label: '4. Épreuve & Réception',
    sub: 'Tests sous pression, PV et quitus',
    color: 'text-teal-700 dark:text-emerald-400',
    border: 'border-teal-200 dark:border-emerald-500/30',
    bg: 'bg-teal-50/70 dark:bg-emerald-950/20',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-cyan-400" />
            <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">Filtrer par Chantier :</span>
          </div>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-stone-900 dark:text-white focus:border-emerald-500 focus:outline-none"
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
          className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition-transform active:scale-95 cursor-pointer self-start sm:self-auto"
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
              className={`rounded-2xl border ${col.border} ${col.bg} p-3.5 flex flex-col min-h-[580px] shadow-xs backdrop-blur-xs`}
            >
              {/* Column Header */}
              <div className="pb-3 border-b border-stone-200/80 dark:border-slate-800/80 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-bold text-xs ${col.color} tracking-wide uppercase flex items-center gap-1.5`}>
                    <Layers className="w-3.5 h-3.5" />
                    <span>{col.label}</span>
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 font-bold border border-stone-200 dark:border-slate-700 shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-slate-400">{col.sub}</p>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-stone-400 dark:text-slate-500 text-xs border border-dashed border-stone-300 dark:border-slate-800 rounded-xl p-4">
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
                        className="bg-white dark:bg-slate-950/90 border border-stone-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-slate-700 rounded-xl p-3.5 shadow-xs transition-all group"
                      >
                        {/* Project Code & Priority */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-cyan-400 bg-stone-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-stone-200 dark:border-slate-800">
                            {task.projectCode}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold ${
                              isUrgent
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border border-red-300 dark:border-red-800/60'
                                : 'bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-xs font-bold text-stone-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-cyan-300 transition-colors mb-1">
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-stone-600 dark:text-slate-400 line-clamp-2 mb-2.5">
                          {task.description}
                        </p>

                        {/* Project Name context */}
                        <div className="text-[10px] text-stone-500 dark:text-slate-500 truncate mb-2">
                          🏗️ {prj?.name || 'Chantier CORESI'}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 mb-2.5">
                          <div className="flex justify-between text-[10px] text-stone-500 dark:text-slate-400 font-mono">
                            <span>Avancement</span>
                            <span className="text-emerald-700 dark:text-cyan-400 font-semibold">{task.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-stone-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-cyan-500 dark:to-emerald-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${task.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Attachments (Photos / Plans / PV) */}
                        {task.attachments && task.attachments.length > 0 && (
                          <div className="bg-stone-50 dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 rounded-lg p-2 mb-2.5 space-y-1.5">
                            <span className="text-[10px] text-stone-600 dark:text-slate-400 font-medium flex items-center gap-1">
                              <Paperclip className="w-3 h-3 text-emerald-600 dark:text-cyan-400" />
                              <span>Pièces jointes &amp; Photos ({task.attachments.length})</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {task.attachments.map((att, attIdx) => (
                                <button
                                  key={att.id || `att-${attIdx}-${att.name}`}
                                  onClick={() =>
                                    setViewerItem({
                                      url: att.url,
                                      name: `${task.projectCode} - ${att.name}`,
                                      type: att.type || (att.url?.match(/\.(jpg|jpeg|png|webp)/i) ? 'image' : 'pdf'),
                                      metadata: {
                                        Chantier: prj?.name || task.projectCode,
                                        Étape: col.label,
                                        Responsable: task.assignedTo,
                                        Date: (att.uploadedAt || new Date().toISOString()).split('T')[0],
                                      },
                                    })
                                  }
                                  className="text-[10px] px-2 py-1 bg-white dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-cyan-950/40 text-emerald-800 dark:text-cyan-300 border border-stone-200 dark:border-slate-700/80 rounded flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Inspecter avec zoom HD & rotation"
                                >
                                  {(att.type === 'image' || att.url?.match(/\.(jpg|jpeg|png|webp)/i)) ? (
                                    <ImageIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  )}
                                  <span className="max-w-[120px] truncate">{att.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assignee & Due Date */}
                        <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-slate-400 pt-2 border-t border-stone-200/80 dark:border-slate-800/80 mb-2">
                          <span className="flex items-center gap-1 truncate max-w-[120px]" title={task.assignedTo}>
                            <User className="w-3 h-3 text-stone-400 dark:text-slate-500" />
                            {task.assignedTo}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Calendar className="w-3 h-3 text-stone-400 dark:text-slate-500" />
                            {task.dueDate}
                          </span>
                        </div>

                        {/* Move Actions */}
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <button
                            onClick={() => handleMovePhase(task.id, 'prev')}
                            disabled={col.id === 'etude_appro'}
                            className="px-2 py-1 bg-stone-100 dark:bg-slate-900 hover:bg-stone-200 dark:hover:bg-slate-800 disabled:opacity-30 text-stone-700 dark:text-slate-300 rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Phase précédente"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Retour</span>
                          </button>

                          <button
                            onClick={() => handleMovePhase(task.id, 'next')}
                            disabled={col.id === 'epreuve_reception'}
                            className="px-2.5 py-1 bg-emerald-50 dark:bg-cyan-600/20 hover:bg-emerald-100 dark:hover:bg-cyan-600/30 text-emerald-800 dark:text-cyan-300 border border-emerald-200 dark:border-cyan-500/30 disabled:opacity-30 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-5 text-xs text-stone-900 dark:text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg">
                  <Wrench className="w-4 h-4" />
                </span>
                <h4 className="font-bold text-sm text-stone-900 dark:text-white">Nouvelle Démarche Opérationnelle Chantier</h4>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-stone-700 dark:text-slate-300 block mb-1 font-medium">Chantier / Projet Concerné</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 rounded-lg p-2 text-stone-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-stone-700 dark:text-slate-300 block mb-1 font-medium">Intitulé de la Tâche / Démarche</label>
                <input
                  type="text"
                  placeholder="Ex: Soudure TIG passes de fond piping 8 pouces"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 rounded-lg p-2 text-stone-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-stone-700 dark:text-slate-300 block mb-1 font-medium">Description Technique</label>
                <textarea
                  rows={2}
                  placeholder="Détails du travail, outillages requis, normes (ASME, CODAP)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 rounded-lg p-2 text-stone-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 dark:text-slate-300 block mb-1 font-medium">Phase Industrielle Initiale</label>
                  <select
                    value={targetPhase}
                    onChange={(e) => setTargetPhase(e.target.value as ProjectPhase)}
                    className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 rounded-lg p-2 text-stone-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="etude_appro">1. Études &amp; Appro</option>
                    <option value="atelier_soudure">2. Préfabrication Atelier</option>
                    <option value="montage_site">3. Montage sur Site</option>
                    <option value="epreuve_reception">4. Épreuve &amp; Réception</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-700 dark:text-slate-300 block mb-1 font-medium">Priorité</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 rounded-lg p-2 text-stone-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="normale">Normale</option>
                    <option value="urgente">Urgente</option>
                    <option value="critique">Critique (Chemin critique)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-700 dark:text-slate-300 block mb-1 font-medium">Responsable / Chef d'équipe</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 rounded-lg p-2 text-stone-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-stone-700 dark:text-slate-300 block mb-1 font-medium">Date d'échéance cible</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 rounded-lg p-2 text-stone-900 dark:text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Photo or Document Upload via Cloudinary */}
              <div className="border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950/60 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-semibold text-stone-700 dark:text-slate-300 block">
                  Pièce jointe (Photo chantier, Plan ISO, PV d'épreuve...)
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="w-full text-stone-600 dark:text-slate-400 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 text-emerald-800 dark:file:bg-cyan-600/30 dark:file:text-cyan-300 hover:file:bg-emerald-200 dark:hover:file:bg-cyan-600/50 cursor-pointer"
                />

                {isUploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-emerald-700 dark:text-cyan-400">
                      <span>Téléversement Cloudinary en cours...</span>
                      <span>{uploadPercent}%</span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-600 dark:bg-cyan-500 h-1.5 transition-all" style={{ width: `${uploadPercent}%` }} />
                    </div>
                  </div>
                )}

                {attachmentUrl && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-emerald-800 dark:text-emerald-400 text-[11px] flex items-center justify-between">
                    <span className="truncate max-w-[260px]">✓ {attachmentName || 'Fichier prêt'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentUrl('');
                        setAttachmentName('');
                      }}
                      className="text-stone-400 hover:text-stone-700 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !title.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
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
