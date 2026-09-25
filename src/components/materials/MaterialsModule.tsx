import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ArrowRightLeft,
  Truck,
  FileText,
  Clock,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  X,
  ExternalLink,
  DollarSign,
  AlertOctagon,
} from 'lucide-react';
import { Material, Project, StockMovement, Supplier } from '../../types';
import { DataService } from '../../services/dataService';
import { DetailSidebar, SidebarSection, SidebarField, SidebarStatusBadge, SidebarDivider } from '../shared/DetailSidebar';

interface MaterialsModuleProps {
  materials: Material[];
  projects: Project[];
  onNewMaterial: () => void;
  onRefresh?: () => void;
  onSelectDocument?: (docId: string) => void;
}

export const MaterialsModule: React.FC<MaterialsModuleProps> = ({
  materials,
  projects,
  onNewMaterial,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements' | 'suppliers' | 'maintenance'>('inventory');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // DetailSidebar selections
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);

  const stockMovements = DataService.getStockMovements();
  const suppliers = DataService.getSuppliers();

  // Modal: New Stock Movement (Bon d'Entrée / Bon de Sortie)
  const [movementModalOpen, setMovementModalOpen] = useState<boolean>(false);
  const [moveType, setMoveType] = useState<'sortie_chantier' | 'entree_fournisseur' | 'retour_base'>('sortie_chantier');
  const [selectedMatId, setSelectedMatId] = useState<string>(materials[0]?.id || '');
  const [moveQty, setMoveQty] = useState<number>(1);
  const [moveProjectId, setMoveProjectId] = useState<string>(projects[0]?.id || '');
  const [moveRecipient, setMoveRecipient] = useState<string>('Moussa Traoré (Soudeur HP)');
  const [moveEmitter, setMoveEmitter] = useState<string>('Alexandre Makosso (Magasinier Base)');
  const [moveIsRestituable, setMoveIsRestituable] = useState<boolean>(true);
  const [moveNotes, setMoveNotes] = useState<string>('');

  const filteredMaterials = materials.filter((m) => {
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.location.toLowerCase().includes(q);
  });

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMat = materials.find((m) => m.id === selectedMatId);
    const targetPrj = projects.find((p) => p.id === moveProjectId);

    if (!targetMat) return;

    const newMovement: StockMovement = {
      id: `stk-${Date.now()}`,
      reference: moveType === 'sortie_chantier' ? `BS-2026-0${Math.floor(25 + Math.random() * 70)}` : moveType === 'retour_base' ? `BR-2026-0${Math.floor(10 + Math.random() * 80)}` : `BE-2026-0${Math.floor(10 + Math.random() * 80)}`,
      type: moveType,
      materialId: targetMat.id,
      materialName: targetMat.name,
      materialCode: targetMat.code,
      quantity: moveQty,
      unit: targetMat.unit,
      date: new Date().toISOString().split('T')[0],
      projectId: moveType === 'sortie_chantier' ? targetPrj?.id : undefined,
      projectName: moveType === 'sortie_chantier' ? targetPrj?.name : undefined,
      recipientName: moveRecipient,
      emitterName: moveEmitter,
      isRestituable: moveType === 'sortie_chantier' ? moveIsRestituable : false,
      returnStatus: moveType === 'sortie_chantier' && moveIsRestituable ? 'en_cours' : 'non_applicable',
      notes: moveNotes || `Mouvement enregistré par le magasinier pour ${moveRecipient}`,
    };

    await DataService.saveStockMovement(newMovement);
    if (onRefresh) onRefresh();
    setMovementModalOpen(false);
  };

  const handleConfirmReturn = async (movement: StockMovement) => {
    const returnMovement: StockMovement = {
      id: `stk-${Date.now()}`,
      reference: `BR-2026-0${Math.floor(10 + Math.random() * 80)}`,
      type: 'retour_base',
      materialId: movement.materialId,
      materialName: movement.materialName,
      materialCode: movement.materialCode,
      quantity: movement.quantity,
      unit: movement.unit,
      date: new Date().toISOString().split('T')[0],
      recipientName: 'Alexandre Makosso (Magasinier Base)',
      emitterName: movement.recipientName,
      isRestituable: false,
      returnStatus: 'restitue',
      notes: `Restitution du matériel suite au bon initial ${movement.reference}`,
    };
    await DataService.saveStockMovement(returnMovement);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Wrench className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Gestion des Stocks, Outillage &amp; Équipements Industriels
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Suivi du parc de machines (postes TIG/MIG, compresseurs, épreuves hydrostatiques), des bons de sortie chantier et des achats auprès des fournisseurs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMovementModalOpen(true)}
            className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-transform active:scale-95 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Bon d'Entrée / Sortie</span>
          </button>

          <button
            onClick={onNewMaterial}
            className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Équipement</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Équipements Disponibles (Base)</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            {materials.filter((m) => m.status === 'disponible').length}
          </p>
          <span className="text-[11px] text-slate-400">Prêts pour affectation immédiate</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Équipements sur Chantiers</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-cyan-400">
            {materials.filter((m) => m.status === 'assigne').length}
          </p>
          <span className="text-[11px] text-slate-400">Djeno, Mfila, Muanda</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Mouvements Réalisés (BS / BE)</span>
            <ArrowRightLeft className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {stockMovements.length}
          </p>
          <span className="text-[11px] text-amber-400">Traçabilité 100% enregistrée</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Maintenance &amp; Révision</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-purple-400">
            {materials.filter((m) => m.status === 'maintenance' || m.condition === 'en_maintenance').length}
          </p>
          <span className="text-[11px] text-slate-400">Carnets d'entretien à jour</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
            activeTab === 'inventory' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Parc Matériels &amp; Outillages ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
            activeTab === 'movements' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Bons d'Entrées &amp; Sorties de Stock ({stockMovements.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
            activeTab === 'suppliers' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Fournisseurs &amp; Matériels Coûteux
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
            activeTab === 'maintenance' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Carnet d'Entretien &amp; Maintenance
        </button>
      </div>

      {/* TAB 1: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par référence, outillage ou localisation..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">Toutes les catégories</option>
              <option value="soudage">Postes de soudage</option>
              <option value="levage">Levage &amp; Grues</option>
              <option value="outillage">Outillage lourd &amp; Épreuves</option>
              <option value="vehicules">Véhicules de chantier</option>
              <option value="protection">EPI &amp; Sécurité</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="disponible">Disponible en base</option>
              <option value="assigne">Affecté sur chantier</option>
              <option value="maintenance">En révision</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((mat) => (
              <div
                key={mat.id}
                onClick={() => setSelectedMaterial(mat)}
                className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between cursor-pointer transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {mat.code}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        mat.status === 'disponible'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : mat.status === 'assigne'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {mat.status === 'disponible' ? 'Disponible en Base' : mat.status === 'assigne' ? 'Déployé Chantier' : 'En Maintenance'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white mb-1 group-hover:text-cyan-200 transition-colors">{mat.name}</h4>
                  <p className="text-xs text-slate-400 capitalize mb-3">{mat.category.replace('_', ' ')}</p>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300 mb-3">
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Stock restant :</span>
                      <span className="font-bold text-white font-mono">{mat.quantity} {mat.unit}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">État technique :</span>
                      <span className="capitalize">{mat.condition.replace('_', ' ')}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Emplacement :</span>
                      <span className="text-cyan-400">{mat.location}</span>
                    </p>
                  </div>

                  {mat.assignedProjectName && (
                    <div className="text-xs bg-blue-950/40 border border-blue-800/40 p-2.5 rounded-xl text-blue-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{mat.assignedProjectName}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 mt-3">
                  <span>Dernier contrôle : {mat.lastMaintenanceDate || 'Conforme'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMatId(mat.id);
                      setMoveType(mat.status === 'assigne' ? 'retour_base' : 'sortie_chantier');
                      setMovementModalOpen(true);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                  >
                    {mat.status === 'assigne' ? 'Enregistrer retour' : 'Émettre bon de sortie'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: STOCK MOVEMENTS (Bons d'Entrées et Sorties) */}
      {activeTab === 'movements' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Registre des Mouvements de Stock (Bons de Sortie &amp; Entrée)</h3>
              <p className="text-xs text-slate-400">
                Suivi du matériel sorti pour les chantiers, personnel responsable récepteur et retours en magasin
              </p>
            </div>
            <button
              onClick={() => setMovementModalOpen(true)}
              className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Bon</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Réf Bon</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Matériel / Fourniture</th>
                  <th className="py-3 px-4">Quantité</th>
                  <th className="py-3 px-4">Chantier Destinataire</th>
                  <th className="py-3 px-4">Récepteur / Responsable</th>
                  <th className="py-3 px-4">Statut Retour</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stockMovements.map((move) => (
                  <tr
                    key={move.id}
                    onClick={() => setSelectedMovement(move)}
                    className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300 group-hover:text-cyan-200">{move.reference}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          move.type === 'sortie_chantier'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : move.type === 'retour_base'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}
                      >
                        {move.type === 'sortie_chantier' ? 'Sortie Chantier' : move.type === 'retour_base' ? 'Retour Base' : 'Entrée Fournisseur'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{move.date}</td>
                    <td className="py-3 px-4 font-medium text-white group-hover:text-cyan-100">
                      <div>{move.materialName}</div>
                      <span className="text-[10px] font-mono text-slate-400">{move.materialCode}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {move.quantity} {move.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {move.projectName || 'Base Centrale'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {move.recipientName}
                    </td>
                    <td className="py-3 px-4">
                      {move.isRestituable ? (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            move.returnStatus === 'restitue'
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-amber-950 text-amber-400'
                          }`}
                        >
                          {move.returnStatus === 'restitue' ? 'Restitué en magasin' : 'En cours sur site'}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Consommable posé</span>
                      )}
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {move.type === 'sortie_chantier' && move.isRestituable && move.returnStatus === 'en_cours' && (
                        <button
                          onClick={() => handleConfirmReturn(move)}
                          className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 rounded text-[11px] font-semibold cursor-pointer"
                        >
                          Enregistrer Restitution
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FOURNISSEURS & MATÉRIELS COÛTEUX */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-bold text-base text-white mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              Politique d'Achat &amp; Suivi des Équipements de Haute Valeur
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              CORESI fait l'acquisition de matériels et consommables techniques coûteux (tubes acier haute pression Sch 80, postes de soudage TIG onde carrée, grues tout-terrain, compresseurs 250 bars) auprès de constructeurs et distributeurs industriels agréés.
              Le système permet d'associer la facture d'achat numérisée dans la GED au matériel et de surveiller l'amortissement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-white">Fournisseur Matériel Tuyauterie &amp; Brides</span>
                <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-300 rounded border border-cyan-800">
                  Fournisseur Clé
                </span>
              </div>
              <h4 className="text-base font-extrabold text-cyan-400">VALLOUREC TUBES AFRIQUE</h4>
              <p className="text-xs text-slate-400 mt-1 mb-3">Tubes sans soudure ASTM A106 Gr B, coudes et raccords forgés haute pression.</p>
              <div className="text-xs space-y-1 text-slate-300 border-t border-slate-900 pt-3">
                <p>• Dépenses cumulées : <strong className="text-white font-mono">14 500 000 FCFA</strong></p>
                <p>• Justificatif lié : Facture FAC-2026-0045 avec certificat 3.1 EN 10204</p>
                <p>• Projets équipés : PRJ-2026-01 (Terminal Djeno Total Congo)</p>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-white">Fabricant Postes &amp; Métaux d'Apport</span>
                <span className="px-2 py-0.5 text-[10px] bg-amber-950 text-amber-300 rounded border border-amber-800">
                  Équipements Lourds
                </span>
              </div>
              <h4 className="text-base font-extrabold text-amber-400">MILLER ELECTRIC &amp; LINCOLN AFRIQUE</h4>
              <p className="text-xs text-slate-400 mt-1 mb-3">Générateurs Miller Dynasty 400 et consommables baguettes électrodes E7018 / TIG ER70S-6.</p>
              <div className="text-xs space-y-1 text-slate-300 border-t border-slate-900 pt-3">
                <p>• Parc acquis : 4 unités Dynasty 400</p>
                <p>• Valeur estimée du parc soudage : <strong className="text-white font-mono">18 200 000 FCFA</strong></p>
                <p>• Étalonnage ampèremètre et certificat de calibration annuel vérifié Bureau Veritas.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white">Carnet d'Entretien Préventif &amp; Contrôles Réglementaires</h3>
            <p className="text-xs text-slate-400">Inspection obligatoire des engins de levage (VGP APAVE) et étalonnage des manomètres de test.</p>
          </div>

          <div className="space-y-3">
            {materials.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMaterial(m)}
                className="p-4 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white group-hover:text-cyan-200 transition-colors">{m.name}</span>
                    <span className="font-mono text-xs text-cyan-400">({m.code})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Localisation : {m.location} • État : <span className="capitalize text-slate-200">{m.condition.replace('_', ' ')}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block text-[10px]">Dernière révision</span>
                    <span className="font-semibold text-emerald-400">{m.lastMaintenanceDate || '15/01/2026'}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-semibold">
                    Certificat Conforme
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: New Stock Movement */}
      {movementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5 text-xs text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Émettre un Bon de Mouvement de Stock</h4>
              <button onClick={() => setMovementModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMovement} className="space-y-3">
              <div>
                <label className="text-slate-300 block mb-1">Type de Mouvement</label>
                <select
                  value={moveType}
                  onChange={(e) => setMoveType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="sortie_chantier">Sortie vers Chantier (Bon de Sortie - BS)</option>
                  <option value="retour_base">Retour du Chantier vers Base (Bon de Retour - BR)</option>
                  <option value="entree_fournisseur">Entrée Fournisseur Réception (Bon d'Entrée - BE)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Équipement / Matériel</label>
                <select
                  value={selectedMatId}
                  onChange={(e) => setSelectedMatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name} ({m.quantity} {m.unit} en stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Quantité</label>
                  <input
                    type="number"
                    value={moveQty}
                    onChange={(e) => setMoveQty(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Matériel Restituable ?</label>
                  <select
                    value={moveIsRestituable ? 'yes' : 'no'}
                    onChange={(e) => setMoveIsRestituable(e.target.value === 'yes')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="yes">Oui (Outillage / Machine)</option>
                    <option value="no">Non (Consommable / Pièce posée)</option>
                  </select>
                </div>
              </div>

              {moveType === 'sortie_chantier' && (
                <div>
                  <label className="text-slate-300 block mb-1">Chantier d'Affectation</label>
                  <select
                    value={moveProjectId}
                    onChange={(e) => setMoveProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-slate-300 block mb-1">Nom du Récepteur (Ouvrier / Chef d'équipe)</label>
                <input
                  type="text"
                  value={moveRecipient}
                  onChange={(e) => setMoveRecipient(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Notes / Référence Commande</label>
                <textarea
                  rows={2}
                  value={moveNotes}
                  onChange={(e) => setMoveNotes(e.target.value)}
                  placeholder="Ex: Sortie pour travaux de nuit sur séparateur..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMovementModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 rounded-lg text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
                >
                  Valider le Bon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DetailSidebar: Fiche Matériel & Outillage */}
      {selectedMaterial && (
        <DetailSidebar
          isOpen={!!selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          title={selectedMaterial.name}
          subtitle={`${selectedMaterial.category.replace('_', ' ').toUpperCase()} • ${selectedMaterial.location}`}
          referenceCode={selectedMaterial.code}
          badge={{
            text: selectedMaterial.status === 'disponible' ? 'Disponible en Base' : selectedMaterial.status === 'assigne' ? 'Déployé Chantier' : 'En Maintenance',
            color: selectedMaterial.status === 'disponible' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : selectedMaterial.status === 'assigne' ? 'bg-blue-950 text-blue-400 border-blue-800' : 'bg-amber-950 text-amber-400 border-amber-800'
          }}
          actions={[
            {
              label: 'Émettre Bon de Sortie',
              icon: <ArrowRightLeft className="w-3.5 h-3.5" />,
              onClick: () => {
                setSelectedMatId(selectedMaterial.id);
                setMoveType('sortie_chantier');
                setMovementModalOpen(true);
                setSelectedMaterial(null);
              },
              variant: 'primary',
            },
            ...(selectedMaterial.status === 'assigne' ? [{
              label: 'Enregistrer Retour Base',
              icon: <CheckCircle className="w-3.5 h-3.5" />,
              onClick: () => {
                setSelectedMatId(selectedMaterial.id);
                setMoveType('retour_base');
                setMovementModalOpen(true);
                setSelectedMaterial(null);
              },
              variant: 'secondary' as const,
            }] : []),
          ]}
        >
          {/* Section: Caractéristiques Techniques & Emplacement */}
          <SidebarSection title="Caractéristiques Techniques" icon={<Wrench className="w-3.5 h-3.5 text-cyan-400" />}>
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <SidebarField label="Désignation Complète" value={selectedMaterial.name} highlight />
              <SidebarField label="Code d'Inventaire" value={selectedMaterial.code} mono />
              <SidebarField label="Catégorie Matériel" value={selectedMaterial.category.replace('_', ' ').toUpperCase()} />
              <SidebarField label="Stock Disponible" value={`${selectedMaterial.quantity} ${selectedMaterial.unit}`} highlight mono />
              <SidebarField label="État Mécanique / Électrique" value={selectedMaterial.condition.replace('_', ' ').toUpperCase()} />
              <SidebarField label="Emplacement Actuel" value={selectedMaterial.location} />
            </div>
          </SidebarSection>

          <SidebarDivider />

          {/* Section: Affectation Chantier */}
          <SidebarSection title="Déploiement Opérationnel" icon={<Building2 className="w-3.5 h-3.5 text-blue-400" />}>
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <SidebarField label="Chantier Actuel" value={selectedMaterial.assignedProjectName || 'Base Centrale (Non Déployé)'} highlight />
              <SidebarField label="Dernier Contrôle Technique" value={selectedMaterial.lastMaintenanceDate || '15/01/2026 (Apave)'} mono />
              <SidebarField label="Conformité Réglementaire" value="Certificat VGP à jour" />
            </div>
          </SidebarSection>
        </DetailSidebar>
      )}

      {/* DetailSidebar: Bon de Mouvement de Stock */}
      {selectedMovement && (
        <DetailSidebar
          isOpen={!!selectedMovement}
          onClose={() => setSelectedMovement(null)}
          title={`Bon : ${selectedMovement.reference}`}
          subtitle={`${selectedMovement.type === 'sortie_chantier' ? 'Sortie Chantier' : selectedMovement.type === 'retour_base' ? 'Retour Base' : 'Entrée Fournisseur'} • ${selectedMovement.materialName}`}
          referenceCode={selectedMovement.reference}
          badge={{
            text: selectedMovement.type === 'sortie_chantier' ? 'SORTIE CHANTIER' : selectedMovement.type === 'retour_base' ? 'RETOUR BASE' : 'ENTRÉE FOURNISSEUR',
            color: selectedMovement.type === 'sortie_chantier' ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
          }}
          actions={[
            ...(selectedMovement.type === 'sortie_chantier' && selectedMovement.isRestituable && selectedMovement.returnStatus === 'en_cours' ? [{
              label: 'Enregistrer Restitution Magasin',
              icon: <CheckCircle className="w-3.5 h-3.5" />,
              onClick: () => {
                handleConfirmReturn(selectedMovement);
                setSelectedMovement(null);
              },
              variant: 'success' as const,
            }] : []),
          ]}
        >
          <SidebarSection title="Détail du Bon de Mouvement" icon={<FileText className="w-3.5 h-3.5 text-cyan-400" />}>
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <SidebarField label="Matériel Sorti" value={selectedMovement.materialName} highlight />
              <SidebarField label="Code Réf" value={selectedMovement.materialCode} mono />
              <SidebarField label="Quantité Mouvementée" value={`${selectedMovement.quantity} ${selectedMovement.unit}`} highlight mono />
              <SidebarField label="Date du Bon" value={selectedMovement.date} mono />
              <SidebarField label="Chantier Destinataire" value={selectedMovement.projectName || 'Base Centrale'} />
              <SidebarField label="Récepteur (Responsable)" value={selectedMovement.recipientName} />
              <SidebarField label="Émetteur (Magasinier)" value={selectedMovement.emitterName || 'Alexandre Makosso'} />
              <SidebarField
                label="Statut Matériel Restituable"
                value={selectedMovement.isRestituable ? (selectedMovement.returnStatus === 'restitue' ? 'Restitué' : 'En cours sur site') : 'Non restituable / Consommable'}
              />
              <SidebarField label="Observations" value={selectedMovement.notes || '-'} />
            </div>
          </SidebarSection>
        </DetailSidebar>
      )}
    </div>
  );
};
