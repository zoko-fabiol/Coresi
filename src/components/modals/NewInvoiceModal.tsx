import React, { useState } from 'react';
import { X, FileText, Plus } from 'lucide-react';
import { Invoice, InvoiceType, Project } from '../../types';
import { DataService } from '../../services/dataService';

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onInvoiceCreated: (inv: Invoice) => void;
}

export const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({
  isOpen,
  onClose,
  projects,
  onInvoiceCreated,
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`FAC-COR-2026-0${Math.floor(3 + Math.random() * 8)}`);
  const [type, setType] = useState<InvoiceType>('client');
  const [partyName, setPartyName] = useState<string>('TOTAL CONGO EP');
  const [projectId, setProjectId] = useState<string>(projects[0]?.id || '');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [totalAmount, setTotalAmount] = useState<number>(18500000);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prj = projects.find((p) => p.id === projectId);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      type,
      partyName,
      projectId,
      projectName: prj?.name,
      issueDate,
      dueDate,
      totalAmount,
      paidAmount: 0,
      currency: 'FCFA',
      status: 'emis',
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await DataService.saveInvoice(newInvoice);
    onInvoiceCreated(newInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 text-xs">
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-white">Émettre une Facture</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">N° de Facture</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Type de Facture</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InvoiceType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              >
                <option value="client">Facture Client (Vente)</option>
                <option value="fournisseur">Facture Fournisseur (Achat)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-slate-300 font-medium block mb-1">Partenaire / Entreprise</label>
              <input
                type="text"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-slate-300 font-medium block mb-1">Rattacher au Projet</label>
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
              <label className="text-slate-300 font-medium block mb-1">Montant Total TTC (FCFA)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Date d'Échéance</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
              <span>Enregistrer Facture</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
