import React, { useState, useMemo } from 'react';
import {
  Search,
  Camera,
  Upload,
  Filter,
  FileText,
  Eye,
  Archive,
  Tag,
  CheckCircle,
  Clock,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Download,
  FolderOpen,
  Shield,
  X,
} from 'lucide-react';
import { DocumentCategory, DocumentRecord, DocumentStatus, UserRole } from '../../types';
import { OCRService } from '../../services/ocrService';
import { CloudinaryService } from '../../services/cloudinaryService';
import { ROLE_CONFIGS } from '../../services/rolePermissions';

interface GedModuleProps {
  documents: DocumentRecord[];
  currentUserRole?: UserRole;
  onOpenScanner: () => void;
  onOpenUpload: () => void;
  onSelectDocument: (doc: DocumentRecord) => void;
  onArchiveDocument: (id: string) => void;
  onSelectProject?: (projectId: string) => void;
}

export const GedModule: React.FC<GedModuleProps> = ({
  documents,
  currentUserRole = 'dg',
  onOpenScanner,
  onOpenUpload,
  onSelectDocument,
  onArchiveDocument,
  onSelectProject,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchOcrOnly, setSearchOcrOnly] = useState<boolean>(true);

  // Role-based allowed categories in GED
  const roleCategoryMap: Record<UserRole, DocumentCategory[] | 'all'> = {
    dg: 'all',
    admin: 'all',
    comptable: ['factures', 'devis', 'bons_commande', 'justificatifs', 'comptable', 'financier'],
    rh: ['rh', 'contrats', 'administratif', 'justificatifs'],
    chef_projet: ['projets', 'plans_techniques', 'rapports', 'bons_livraison', 'devis'],
    magasinier: ['bons_livraison', 'bons_commande', 'plans_techniques', 'justificatifs'],
    employe: ['rh', 'contrats', 'justificatifs'],
    invite: ['rh', 'contrats', 'justificatifs'],
  };

  const allowedCategories = roleCategoryMap[currentUserRole] || 'all';

  const allCategories: { id: string; label: string }[] = [
    { id: 'all', label: 'Toutes les catégories' },
    { id: 'factures', label: 'Factures' },
    { id: 'devis', label: 'Devis' },
    { id: 'bons_commande', label: 'Bons de commande' },
    { id: 'bons_livraison', label: 'Bons de livraison' },
    { id: 'contrats', label: 'Contrats' },
    { id: 'rapports', label: 'Rapports & PV' },
    { id: 'projets', label: 'Documents Projet' },
    { id: 'justificatifs', label: 'Justificatifs' },
    { id: 'rh', label: 'Personnel & RH' },
    { id: 'plans_techniques', label: 'Plans & Isométriques' },
    { id: 'administratif', label: 'Administratif' },
  ];

  const visibleCategories = allCategories.filter((cat) => {
    if (cat.id === 'all') return true;
    if (allowedCategories === 'all') return true;
    return allowedCategories.includes(cat.id as DocumentCategory);
  });

  // Filtering with role-based restriction & OCR full-text search
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Role-based department restriction
      if (allowedCategories !== 'all') {
        if (!allowedCategories.includes(doc.category)) {
          return false;
        }
      }

      // 2. Status filter
      if (selectedStatus !== 'all' && doc.status !== selectedStatus) return false;

      // 3. Category filter
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;

      // 4. Text search
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();

      const titleMatch = doc.title.toLowerCase().includes(query);
      const numberMatch = doc.documentNumber.toLowerCase().includes(query);
      const projectMatch = doc.context.projectName?.toLowerCase().includes(query) || false;
      const clientMatch = doc.context.clientName?.toLowerCase().includes(query) || false;
      const supplierMatch = doc.context.supplierName?.toLowerCase().includes(query) || false;
      const tagsMatch = doc.metadata.tags?.some((t) => t.toLowerCase().includes(query)) || false;

      // Deep OCR search
      const ocrMatch = searchOcrOnly && OCRService.matchesSearch(doc.ocr?.text || '', query);

      return titleMatch || numberMatch || projectMatch || clientMatch || supplierMatch || tagsMatch || ocrMatch;
    });
  }, [documents, searchQuery, selectedCategory, selectedStatus, searchOcrOnly, allowedCategories]);

  return (
    <div className="space-y-6">
      {/* Top Banner with prominent Scanner and Import CTAs */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
              <FolderOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              GED — Gestion Électronique des Documents
            </h2>
            {allowedCategories !== 'all' && (
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span>Vue filtrée : {ROLE_CONFIGS[currentUserRole]?.title}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Centralisation, indexation OCR et archivage sécurisé des pièces administratives, techniques et financières de CORESI INTERNATIONAL SARL.
          </p>
        </div>

        {/* The two core actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenScanner}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-transform active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Numériser un document</span>
          </button>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Importer un fichier</span>
          </button>
        </div>
      </div>

      {/* Advanced Search & Filtering Toolbar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Recherche par n°, titre, projet, tiers ou dans le contenu textuel OCR..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white flex items-center justify-center"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            {visibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">Tous les états</option>
            <option value="validated">Validés &amp; Archivés</option>
            <option value="pending_validation">En attente de visa</option>
            <option value="archived">Archives historiques</option>
          </select>

          {/* View mode switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Grille
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tableau
            </button>
          </div>
        </div>

        {/* Deep OCR Toggle Indicator */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={searchOcrOnly}
              onChange={(e) => setSearchOcrOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span className="flex items-center gap-1 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Recherche plein-texte dans le corps du document numérisé (OCR actif)
            </span>
          </label>

          <span className="text-slate-400 font-mono">
            {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''} trouvé{filteredDocuments.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc)}
              className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 shadow-lg hover:shadow-cyan-500/10 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Thumbnail Preview with Document Badge */}
                <div className="relative aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden mb-3 border border-slate-800">
                  <img
                    src={CloudinaryService.getOptimizedThumbnail(doc.cloudinary.secureUrl, 400, 300)}
                    alt={doc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-950/80 backdrop-blur-md text-cyan-300 rounded-md border border-cyan-800/60">
                      {doc.documentNumber}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-semibold backdrop-blur-md uppercase tracking-wider ${
                        doc.status === 'validated'
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60'
                          : doc.status === 'pending_validation'
                          ? 'bg-amber-950/90 text-amber-300 border border-amber-700/60'
                          : 'bg-slate-900/90 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {doc.status === 'validated' ? 'Validé' : doc.status === 'pending_validation' ? 'À valider' : 'Archivé'}
                    </span>
                  </div>

                  {/* OCR confidence chip */}
                  {doc.ocr?.confidence && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur text-[9px] font-mono text-slate-300 border border-slate-800 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                      <span>{Math.round(doc.ocr.confidence)}% OCR</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                  {doc.title}
                </h3>
                <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                  {doc.category.replace('_', ' ')}
                </p>

                {/* Relational Context Chips */}
                <div className="mt-2.5 space-y-1 text-[11px]">
                  {doc.context.projectName && (
                    <p className="text-slate-300 flex items-center gap-1.5 truncate">
                      <Building2 className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{doc.context.projectName}</span>
                    </p>
                  )}
                  {doc.context.clientName && (
                    <p className="text-slate-400 flex items-center gap-1.5 truncate">
                      <span className="text-slate-500">Client:</span>
                      <span className="truncate text-slate-300">{doc.context.clientName}</span>
                    </p>
                  )}
                  {doc.context.supplierName && (
                    <p className="text-slate-400 flex items-center gap-1.5 truncate">
                      <span className="text-slate-500">Fourn:</span>
                      <span className="truncate text-slate-300">{doc.context.supplierName}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Footer Info */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {doc.metadata.documentDate || doc.createdAt.split('T')[0]}
                </span>
                {doc.metadata.amount && (
                  <span className="font-mono font-bold text-emerald-400">
                    {doc.metadata.amount.toLocaleString('fr-FR')} {doc.metadata.currency || 'FCFA'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">N° Document</th>
                  <th className="py-3 px-4">Titre &amp; Catégorie</th>
                  <th className="py-3 px-4">Projet Chantier</th>
                  <th className="py-3 px-4">Tiers (Client / Fournisseur)</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Montant</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                      {doc.documentNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{doc.title}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{doc.category.replace('_', ' ')}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {doc.context.projectName || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {doc.context.clientName || doc.context.supplierName || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {doc.metadata.documentDate || doc.createdAt.split('T')[0]}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {doc.metadata.amount ? `${doc.metadata.amount.toLocaleString('fr-FR')} ${doc.metadata.currency || 'FCFA'}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          doc.status === 'validated'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : doc.status === 'pending_validation'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {doc.status === 'validated' ? 'Validé' : doc.status === 'pending_validation' ? 'À valider' : 'Archivé'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDocument(doc);
                        }}
                        className="p-1 hover:bg-slate-800 rounded text-cyan-400 hover:text-cyan-300"
                        title="Visualiser"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-bold text-base text-white">Aucun document ne correspond à vos critères</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {allowedCategories !== 'all'
              ? `Votre rôle actuel (${ROLE_CONFIGS[currentUserRole]?.title}) a accès uniquement aux documents relatifs à votre département.`
              : 'Essayez d\'ajuster vos filtres de recherche ou numérisez un nouveau document avec le Smart Scanner.'}
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenScanner}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold"
            >
              Numériser avec le Smart Scanner
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
