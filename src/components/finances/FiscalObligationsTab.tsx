import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  UploadCloud,
  Eye,
  DollarSign,
  Download,
  ShieldCheck,
  Landmark,
  Receipt,
  AlertCircle,
  FileCheck,
  ExternalLink,
  X,
  Filter,
} from 'lucide-react';
import { FiscalObligation, FiscalObligationType, FiscalObligationStatus } from '../../types';
import { DataService } from '../../services/dataService';
import { CloudinaryService } from '../../services/cloudinaryService';
import { DocumentViewerModal } from '../shared/DocumentViewerModal';

interface FiscalObligationsTabProps {
  obligations: FiscalObligation[];
  onRefresh?: () => void;
}

export const FiscalObligationsTab: React.FC<FiscalObligationsTabProps> = ({
  obligations,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Viewer State
  const [viewerDoc, setViewerDoc] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    metadata: any;
  }>({
    isOpen: false,
    url: '',
    title: '',
    metadata: {},
  });

  // Upload Quittance Modal State
  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean;
    obligation: FiscalObligation | null;
  }>({
    isOpen: false,
    obligation: null,
  });

  const [quittanceFile, setQuittanceFile] = useState<File | null>(null);
  const [quittanceRef, setQuittanceRef] = useState('');
  const [quittanceAmount, setQuittanceAmount] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Filter logic
  const filtered = obligations.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.organisme.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'ALL' || o.type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // KPIs
  const totalObligations = obligations.length;
  const validatedCount = obligations.filter((o) => o.status === 'valide_quittance').length;
  const pendingCount = obligations.filter((o) => o.status === 'en_cours' || o.status === 'a_declarer').length;
  const totalPaid = obligations.reduce((sum, o) => sum + (o.paidAmount || 0), 0);

  const handleOpenViewer = (ob: FiscalObligation) => {
    if (!ob.quittanceUrl) return;
    setViewerDoc({
      isOpen: true,
      url: ob.quittanceUrl,
      title: `Quittance - ${ob.title}`,
      metadata: {
        documentNumber: ob.quittanceRef || ob.code,
        category: 'Quittance Fiscale & Conformité',
        date: ob.quittanceDate || ob.dueDate,
        montant: ob.paidAmount || ob.declarationAmount,
        projectName: ob.projectName,
        signataire: `Recette des Impôts / ${ob.organisme}`,
        visaStatus: ob.status === 'valide_quittance' ? 'valide' : 'en_cours',
      },
    });
  };

  const handleOpenUpload = (ob: FiscalObligation) => {
    setUploadModal({ isOpen: true, obligation: ob });
    setQuittanceFile(null);
    setQuittanceRef(ob.quittanceRef || `QUIT-${ob.organisme}-${new Date().toISOString().slice(0, 7)}-${Math.floor(1000 + Math.random() * 9000)}`);
    setQuittanceAmount(ob.declarationAmount || 0);
    setUploadProgress(0);
    setUploadError('');
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModal.obligation || !quittanceFile) return;

    try {
      setIsUploading(true);
      setUploadError('');

      // Upload using enhanced Cloudinary service with progress callback
      const result = await CloudinaryService.uploadFileWithProgress(
        quittanceFile,
        `quittance_${uploadModal.obligation.code}_${quittanceFile.name}`,
        'quittances_fiscales',
        (pct) => setUploadProgress(pct)
      );

      const updated: FiscalObligation = {
        ...uploadModal.obligation,
        quittanceUrl: result.secureUrl,
        quittanceRef: quittanceRef || `QUIT-${Date.now()}`,
        quittanceDate: new Date().toISOString().split('T')[0],
        paidAmount: quittanceAmount || uploadModal.obligation.declarationAmount,
        status: 'valide_quittance',
      };

      await DataService.saveFiscalObligation(updated);
      setIsUploading(false);
      setUploadModal({ isOpen: false, obligation: null });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error(err);
      setIsUploading(false);
      setUploadError(err.message || 'Erreur lors du téléversement de la quittance.');
    }
  };

  const statusBadge = (status: FiscalObligationStatus) => {
    switch (status) {
      case 'valide_quittance':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Quittance Validée
          </span>
        );
      case 'en_cours':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-600" /> En Contrôle
          </span>
        );
      case 'en_retard':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Échéance Dépassée
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            À Déclarer
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Obligations</span>
            <FileText className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">{totalObligations}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">TVA, IS, CNSS, TSR &amp; ANR</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Quittances Archivées</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{validatedCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Visées &amp; Conformes DGI / CNSS</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">En Cours / Attente</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">{pendingCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">À liquider sous 15 jours</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-green-700 dark:text-green-400">Impôts &amp; Taxes Payés</span>
            <Receipt className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
            {(totalPaid / 1000000).toFixed(1)} M
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">FCFA quittancés en 2026</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'Toutes' },
            { id: 'tva_mensuelle', label: 'TVA Mensuelle' },
            { id: 'acompte_is', label: 'Acomptes IS' },
            { id: 'cnss_ouvriers', label: 'CNSS Ouvriers' },
            { id: 'retenue_tsr', label: 'TSR Sous-traitance' },
            { id: 'quitus_fiscal', label: 'Quitus & ANR' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-green-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher déclaration, code, réf..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-green-600"
          />
        </div>
      </div>

      {/* OBLIGATIONS TABLE */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 uppercase text-[10px] text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold tracking-wider">
              <tr>
                <th className="p-3.5 sm:p-4">Réf &amp; Organisme</th>
                <th className="p-3.5 sm:p-4">Démarche / Obligation</th>
                <th className="p-3.5 sm:p-4">Période &amp; Échéance</th>
                <th className="p-3.5 sm:p-4">Montant Déclaré</th>
                <th className="p-3.5 sm:p-4">Statut Quittance</th>
                <th className="p-3.5 sm:p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((ob) => (
                <tr key={ob.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 sm:p-4">
                    <span className="font-mono font-bold text-green-700 dark:text-green-400 block">{ob.code}</span>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                      <Landmark className="w-3 h-3 text-slate-400" />
                      {ob.organisme}
                    </span>
                  </td>

                  <td className="p-3.5 sm:p-4">
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{ob.title}</p>
                    {ob.notes && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{ob.notes}</p>
                    )}
                  </td>

                  <td className="p-3.5 sm:p-4">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">{ob.period}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Échéance: {new Date(ob.dueDate).toLocaleDateString('fr-FR')}
                    </span>
                  </td>

                  <td className="p-3.5 sm:p-4">
                    <strong className="font-mono font-bold text-slate-900 dark:text-white text-xs block">
                      {ob.declarationAmount > 0 ? `${ob.declarationAmount.toLocaleString('fr-FR')} FCFA` : 'Non applicable'}
                    </strong>
                    {ob.paidAmount > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Payé: {ob.paidAmount.toLocaleString('fr-FR')}
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 sm:p-4">
                    {statusBadge(ob.status)}
                    {ob.quittanceRef && (
                      <span className="text-[10px] font-mono text-slate-400 block mt-1 truncate max-w-[140px]">
                        {ob.quittanceRef}
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 sm:p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {ob.quittanceUrl ? (
                        <button
                          onClick={() => handleOpenViewer(ob)}
                          className="px-2.5 py-1.5 rounded-xl bg-green-50 dark:bg-green-950/60 hover:bg-green-100 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          title="Inspecter la quittance (Zoom &amp; Relecture)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Quittance</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenUpload(ob)}
                          className="px-2.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
                          title="Téléverser la quittance officielle"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Joindre</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPLOAD QUITTANCE MODAL */}
      {uploadModal.isOpen && uploadModal.obligation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-up text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-green-700/20 text-green-700 dark:text-green-400 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Téléverser Quittance Fiscale
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {uploadModal.obligation.title} ({uploadModal.obligation.organisme})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadModal({ isOpen: false, obligation: null })}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Drop Area */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-green-600 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 dark:bg-slate-950/50 transition-colors relative">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setQuittanceFile(e.target.files[0]);
                    }
                  }}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1.5 pointer-events-none">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-green-700 dark:text-green-400 flex items-center justify-center mx-auto shadow-xs border border-slate-200 dark:border-slate-700">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  {quittanceFile ? (
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{quittanceFile.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {(quittanceFile.size / 1024 / 1024).toFixed(2)} Mo • Prêt à être synchronisé
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        Glissez le reçu officiel ou cliquez pour parcourir
                      </p>
                      <p className="text-[10px] text-slate-400">PDF, PNG, JPG jusqu'à 30 Mo</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    N° Quittance / Bordereau *
                  </label>
                  <input
                    type="text"
                    required
                    value={quittanceRef}
                    onChange={(e) => setQuittanceRef(e.target.value)}
                    placeholder="Ex: QUIT-DGI-2026-4402"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-green-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Montant Payé (FCFA)
                  </label>
                  <input
                    type="number"
                    value={quittanceAmount}
                    onChange={(e) => setQuittanceAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="space-y-1 bg-green-50 dark:bg-green-950/40 p-3 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex justify-between text-[11px] font-bold text-green-700 dark:text-green-300">
                    <span>Téléversement Cloudinary...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-green-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUploadModal({ isOpen: false, obligation: null })}
                  disabled={isUploading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !quittanceFile}
                  className="px-5 py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-700/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valider &amp; Archiver</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT VIEWER MODAL (From CGA SPE inspection model) */}
      <DocumentViewerModal
        isOpen={viewerDoc.isOpen}
        onClose={() => setViewerDoc({ ...viewerDoc, isOpen: false })}
        documentUrl={viewerDoc.url}
        title={viewerDoc.title}
        metadata={viewerDoc.metadata}
      />
    </div>
  );
};
