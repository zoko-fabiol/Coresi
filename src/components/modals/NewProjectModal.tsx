import React, { useState } from 'react';
import { X, FolderKanban, Plus } from 'lucide-react';
import { Project, ProjectCategory } from '../../types';
import { DataService } from '../../services/dataService';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (prj: Project) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [code, setCode] = useState<string>(`PRJ-2026-0${Math.floor(5 + Math.random() * 5)}`);
  const [name, setName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('TOTAL CONGO EP');
  const [category, setCategory] = useState<ProjectCategory>('tuyauterie');
  const [location, setLocation] = useState<string>('Pointe-Noire');
  const [budget, setBudget] = useState<number>(35000000);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [managerName, setManagerName] = useState<string>('Ing. Paul Kimbembe');
  const [description, setDescription] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: Project = {
      id: `prj-${Date.now()}`,
      code,
      name,
      clientId: `cli-${Date.now()}`,
      clientName,
      category,
      location,
      budget,
      spent: 0,
      progress: 0,
      status: 'in_progress',
      startDate,
      endDate,
      managerId: 'emp-002',
      managerName,
      description: description || `Chantier ${category} pour ${clientName}`,
      assignedWorkersCount: 5,
      documentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await DataService.saveProject(newProject);
    onProjectCreated(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 text-xs">
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <FolderKanban className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-white">Nouveau Projet / Chantier CORESI</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Code Projet</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Client Donneur d'Ordre</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-slate-300 font-medium block mb-1">Intitulé du Projet / Chantier</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Raccordement Tuyauterie HP Ligne Gaz"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Corps d'État / Pôle Métier</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="tuyauterie">Tuyauterie industrielle</option>
                <option value="chaudronnerie">Chaudronnerie &amp; Viroles</option>
                <option value="charpente">Charpente métallique</option>
                <option value="genie_civil">Génie civil</option>
                <option value="construction_industrielle">Construction d'unité</option>
                <option value="maintenance">Maintenance industrielle</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Localisation / Site</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Budget Total Contractuel (FCFA)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Chef de Projet / QA</label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Date Démarrage</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Livraison Prévue</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-slate-300 font-medium block mb-1">Description Technique</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Spécifications tuyauterie, diamètres, pression, CND requis..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Créer le Projet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
