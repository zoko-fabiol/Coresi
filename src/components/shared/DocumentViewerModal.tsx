import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ExternalLink,
  FileText,
  Calendar,
  FolderKanban,
  CheckCircle2,
  ShieldCheck,
  Cloud,
  Maximize2,
  Smartphone,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { CloudinaryService } from '../../services/cloudinaryService';

export interface DocumentViewerMetadata {
  projectName?: string;
  projectCode?: string;
  clientName?: string;
  documentNumber?: string;
  category?: string;
  date?: string;
  fileSize?: string;
  format?: string;
  signataire?: string;
  visaStatus?: 'valide' | 'en_cours' | 'reserve';
  notes?: string;
  montant?: number;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  title: string;
  metadata?: DocumentViewerMetadata;
  onDownload?: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documentUrl,
  title,
  metadata = {},
  onDownload,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [imageError, setImageError] = useState<boolean>(false);
  const [activeTabMobile, setActiveTabMobile] = useState<'VIEW' | 'META'>('VIEW');

  // Reset zoom & rotation when document changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setRotation(0);
      setImageError(false);
      setActiveTabMobile('VIEW');
    }
  }, [isOpen, documentUrl]);

  // Handle keyboard shortcuts (Escape to close, + / - zoom, r for rotate)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoom((prev) => Math.min(prev + 25, 300));
      if (e.key === '-' || e.key === '_') setZoom((prev) => Math.max(prev - 25, 50));
      if (e.key === 'r' || e.key === 'R') setRotation((prev) => (prev + 90) % 360);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPdf =
    documentUrl.toLowerCase().endsWith('.pdf') ||
    documentUrl.includes('application/pdf') ||
    metadata.format?.toLowerCase() === 'pdf';

  const isAudio =
    documentUrl.toLowerCase().endsWith('.webm') ||
    documentUrl.toLowerCase().endsWith('.mp3') ||
    documentUrl.toLowerCase().endsWith('.ogg') ||
    documentUrl.toLowerCase().endsWith('.m4a') ||
    metadata.format?.toLowerCase() === 'audio';

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetZoom = () => {
    setZoom(100);
    setRotation(0);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    const a = document.createElement('a');
    a.href = documentUrl;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* HEADER BAR */}
        <div className="bg-slate-950 px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-green-700/20 text-green-400 border border-green-600/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-md">{title}</h3>
                {metadata.documentNumber && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-green-950 text-green-400 border border-green-800 shrink-0">
                    {metadata.documentNumber}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {metadata.projectName || metadata.category || 'Document Technique CORESI'}
              </p>
            </div>
          </div>

          {/* Action buttons (Zoom, Rotate, Download, External, Close) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Image inspection toolbar */}
            {!isPdf && !isAudio && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Zoom Arrière (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono px-1.5 text-slate-400 font-bold min-w-[45px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Zoom Avant (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Pivoter 90° (R)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                {(zoom !== 100 || rotation !== 0) && (
                  <button
                    onClick={handleResetZoom}
                    className="p-1.5 hover:bg-slate-800 text-green-400 rounded-lg transition-colors cursor-pointer"
                    title="Réinitialiser"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleDownload}
              className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors cursor-pointer"
              title="Télécharger"
            >
              <Download className="w-4 h-4" />
            </button>

            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors cursor-pointer"
              title="Ouvrir en plein écran"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer ml-1"
              title="Fermer (Echap)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MOBILE TABS (Aperçu vs Détails) */}
        <div className="flex sm:hidden border-b border-slate-800 bg-slate-950 px-3 py-1.5 gap-2">
          <button
            onClick={() => setActiveTabMobile('VIEW')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTabMobile === 'VIEW'
                ? 'bg-green-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Aperçu Document
          </button>
          <button
            onClick={() => setActiveTabMobile('META')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTabMobile === 'META'
                ? 'bg-green-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Fiche &amp; Métadonnées
          </button>
        </div>

        {/* MAIN BODY: VIEWER + RIGHT SIDEBAR */}
        <div className="flex-1 flex overflow-hidden">
          {/* VIEWER AREA */}
          <div
            className={`flex-1 bg-slate-950/90 overflow-auto flex items-center justify-center p-3 sm:p-6 ${
              activeTabMobile === 'VIEW' ? 'flex' : 'hidden sm:flex'
            }`}
          >
            {isAudio ? (
              /* Audio Voice Note Player */
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center mx-auto">
                  <Smartphone className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Note Vocale de Chantier</h4>
                  <p className="text-xs text-slate-400 mt-1">Enregistrement audio terrain CORESI</p>
                </div>
                <audio controls src={documentUrl} className="w-full mt-2" />
              </div>
            ) : isPdf ? (
              /* PDF Embedded Viewer */
              <div className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col">
                <iframe
                  src={documentUrl}
                  title={title}
                  className="w-full h-full flex-1 border-0 min-h-[450px]"
                />
              </div>
            ) : imageError ? (
              /* Image Error Fallback */
              <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl max-w-md">
                <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <h4 className="text-white font-bold text-sm mb-1">Aperçu direct indisponible</h4>
                <p className="text-xs text-slate-400 mb-4">
                  Le fichier est sécurisé sur Cloudinary. Vous pouvez l'ouvrir directement dans un nouvel onglet.
                </p>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ouvrir le fichier</span>
                </a>
              </div>
            ) : (
              /* High-Resolution Image Canvas */
              <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                <div
                  className="transition-transform duration-200 ease-out origin-center flex items-center justify-center max-w-full max-h-full"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={documentUrl}
                    alt={title}
                    onError={() => setImageError(true)}
                    className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800 select-none"
                    draggable={false}
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT INSPECTION SIDEBAR */}
          <div
            className={`w-full sm:w-80 lg:w-96 bg-slate-900 border-l border-slate-800 p-5 sm:p-6 overflow-y-auto space-y-5 text-xs shrink-0 ${
              activeTabMobile === 'META' ? 'block' : 'hidden sm:block'
            }`}
          >
            {/* Header pill */}
            <div>
              <span className="text-[10px] font-bold text-orange-400 bg-orange-950/80 border border-orange-800/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Contrôle Qualité &amp; Traçabilité
              </span>
              <h4 className="font-black text-white text-base mt-2">Détails Documentaires</h4>
            </div>

            {/* Metadata Table */}
            <div className="space-y-2.5 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Réf. Document :</span>
                <span className="font-mono font-bold text-white text-right truncate max-w-[170px]">
                  {metadata.documentNumber || 'Non renseigné'}
                </span>
              </div>

              {metadata.projectName && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Chantier / Projet :</span>
                  <span className="font-bold text-green-400 text-right truncate max-w-[170px]">
                    {metadata.projectName}
                  </span>
                </div>
              )}

              {metadata.clientName && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Client / Tiers :</span>
                  <span className="font-semibold text-white text-right truncate max-w-[170px]">
                    {metadata.clientName}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Catégorie GED :</span>
                <span className="font-medium text-slate-300 capitalize">{metadata.category || 'Technique'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Date d'enregistrement :</span>
                <span className="font-mono text-slate-300">
                  {metadata.date ? new Date(metadata.date).toLocaleDateString('fr-FR') : 'Récent'}
                </span>
              </div>

              {metadata.montant && metadata.montant > 0 && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Montant Associé :</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {metadata.montant.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              )}
            </div>

            {/* Cloudinary CDN Badge */}
            <div className="p-3 bg-green-950/40 rounded-2xl border border-green-800/60 flex items-center gap-3 text-xs text-green-300">
              <Cloud className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <p className="font-bold text-[11px]">Stockage Sécurisé Cloudinary</p>
                <p className="text-[10px] text-slate-400">Indexation OCR &amp; Sauvegarde Haute Résolution</p>
              </div>
            </div>

            {/* Visa Certification Stamp */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-green-700/20 text-green-400 border border-green-600/30 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-bold text-white uppercase tracking-wider">
                CORESI INTERNATIONAL SARL
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Pointe-Noire • Tuyauterie, Chaudronnerie &amp; BTP
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Document Certifié Conforme</span>
              </div>
            </div>

            {/* Download CTA */}
            <button
              onClick={handleDownload}
              className="w-full py-2.5 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-lg shadow-green-700/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le Fichier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
