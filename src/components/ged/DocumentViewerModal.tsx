import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  Archive,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  Copy,
  Check,
  Building2,
  Calendar,
  DollarSign,
  Cloud,
  History,
  FolderOpen,
  Tag,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { DocumentRecord } from '../../types';
import { CloudinaryService } from '../../services/cloudinaryService';
import { DetailSidebar } from '../shared/DetailSidebar';

interface DocumentViewerModalProps {
  document: DocumentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectProject?: (projectId: string) => void;
  onOpenOcrValidation?: (document: DocumentRecord) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  isOpen,
  onClose,
  onArchive,
  onDelete,
  onSelectProject,
  onOpenOcrValidation,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [copiedOcr, setCopiedOcr] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'ocr' | 'details' | 'audit'>('preview');

  if (!isOpen || !document) return null;

  const handleCopyOcr = () => {
    navigator.clipboard.writeText(document.ocr.text);
    setCopiedOcr(true);
    setTimeout(() => setCopiedOcr(false), 2000);
  };

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.cloudinary.secureUrl;
    link.download = `${document.documentNumber || document.title}.pdf`;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open(document.cloudinary.secureUrl, '_blank');
    printWindow?.print();
  };

  return (
    <DetailSidebar
      isOpen={isOpen}
      onClose={onClose}
      title={document.title}
      subtitle={`Ajouté par ${document.uploadedBy} • ${new Date(document.createdAt).toLocaleDateString('fr-FR')}`}
      referenceCode={document.documentNumber}
      badge={{
        text: document.category.replace('_', ' ').toUpperCase(),
        color: 'bg-cyan-950 text-cyan-400 border-cyan-800'
      }}
      width="full"
      actions={[
        ...(onOpenOcrValidation ? [{
          label: 'Validation IA/OCR',
          icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />,
          onClick: () => onOpenOcrValidation(document),
          variant: 'primary' as const,
        }] : []),
        {
          label: 'Télécharger',
          icon: <Download className="w-3.5 h-3.5" />,
          onClick: handleDownload,
          variant: 'secondary' as const,
        },
        {
          label: 'Imprimer',
          icon: <Printer className="w-3.5 h-3.5" />,
          onClick: handlePrint,
          variant: 'secondary' as const,
        },
        {
          label: 'Archiver',
          icon: <Archive className="w-3.5 h-3.5" />,
          onClick: () => {
            onArchive(document.id);
            onClose();
          },
          variant: 'secondary' as const,
        },
        {
          label: 'Supprimer',
          icon: <Trash2 className="w-3.5 h-3.5" />,
          onClick: () => {
            if (window.confirm('Êtes-vous certain de vouloir supprimer définitivement ce document de la GED ?')) {
              onDelete(document.id);
              onClose();
            }
          },
          variant: 'danger' as const,
        },
      ]}
    >
      {/* Navigation Tabs */}
      <div className="bg-slate-100 dark:bg-slate-950/80 -mx-5 -mt-4 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Aperçu Document
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'ocr'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Reconnaissance OCR &amp; Recherche
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Métadonnées &amp; Relations
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Traçabilité &amp; Cloudinary
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col md:flex-row bg-slate-900 rounded-xl overflow-hidden mt-3 min-h-[520px]">
          {/* Main Visualizer or OCR View */}
          <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center bg-slate-950/50 relative">
            {activeTab === 'preview' && (
              <>
                {/* Floating zoom controls */}
                <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-1 flex items-center gap-1 shadow-xl">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 20))}
                    className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                    title="Zoom arrière"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-300 px-2">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(250, z + 20))}
                    className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                    title="Zoom avant"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1.5 hover:bg-slate-800 text-slate-300 rounded ml-1"
                    title="Pivoter 90°"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setZoomLevel(100);
                      setRotation(0);
                    }}
                    className="p-1.5 hover:bg-slate-800 text-slate-300 rounded text-xs px-2"
                  >
                    Reset
                  </button>
                </div>

                {/* Document render */}
                <div className="overflow-auto max-h-full max-w-full flex items-center justify-center p-4">
                  {document.cloudinary.format === 'pdf' ? (
                    <div className="w-full h-[650px] bg-white rounded-xl shadow-2xl overflow-hidden">
                      <iframe
                        src={`${document.cloudinary.secureUrl}#toolbar=0`}
                        title={document.title}
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <img
                      src={document.cloudinary.secureUrl}
                      alt={document.title}
                      style={{
                        transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                        transition: 'transform 0.2s ease-out',
                      }}
                      className="max-h-[650px] max-w-full object-contain rounded-xl shadow-2xl border border-slate-700"
                    />
                  )}
                </div>
              </>
            )}

            {activeTab === 'ocr' && (
              <div className="w-full h-full max-w-3xl flex flex-col p-2">
                <div className="flex items-center justify-between mb-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-white">Texte brut extrait par l'OCR</span>
                    <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                      Confiance : {document.ocr.confidence}%
                    </span>
                  </div>
                  <button
                    onClick={handleCopyOcr}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                  >
                    {copiedOcr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedOcr ? 'Copié !' : 'Copier le texte'}</span>
                  </button>
                </div>

                <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-y-auto">
                  <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {document.ocr.text || 'Aucun texte OCR détecté sur ce document.'}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <h4 className="font-semibold text-base text-white border-b border-slate-800 pb-3">
                  Informations et Liens Métier
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Titre</span>
                    <span className="font-medium text-white">{document.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">N° Document</span>
                    <span className="font-mono text-cyan-300 font-semibold">{document.documentNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Catégorie</span>
                    <span className="capitalize text-slate-200">{document.category.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Date Document</span>
                    <span className="text-slate-200">{document.metadata.documentDate || 'N/A'}</span>
                  </div>
                  {document.metadata.amount && (
                    <div>
                      <span className="text-slate-400 block mb-1">Montant Financier</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {document.metadata.amount.toLocaleString('fr-FR')} {document.metadata.currency || 'FCFA'}
                      </span>
                    </div>
                  )}
                  {document.context.projectName && (
                    <div>
                      <span className="text-slate-400 block mb-1">Projet Chantier Associé</span>
                      <button
                        onClick={() => {
                          if (document.context.projectId && onSelectProject) {
                            onSelectProject(document.context.projectId);
                            onClose();
                          }
                        }}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium underline"
                      >
                        {document.context.projectName}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {document.context.clientName && (
                    <div>
                      <span className="text-slate-400 block mb-1">Client</span>
                      <span className="text-slate-200">{document.context.clientName}</span>
                    </div>
                  )}
                  {document.context.supplierName && (
                    <div>
                      <span className="text-slate-400 block mb-1">Fournisseur</span>
                      <span className="text-slate-200">{document.context.supplierName}</span>
                    </div>
                  )}
                </div>

                {document.metadata.tags && document.metadata.tags.length > 0 && (
                  <div className="pt-3 border-t border-slate-800">
                    <span className="text-xs text-slate-400 block mb-2">Mots-clés &amp; Tags :</span>
                    <div className="flex flex-wrap gap-1.5">
                      {document.metadata.tags.map((t, idx) => (
                        <span key={idx} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <h4 className="font-semibold text-base text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-cyan-400" />
                  Métadonnées Cloudinary &amp; Traçabilité
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono">
                    <p className="text-slate-400">
                      Cloudinary Public ID : <span className="text-cyan-300">{document.cloudinary.publicId}</span>
                    </p>
                    <p className="text-slate-400">
                      Format : <span className="text-slate-200 uppercase">{document.cloudinary.format}</span>
                    </p>
                    <p className="text-slate-400">
                      Taille : <span className="text-slate-200">{CloudinaryService.formatFileSize(document.cloudinary.bytes)}</span>
                    </p>
                    <p className="text-slate-400">
                      Dossier : <span className="text-slate-200">{document.cloudinary.folder || 'CORESI/archives'}</span>
                    </p>
                    <p className="text-slate-400">
                      Pages : <span className="text-slate-200">{document.cloudinary.pageCount || 1}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <h5 className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-amber-400" />
                      Historique des interventions
                    </h5>
                    <div className="text-slate-400 space-y-1">
                      <p>• Document numérisé / créé le : {new Date(document.createdAt).toLocaleString('fr-FR')} par {document.uploadedBy}</p>
                      <p>• Dernière validation : {new Date(document.updatedAt).toLocaleString('fr-FR')}</p>
                      <p>• Statut de sécurité : <span className="text-emerald-400 font-semibold">{document.status.toUpperCase()}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </DetailSidebar>
  );
};
