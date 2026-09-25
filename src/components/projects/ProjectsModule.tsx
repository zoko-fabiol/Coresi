import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Camera,
  FileText,
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
  UserCheck,
  CheckCircle,
  Clock,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Project, DocumentRecord, Expense } from '../../types';

interface ProjectsModuleProps {
  projects: Project[];
  documents: DocumentRecord[];
  expenses: Expense[];
  onOpenProjectDetail: (project: Project) => void;
  onScanForProject: (project: Project) => void;
  onNewProject: () => void;
}

export const ProjectsModule: React.FC<ProjectsModuleProps> = ({
  projects,
  documents,
  expenses,
  onOpenProjectDetail,
  onScanForProject,
  onNewProject,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
              <FolderKanban className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Projets Industriels &amp; Chantiers
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Suivi opérationnel, avancement physique, budgets chantiers et rattachement des documents numérisés.
          </p>
        </div>

        <button
          onClick={onNewProject}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Projet</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom de chantier, code, client ou ville..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="all">Tous les corps d'état</option>
          <option value="tuyauterie">Tuyauterie industrielle</option>
          <option value="chaudronnerie">Chaudronnerie</option>
          <option value="charpente">Charpente métallique</option>
          <option value="genie_civil">Génie civil</option>
          <option value="construction_industrielle">Construction d'unités</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="all">Tous les statuts</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminés</option>
          <option value="on_hold">En attente</option>
        </select>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredProjects.map((prj) => {
          const prjDocs = documents.filter((d) => d.context.projectId === prj.id);
          const prjExpenses = expenses.filter((e) => e.projectId === prj.id);
          const spentRatio = Math.min(100, Math.round((prj.spent / prj.budget) * 100));

          return (
            <div
              key={prj.id}
              onClick={() => onOpenProjectDetail(prj)}
              className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all cursor-pointer group"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {prj.code}
                      </span>
                      <span className="text-[11px] capitalize bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                        {prj.category.replace('_', ' ')}
                      </span>
                    </div>
                    <h3
                      onClick={() => onOpenProjectDetail(prj)}
                      className="text-sm sm:text-base font-bold text-white hover:text-cyan-300 cursor-pointer transition-colors"
                    >
                      {prj.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{prj.clientName}</p>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                      prj.status === 'in_progress'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800'
                        : prj.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400'
                    }`}
                  >
                    {prj.status === 'in_progress' ? 'En cours' : prj.status === 'completed' ? 'Livré' : 'Attente'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 my-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Avancement physique</span>
                    <span className="font-bold text-cyan-400 font-mono">{prj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${prj.progress}%` }}
                    />
                  </div>
                </div>

                {/* Financial KPI bar */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 my-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Budget alloué</span>
                    <span className="font-bold text-white font-mono">
                      {prj.budget.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Dépenses engagées</span>
                    <span className={`font-bold font-mono ${spentRatio > 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {prj.spent.toLocaleString('fr-FR')} FCFA ({spentRatio}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {prj.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Fin : {prj.endDate}
                  </span>
                </div>
              </div>

              {/* Bottom Quick Action buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-cyan-400">
                    <FileText className="w-3.5 h-3.5" />
                    {prjDocs.length} docs GED
                  </span>
                  <span className="flex items-center gap-1 font-mono text-amber-400">
                    <DollarSign className="w-3.5 h-3.5" />
                    {prjExpenses.length} dépenses
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Contextual Smart Scanner direct trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onScanForProject(prj);
                    }}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Numériser une pièce pour ce chantier"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Numériser</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProjectDetail(prj);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Détails</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
