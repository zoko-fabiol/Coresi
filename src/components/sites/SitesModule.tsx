import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  ArrowRightLeft,
  Building,
  CheckCircle,
  Clock,
  Truck,
  Layers,
  Search,
  Users,
  Wrench,
  DollarSign,
  FolderKanban,
  Package,
} from 'lucide-react';
import {
  OperationalSite,
  SiteStockTransfer,
} from '../../types/advancedModules';
import { SiteService } from '../../services/siteService';
import { DataService } from '../../services/dataService';
import { Material, Employee, Project } from '../../types';
import { DetailSidebar, SidebarSection, SidebarField, SidebarDivider } from '../shared/DetailSidebar';

interface SitesModuleProps {
  sites: OperationalSite[];
  transfers: SiteStockTransfer[];
  materials: Material[];
  employees: Employee[];
  projects: Project[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const SitesModule: React.FC<SitesModuleProps> = ({
  sites,
  transfers,
  materials,
  employees,
  projects,
  onRefresh,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'sites' | 'transfers'>('sites');
  const [searchQuery, setSearchQuery] = useState('');
  const [newSiteOpen, setNewSiteOpen] = useState(false);
  const [newTransferOpen, setNewTransferOpen] = useState(false);
  const [viewSite, setViewSite] = useState<OperationalSite | null>(null);
  const [viewTransfer, setViewTransfer] = useState<SiteStockTransfer | null>(null);

  // New Site Form State
  const [siteName, setSiteName] = useState('');
  const [siteType, setSiteType] = useState<OperationalSite['type']>('construction_site');
  const [siteAddress, setSiteAddress] = useState('');
  const [siteCity, setSiteCity] = useState('Pointe-Noire');
  const [siteRegion, setSiteRegion] = useState('Kouilou');
  const [siteCountry, setSiteCountry] = useState('Congo');
  const [siteManagerName, setSiteManagerName] = useState('Ing. Paul Kimbembe');

  // New Transfer Form State
  const [trfSourceId, setTrfSourceId] = useState(sites[0]?.id || '');
  const [trfTargetId, setTrfTargetId] = useState(sites[1]?.id || '');
  const [trfMaterialId, setTrfMaterialId] = useState(materials[0]?.id || '');
  const [trfQuantity, setTrfQuantity] = useState(1);
  const [trfNotes, setTrfNotes] = useState('');

  const currentUser = DataService.getCurrentUser();
  const metrics = SiteService.getConsolidatedMetrics();

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) {
      showToast('Veuillez renseigner le nom du site / chantier.');
      return;
    }

    await SiteService.createSite({
      name: siteName,
      type: siteType,
      address: siteAddress,
      city: siteCity,
      region: siteRegion,
      country: siteCountry,
      managerName: siteManagerName,
      status: 'actif',
    });

    setNewSiteOpen(false);
    setSiteName('');
    setSiteAddress('');
    onRefresh();
    showToast('Nouveau site / chantier opérationnel enregistré.');
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trfSourceId === trfTargetId) {
      showToast('Le site source et le site de destination doivent être différents.');
      return;
    }

    const source = sites.find((s) => s.id === trfSourceId);
    const target = sites.find((s) => s.id === trfTargetId);
    const mat = materials.find((m) => m.id === trfMaterialId);
    if (!source || !target || !mat) return;

    await SiteService.initiateTransfer({
      sourceSiteId: source.id,
      sourceSiteName: source.name,
      targetSiteId: target.id,
      targetSiteName: target.name,
      materialId: mat.id,
      materialName: mat.name,
      materialCode: mat.code,
      quantity: Number(trfQuantity) || 1,
      unit: mat.unit || 'unités',
      requestedBy: currentUser.displayName,
      notes: trfNotes || undefined,
    });

    setNewTransferOpen(false);
    setTrfNotes('');
    onRefresh();
    showToast('Demande de transfert inter-sites émise avec succès.');
  };

  const handleDispatch = async (id: string) => {
    await SiteService.dispatchTransfer(id, currentUser.displayName);
    onRefresh();
    showToast('Matériel expédié (en transit vers le site de destination).');
  };

  const handleReceive = async (id: string) => {
    await SiteService.receiveTransfer(id, currentUser.displayName);
    onRefresh();
    showToast('Transfert réceptionné et stock du site mis à jour.');
  };

  const filteredSites = sites.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransfers = transfers.filter(
    (t) =>
      t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sourceSiteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.targetSiteName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Multi-Sites & Chantiers Déportés</h1>
            <p className="text-sm text-slate-400">
              Pilotage des bases industrielles, plateformes offshore et transferts de stock
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'sites' && (
            <button
              onClick={() => setNewSiteOpen(true)}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-sm transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" /> Nouveau Chantier / Site
            </button>
          )}
          {activeTab === 'transfers' && (
            <button
              onClick={() => setNewTransferOpen(true)}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-sm transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" /> Initier un Transfert
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('sites')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'sites'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bases & Chantiers ({sites.length})
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'transfers'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Transferts Inter-Sites ({transfers.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher site, transfert..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tab 1: Sites Cards */}
      {activeTab === 'sites' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSites.map((site) => {
            const m = metrics.find((item) => item.siteId === site.id);
            return (
              <div
                key={site.id}
                className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 space-y-4 transition-all cursor-pointer"
                onClick={() => setViewSite(site)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700">
                      {site.code}
                    </span>
                    <h3 className="font-bold text-white text-lg mt-2">{site.name}</h3>
                    <p className="text-xs text-slate-400">
                      {site.address}, {site.city} — {site.country}
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {site.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Projets</span>
                    <strong className="text-base text-white font-mono">{m?.projectsCount || 0}</strong>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Effectif</span>
                    <strong className="text-base text-cyan-400 font-mono">{m?.employeesCount || 0}</strong>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Matériels</span>
                    <strong className="text-base text-white font-mono">{m?.materialsCount || 0}</strong>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">OT GMAO</span>
                    <strong className="text-base text-amber-400 font-mono">{m?.openWorkOrders || 0}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Responsable : <strong className="text-white">{site.managerName}</strong></span>
                  <span className="capitalize">{site.type.replace(/_/g, ' ')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Transferts Inter-Sites */}
      {activeTab === 'transfers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">N° Transfert</th>
                  <th className="p-4">Matériel & Quantité</th>
                  <th className="p-4">Origine → Destination</th>
                  <th className="p-4">Demandeur</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setViewTransfer(trf)}>
                    <td className="p-4 font-mono font-bold text-cyan-400">{trf.reference}</td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{trf.materialName}</div>
                      <div className="text-xs text-cyan-300 font-mono font-bold">
                        {trf.quantity} {trf.unit}
                      </div>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="text-slate-400">{trf.sourceSiteName}</div>
                      <div className="text-white font-semibold flex items-center gap-1">
                        ↓ {trf.targetSiteName}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 text-xs">{trf.requestedBy}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                          trf.status === 'receptionne'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : trf.status === 'en_transit'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {trf.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      {trf.status === 'demande' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDispatch(trf.id); }}
                          className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition-colors"
                        >
                          Expédier
                        </button>
                      )}
                      {trf.status === 'en_transit' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReceive(trf.id); }}
                          className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors"
                        >
                          Réceptionner
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredTransfers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Aucun mouvement inter-sites enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Nouveau Chantier */}
      {newSiteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Créer une Base ou un Chantier Déporté</h2>
            <form onSubmit={handleCreateSite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nom du Site / Chantier</label>
                <input
                  type="text"
                  placeholder="Ex: Chantier Terminal Djeno Onshore..."
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Type d'Emplacement</label>
                  <select
                    value={siteType}
                    onChange={(e) => setSiteType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="construction_site">Chantier BTP / Tuyauterie</option>
                    <option value="headquarters">Siège / Ateliers Centraux</option>
                    <option value="branch">Antenne / Filiale</option>
                    <option value="temporary_site">Chantier Temporaire / Offshore</option>
                    <option value="warehouse">Dépôt / Entrepôt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Ville / Zone</label>
                  <input
                    type="text"
                    value={siteCity}
                    onChange={(e) => setSiteCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Adresse ou Emplacement Géographique</label>
                <input
                  type="text"
                  placeholder="Zone industrielle, PK, coordonnées..."
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Responsable du Site</label>
                <input
                  type="text"
                  value={siteManagerName}
                  onChange={(e) => setSiteManagerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewSiteOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm"
                >
                  Enregistrer Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nouveau Transfert Inter-Sites */}
      {newTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Initier un Transfert de Matériel Inter-Sites</h2>
            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Site Expéditeur (Origine)</label>
                  <select
                    value={trfSourceId}
                    onChange={(e) => setTrfSourceId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Site Destinataire</label>
                  <select
                    value={trfTargetId}
                    onChange={(e) => setTrfTargetId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Matériel / Équipement à transférer</label>
                <select
                  value={trfMaterialId}
                  onChange={(e) => setTrfMaterialId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name} (Stock actuel: {m.quantity} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Quantité à transférer</label>
                <input
                  type="number"
                  min={1}
                  value={trfQuantity}
                  onChange={(e) => setTrfQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Instructions d'expédition</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Expédition par camion plateau, arrimage sécurisé..."
                  value={trfNotes}
                  onChange={(e) => setTrfNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewTransferOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm"
                >
                  Initier Transfert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DetailSidebar: Site Detail */}
      <DetailSidebar
        isOpen={!!viewSite}
        onClose={() => setViewSite(null)}
        title={viewSite?.name || ''}
        subtitle={viewSite ? `${viewSite.address}, ${viewSite.city} — ${viewSite.country}` : ''}
        referenceCode={viewSite?.code}
        badge={viewSite ? { text: viewSite.status, color: 'bg-emerald-900/40 text-emerald-300 border-emerald-700' } : undefined}
      >
        {viewSite && (() => {
          const m = metrics.find((item) => item.siteId === viewSite.id);
          return (
            <>
              <SidebarSection title="Informations du Site" icon={<Building className="w-3.5 h-3.5" />}>
                <SidebarField label="Nom" value={viewSite.name} highlight />
                <SidebarField label="Type" value={viewSite.type.replace(/_/g, ' ')} />
                <SidebarField label="Adresse" value={viewSite.address || '—'} />
                <SidebarField label="Ville" value={viewSite.city} />
                <SidebarField label="Région" value={viewSite.region} />
                <SidebarField label="Pays" value={viewSite.country} />
                <SidebarField label="Responsable" value={viewSite.managerName} highlight />
              </SidebarSection>
              <SidebarDivider />
              <SidebarSection title="Indicateurs Opérationnels" icon={<Layers className="w-3.5 h-3.5" />}>
                <SidebarField label="Projets actifs" value={m?.projectsCount || 0} mono highlight />
                <SidebarField label="Effectif déployé" value={m?.employeesCount || 0} mono />
                <SidebarField label="Matériels en stock" value={m?.materialsCount || 0} mono />
                <SidebarField label="OT Maintenance ouverts" value={m?.openWorkOrders || 0} mono />
              </SidebarSection>
            </>
          );
        })()}
      </DetailSidebar>

      {/* DetailSidebar: Transfer Detail */}
      <DetailSidebar
        isOpen={!!viewTransfer}
        onClose={() => setViewTransfer(null)}
        title={viewTransfer ? `Transfert : ${viewTransfer.materialName}` : ''}
        subtitle={viewTransfer ? `${viewTransfer.sourceSiteName} → ${viewTransfer.targetSiteName}` : ''}
        referenceCode={viewTransfer?.reference}
        badge={viewTransfer ? {
          text: viewTransfer.status.replace(/_/g, ' '),
          color: viewTransfer.status === 'receptionne' ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
            : viewTransfer.status === 'en_transit' ? 'bg-blue-900/40 text-blue-300 border-blue-700'
            : 'bg-amber-900/40 text-amber-300 border-amber-700',
        } : undefined}
        actions={viewTransfer ? [
          ...(viewTransfer.status === 'demande' ? [{
            label: 'Expédier', icon: <Truck className="w-3.5 h-3.5" />,
            onClick: () => { handleDispatch(viewTransfer.id); setViewTransfer(null); },
            variant: 'primary' as const,
          }] : []),
          ...(viewTransfer.status === 'en_transit' ? [{
            label: 'Réceptionner', icon: <CheckCircle className="w-3.5 h-3.5" />,
            onClick: () => { handleReceive(viewTransfer.id); setViewTransfer(null); },
            variant: 'success' as const,
          }] : []),
        ] : []}
      >
        {viewTransfer && (
          <>
            <SidebarSection title="Détails du Transfert" icon={<ArrowRightLeft className="w-3.5 h-3.5" />}>
              <SidebarField label="Matériel" value={viewTransfer.materialName} highlight />
              <SidebarField label="Code matériel" value={viewTransfer.materialCode} mono />
              <SidebarField label="Quantité" value={`${viewTransfer.quantity} ${viewTransfer.unit}`} mono highlight />
              <SidebarField label="Site origine" value={viewTransfer.sourceSiteName} />
              <SidebarField label="Site destination" value={viewTransfer.targetSiteName} highlight />
              <SidebarField label="Demandé par" value={viewTransfer.requestedBy} />
              {viewTransfer.notes && <SidebarField label="Notes" value={viewTransfer.notes} />}
              {viewTransfer.dispatchedBy && <SidebarField label="Expédié par" value={viewTransfer.dispatchedBy} />}
              {viewTransfer.receivedBy && <SidebarField label="Réceptionné par" value={viewTransfer.receivedBy} />}
            </SidebarSection>
          </>
        )}
      </DetailSidebar>
    </div>
  );
};
