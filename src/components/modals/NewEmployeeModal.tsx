import React, { useState } from 'react';
import { X, Users, Plus } from 'lucide-react';
import { Employee, Department, ContractType, Project } from '../../types';
import { DataService } from '../../services/dataService';

interface NewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onEmployeeCreated: (emp: Employee) => void;
}

export const NewEmployeeModal: React.FC<NewEmployeeModalProps> = ({
  isOpen,
  onClose,
  projects,
  onEmployeeCreated,
}) => {
  const [matricule, setMatricule] = useState<string>(`COR-TEC-0${Math.floor(20 + Math.random() * 80)}`);
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<string>('Soudeur Haute Pression TIG (ASME IX)');
  const [department, setDepartment] = useState<Department>('tuyauterie');
  const [phone, setPhone] = useState<string>('+242 06 6');
  const [email, setEmail] = useState<string>('');
  const [salary, setSalary] = useState<number>(1600000);
  const [contractType, setContractType] = useState<ContractType>('cdi');
  const [assignedProjectId, setAssignedProjectId] = useState<string>(projects[0]?.id || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const prj = projects.find((p) => p.id === assignedProjectId);

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      matricule,
      fullName,
      role,
      department,
      phone,
      email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@coresi-international.com`,
      salary,
      contractType,
      assignedProjectId: assignedProjectId || undefined,
      assignedProjectName: prj?.name || undefined,
      status: 'actif',
      hireDate: new Date().toISOString().split('T')[0],
      documentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await DataService.saveEmployee(newEmp);
    onEmployeeCreated(newEmp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 text-xs">
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-white">Nouveau Collaborateur / Fiche RH</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Matricule</label>
              <input
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Nom et Prénom</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Jean-Luc Moukassa"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-slate-300 font-medium block mb-1">Fonction / Qualification Métier</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Département</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="tuyauterie">Tuyauterie Haute Pression</option>
                <option value="chaudronnerie">Chaudronnerie &amp; Montage</option>
                <option value="ingenierie">Ingénierie &amp; Qualité (QA/QC)</option>
                <option value="securite">HSE &amp; Sécurité Chantier</option>
                <option value="comptabilite">Administration &amp; Comptabilité</option>
                <option value="logistique">Logistique &amp; Matériel</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Type de Contrat</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as ContractType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="cdi">CDI</option>
                <option value="cdd">CDD</option>
                <option value="prestation">Prestation / Mission</option>
                <option value="stage">Stage technique</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Téléphone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Salaire Mensuel (FCFA)</label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="text-slate-300 font-medium block mb-1">Affectation Chantier</label>
              <select
                value={assignedProjectId}
                onChange={(e) => setAssignedProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="">Aucune affectation directe (Base)</option>
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Enregistrer Employé</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
