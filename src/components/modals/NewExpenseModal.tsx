import React, { useState } from 'react';
import { X, DollarSign, Plus } from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod, Project } from '../../types';
import { DataService } from '../../services/dataService';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onExpenseCreated: (exp: Expense) => void;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  projects,
  onExpenseCreated,
}) => {
  const [reference, setReference] = useState<string>(`DEP-2026-0${Math.floor(100 + Math.random() * 900)}`);
  const [projectId, setProjectId] = useState<string>(projects[0]?.id || '');
  const [category, setCategory] = useState<ExpenseCategory>('materiel');
  const [amount, setAmount] = useState<number>(1500000);
  const [currency, setCurrency] = useState<string>('FCFA');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('virement_bancaire');
  const [supplierName, setSupplierName] = useState<string>('VALLOUREC TUBES AFRIQUE');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prj = projects.find((p) => p.id === projectId);

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      reference,
      projectId,
      projectName: prj?.name || 'Projet Général',
      category,
      amount,
      currency,
      paymentMethod,
      supplierName,
      date,
      description: description || `Achat matériel pour ${prj?.name || 'chantier'}`,
      status: 'paye',
      approvedBy: DataService.getCurrentUser().displayName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await DataService.saveExpense(newExpense);
    onExpenseCreated(newExpense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 text-xs">
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-white">Enregistrer une Dépense / Achat</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Réf Dépense</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Chantier / Projet</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
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
              <label className="text-slate-300 font-medium block mb-1">Catégorie Dépense</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="materiel">Matériel &amp; Outillage</option>
                <option value="consommable">Consommables &amp; Gaz</option>
                <option value="main_oeuvre">Main-d'œuvre &amp; Intérim</option>
                <option value="sous_traitance">Sous-traitance &amp; Contrôles</option>
                <option value="transport">Transport &amp; Logistique</option>
                <option value="carburant">Carburant &amp; Groupes</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Mode de Paiement</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="virement_bancaire">Virement Bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="caisse">Espèces / Caisse</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Montant TTC</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
                <span className="text-xs text-slate-400 font-bold px-1">{currency}</span>
              </div>
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-slate-300 font-medium block mb-1">Fournisseur / Bénéficiaire</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Ex: AIR LIQUIDE CONGO"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-slate-300 font-medium block mb-1">Désignation / Motif</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Achat consommables de soudage et meules abrasives"
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Valider la Dépense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
