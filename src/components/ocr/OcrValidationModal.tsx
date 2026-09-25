import React, { useState } from 'react';
import {
  FileSearch,
  CheckCircle,
  X,
  AlertTriangle,
  Sparkles,
  Sliders,
  DollarSign,
  Calendar,
  Building,
} from 'lucide-react';
import { OcrResultRecord, DocumentClassification, ExtractedOcrData } from '../../types/advancedModules';
import { OCRService } from '../../services/ocrService';
import { DataService } from '../../services/dataService';

interface OcrValidationModalProps {
  ocrRecord: OcrResultRecord;
  onClose: () => void;
  onValidated: (updatedRecord: OcrResultRecord) => void;
  showToast: (msg: string) => void;
}

export const OcrValidationModal: React.FC<OcrValidationModalProps> = ({
  ocrRecord,
  onClose,
  onValidated,
  showToast,
}) => {
  const [classification, setClassification] = useState<DocumentClassification>(
    ocrRecord.finalClassification || ocrRecord.proposedClassification
  );

  const initialData = ocrRecord.extractedData;
  const [docNumber, setDocNumber] = useState(initialData.documentNumber || '');
  const [docDate, setDocDate] = useState(initialData.documentDate || '');
  const [supplierName, setSupplierName] = useState(initialData.supplierName || '');
  const [clientName, setClientName] = useState(initialData.clientName || '');
  const [amountHT, setAmountHT] = useState(initialData.amountHT || 0);
  const [vatAmount, setVatAmount] = useState(initialData.vatAmount || 0);
  const [amountTTC, setAmountTTC] = useState(initialData.amountTTC || 0);

  const currentUser = DataService.getCurrentUser();

  const handleValidate = async () => {
    const updatedData: ExtractedOcrData = {
      ...initialData,
      documentNumber: docNumber,
      documentDate: docDate,
      supplierName,
      clientName,
      amountHT: Number(amountHT) || undefined,
      vatAmount: Number(vatAmount) || undefined,
      amountTTC: Number(amountTTC) || undefined,
    };

    const validated = await OCRService.validateAndSave(
      ocrRecord.id,
      updatedData,
      classification,
      currentUser.displayName
    );

    onValidated(validated);
    showToast(`Validation OCR confirmée pour "${ocrRecord.originalFileName}".`);
    onClose();
  };

  const getConfidenceBadge = (score: number | undefined) => {
    const val = score || ocrRecord.confidenceScore;
    if (val >= 90) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
          {val}% Confiance
        </span>
      );
    }
    if (val >= 70) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
          {val}% À vérifier
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800">
        {val}% Incertain
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Validation Humaine du Traitement OCR & IA</h2>
              <p className="text-xs text-slate-400">
                Fichier : <strong>{ocrRecord.originalFileName}</strong> • Moteur : {ocrRecord.engineUsed}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Score Global</span>
              {getConfidenceBadge(ocrRecord.confidenceScore)}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Classification Choice */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase">Classification du Document</h4>
            <p className="text-xs text-slate-500">
              IA proposée : <strong className="text-cyan-400 uppercase">{ocrRecord.proposedClassification}</strong>
            </p>
          </div>
          <select
            value={classification}
            onChange={(e) => setClassification(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-semibold"
          >
            <option value="facture">Facture Fournisseur / Client</option>
            <option value="bon_commande">Bon de Commande (BC)</option>
            <option value="bon_livraison">Bon de Livraison (BL)</option>
            <option value="pv">Procès-Verbal (PV)</option>
            <option value="rapport">Rapport Technique</option>
            <option value="document_rh">Document RH / Fiche</option>
            <option value="contrat">Contrat / Convention</option>
            <option value="administratif">Document Administratif</option>
            <option value="autre">Autre Document</option>
          </select>
        </div>

        {/* Main Grid: Raw OCR Text vs Editable Extracted Entities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Raw text */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase">Texte Brut Reconnu (OCR)</h4>
            <pre className="p-4 bg-slate-950 font-mono text-[11px] text-slate-300 rounded-xl border border-slate-800 overflow-y-auto max-h-96 whitespace-pre-wrap leading-relaxed">
              {ocrRecord.rawText}
            </pre>
          </div>

          {/* Right: Editable Form */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase">Entités Métier Extraites & Ajustables</h4>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400">N° de Référence / Pièce</label>
                  {getConfidenceBadge(initialData.confidenceScores?.documentNumber)}
                </div>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400">Date du Document</label>
                  {getConfidenceBadge(initialData.confidenceScores?.documentDate)}
                </div>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400">Fournisseur / Émetteur</label>
                    {getConfidenceBadge(initialData.confidenceScores?.parties)}
                  </div>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400">Client / Destinataire</label>
                  </div>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              {/* Financial Fields */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Montant HT (FCFA)</label>
                  <input
                    type="number"
                    value={amountHT || ''}
                    onChange={(e) => setAmountHT(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">TVA (19.25%)</label>
                  <input
                    type="number"
                    value={vatAmount || ''}
                    onChange={(e) => setVatAmount(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1 font-bold text-cyan-400">Total TTC</label>
                  <input
                    type="number"
                    value={amountTTC || ''}
                    onChange={(e) => setAmountTTC(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-cyan-400 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-500">
            Une fois validée, l'extraction alimente automatiquement les modules Achats, GED et Comptabilité.
          </span>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleValidate}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <CheckCircle className="w-4 h-4" /> Confirmer la Validation Humaine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
