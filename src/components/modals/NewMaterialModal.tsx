import React, { useState } from 'react';
import { X, Wrench, Plus } from 'lucide-react';
import { Material, MaterialCategory, MaterialCondition, Project } from '../../types';
import { DataService } from '../../services/dataService';

interface NewMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onMaterialCreated: (mat: Material) => void;
}

export const NewMaterialModal: React.FC<NewMaterialModalProps> = ({
  isOpen,
  onClose,
  projects,
  onMaterialCreated,
}) => {
  const [code, setCode] = useState<string>(`MAT-SOU-0${Math.floor(5 + Math.random() * 5)}`);
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<MaterialCategory>('soudage');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('unité');
  const [condition, setCondition] = useState<MaterialCondition>('bon_etat');
  const [location, setLocation] = useState<string>('Base Logistique Pointe-Noire');
  const [assignedProjectId, setAssignedProjectId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const prj = projects.find((p) => p.id === assignedProjectId);

    const newMat: Material = {
      id: `mat-${Date.now()}`,
      code,
      name,
      category,
      quantity,
      unit,
      condition,
      location,
      assignedProjectId: assignedProjectId || undefined,
      assignedProjectName: prj?.name || undefined,
      status: assignedProjectId ? 'assigne' : 'disponible',
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await DataService.saveMaterial(newMat);
    onMaterialCreated(newMat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 text-xs">
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <Wrench className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-white">Ajouter un Équipement / Outillage</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Code / Réf</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="soudage">Poste de soudage</option>
                <option value="levage">Levage &amp; Grues</option>
                <option value="outillage">Outillage lourd &amp; Épreuves</option>
                <option value="vehicules">Véhicules de chantier</option>
                <option value="consommables">Consommables</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-slate-300 font-medium block mb-1">Désignation du Matériel</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Poste Miller Dynasty 400 TIG/MMA"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Quantité</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={1}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Unité</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">État de fonctionnement</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as MaterialCondition)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="neuf">Neuf</option>
                <option value="bon_etat">Bon état de marche</option>
                <option value="en_maintenance">En révision</option>
                <option value="hors_service">Hors service</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Localisation</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-slate-300 font-medium block mb-1">Chantier d'affectation</label>
              <select
                value={assignedProjectId}
                onChange={(e) => setAssignedProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="">Disponible en base logistique</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer Équipement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
