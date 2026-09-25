import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  Activity,
  Layers,
  Search,
  DollarSign,
  User,
  Calendar,
  Settings,
  MapPin,
} from 'lucide-react';
import {
  Equipment,
  MaintenanceWorkOrder,
  MaintenancePlan,
} from '../../types/advancedModules';
import { GmaoService, MaintenanceAlert } from '../../services/gmaoService';
import { DataService } from '../../services/dataService';
import { Project } from '../../types';
import { DetailSidebar, SidebarSection, SidebarField, SidebarDivider } from '../shared/DetailSidebar';

interface GmaoModuleProps {
  equipment: Equipment[];
  workOrders: MaintenanceWorkOrder[];
  plans: MaintenancePlan[];
  projects: Project[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const GmaoModule: React.FC<GmaoModuleProps> = ({
  equipment,
  workOrders,
  plans,
  projects,
  onRefresh,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'equipment' | 'orders' | 'alerts'>('equipment');
  const [searchQuery, setSearchQuery] = useState('');
  const [newEquipmentOpen, setNewEquipmentOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);
  const [closeNotes, setCloseNotes] = useState('');
  const [viewEquipment, setViewEquipment] = useState<Equipment | null>(null);
  const [viewWorkOrder, setViewWorkOrder] = useState<MaintenanceWorkOrder | null>(null);

  // New Equipment Form State
  const [eqName, setEqName] = useState('');
  const [eqCategory, setEqCategory] = useState<Equipment['category']>('soudage');
  const [eqSerial, setEqSerial] = useState('');
  const [eqManufacturer, setEqManufacturer] = useState('');
  const [eqModel, setEqModel] = useState('');
  const [eqProjectId, setEqProjectId] = useState(projects[0]?.id || '');
  const [eqLocation, setEqLocation] = useState('Base Ateliers Pointe-Noire');
  const [eqHours, setEqHours] = useState(0);

  // New Order Form State
  const [orderEquipmentId, setOrderEquipmentId] = useState(equipment[0]?.id || '');
  const [orderType, setOrderType] = useState<MaintenanceWorkOrder['type']>('corrective');
  const [orderPriority, setOrderPriority] = useState<MaintenanceWorkOrder['priority']>('normale');
  const [orderFailureDesc, setOrderFailureDesc] = useState('');
  const [orderTechName, setOrderTechName] = useState('Sébastien Nzamba (Technicien GMAO)');

  const alerts = GmaoService.getAlerts();

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqName.trim()) {
      showToast('Veuillez renseigner le nom de l\'équipement.');
      return;
    }

    const proj = projects.find((p) => p.id === eqProjectId);

    await GmaoService.createEquipment({
      name: eqName,
      category: eqCategory,
      serialNumber: eqSerial || `SN-${Math.floor(10000 + Math.random() * 90000)}`,
      manufacturer: eqManufacturer || 'Fabricant Standard',
      model: eqModel || 'Modèle Industriel',
      projectId: eqProjectId || undefined,
      projectName: proj?.name || 'Base Logistique',
      location: eqLocation,
      status: 'operationnel',
      operatingHours: Number(eqHours) || 0,
      commissioningDate: new Date().toISOString().split('T')[0],
      warrantyEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      nextScheduledMaintenance: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    });

    setNewEquipmentOpen(false);
    setEqName('');
    setEqSerial('');
    setEqManufacturer('');
    setEqModel('');
    onRefresh();
    showToast('Équipement ajouté au parc GMAO.');
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderFailureDesc.trim()) {
      showToast('Veuillez décrire le dysfonctionnement ou l\'opération préventive.');
      return;
    }

    const eq = equipment.find((e) => e.id === orderEquipmentId);
    if (!eq) return;

    await GmaoService.createWorkOrder({
      equipmentId: eq.id,
      equipmentName: eq.name,
      type: orderType,
      priority: orderPriority,
      failureDescription: orderFailureDesc,
      assignedTechnicianName: orderTechName,
      projectId: eq.projectId,
      siteId: eq.siteId,
      laborHours: 2,
      laborRatePerHour: 15000,
      partsUsed: [],
    });

    setNewOrderOpen(false);
    setOrderFailureDesc('');
    onRefresh();
    showToast('Ordre de travail GMAO émis avec succès.');
  };

  const handleCloseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingOrderId) return;

    await GmaoService.closeWorkOrder(closingOrderId, closeNotes || 'Intervention terminée avec succès.');
    setClosingOrderId(null);
    setCloseNotes('');
    onRefresh();
    showToast('Intervention clôturée et équipement remis en service.');
  };

  const filteredEquipment = equipment.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = workOrders.filter(
    (w) =>
      w.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.assignedTechnicianName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Maintenance Industrielle & GMAO</h1>
            <p className="text-sm text-slate-400">
              Parc engins, suivi préventif/correctif, ordres de travail et coûts de pièces
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'equipment' && (
            <button
              onClick={() => setNewEquipmentOpen(true)}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-sm transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" /> Nouvel Équipement
            </button>
          )}
          {activeTab === 'orders' && (
            <button
              onClick={() => setNewOrderOpen(true)}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-sm transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" /> Créer un Ordre de Travail (OT)
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'equipment'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Parc Équipements ({equipment.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ordres de Travail ({workOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'alerts'
                ? 'bg-rose-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Alertes & Pannes</span>
            {alerts.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-300 border border-rose-700 text-xs flex items-center justify-center font-bold">
                {alerts.length}
              </span>
            )}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher équipement, OT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tab 1: Parc Équipements */}
      {activeTab === 'equipment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((eq) => (
            <div
              key={eq.id}
              className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer"
              onClick={() => setViewEquipment(eq)}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700">
                    {eq.reference}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      eq.status === 'operationnel'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : eq.status === 'en_maintenance'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {eq.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-white text-base mb-1">{eq.name}</h3>
                <p className="text-xs text-slate-400 mb-4">
                  {eq.manufacturer} • Modèle: {eq.model}
                </p>

                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 text-xs mb-4">
                  <div>
                    <span className="text-slate-500 block">Heures service :</span>
                    <strong className="text-white font-mono">{eq.operatingHours || 0} h</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Coût cumulé :</span>
                    <strong className="text-cyan-400 font-mono">
                      {(eq.totalMaintenanceCost || 0).toLocaleString('fr-FR')} F
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Localisation :</span>
                    <span className="text-slate-300 truncate block">{eq.location || eq.siteName || 'Base'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Prochaine révision :</span>
                    <span className="text-amber-400 font-mono">{eq.nextScheduledMaintenance || 'À planifier'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-400">
                  {eq.interventionsCount || 0} interventions enregistrées
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOrderEquipmentId(eq.id);
                    setNewOrderOpen(true);
                  }}
                  className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold transition-colors"
                >
                  Lancer une OT
                </button>
              </div>
            </div>
          ))}
          {filteredEquipment.length === 0 && (
            <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              Aucun équipement enregistré dans le parc GMAO.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Ordres de Travail */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">N° OT</th>
                  <th className="p-4">Équipement concerné</th>
                  <th className="p-4">Type & Priorité</th>
                  <th className="p-4">Dysfonctionnement / Motif</th>
                  <th className="p-4">Technicien assigné</th>
                  <th className="p-4">Coût Total</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setViewWorkOrder(wo)}>
                    <td className="p-4 font-mono font-bold text-cyan-400">{wo.reference}</td>
                    <td className="p-4 font-semibold text-white">{wo.equipmentName}</td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 uppercase font-mono mr-1.5">
                        {wo.type}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          wo.priority === 'urgente'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {wo.priority}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-300">{wo.failureDescription}</td>
                    <td className="p-4 text-slate-300">{wo.assignedTechnicianName}</td>
                    <td className="p-4 font-bold text-white whitespace-nowrap">
                      {wo.totalCost.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                          wo.status === 'cloture'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {wo.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {wo.status !== 'cloture' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setClosingOrderId(wo.id);
                          }}
                          className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                        >
                          Clôturer OT
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Aucun ordre de travail enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Alertes GMAO */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.map((alt) => (
            <div
              key={alt.id}
              className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${
                alt.severity === 'critical'
                  ? 'bg-rose-950/20 border-rose-900/60 text-rose-200'
                  : 'bg-amber-950/20 border-amber-900/60 text-amber-200'
              }`}
            >
              <div
                className={`p-2 rounded-xl mt-0.5 ${
                  alt.severity === 'critical'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-white text-sm">{alt.title}</h4>
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700">
                    {alt.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{alt.message}</p>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              Toutes les machines sont opérationnelles et à jour de maintenance.
            </div>
          )}
        </div>
      )}

      {/* Modal: Nouvel Équipement */}
      {newEquipmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Ajouter un Équipement au Parc GMAO</h2>
            <form onSubmit={handleCreateEquipment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Désignation de la Machine</label>
                <input
                  type="text"
                  placeholder="Ex: Poste de Soudage SAF-FRO Presto 250..."
                  value={eqName}
                  onChange={(e) => setEqName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Catégorie</label>
                  <select
                    value={eqCategory}
                    onChange={(e) => setEqCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="soudage">Soudage TIG/MIG/ARC</option>
                    <option value="compresseur">Compresseur & Sablage</option>
                    <option value="levage">Levage & Grues</option>
                    <option value="generateur">Groupe Électrogène</option>
                    <option value="vehicule">Véhicule & Fourgon</option>
                    <option value="autre">Autre Machine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">N° Série / Immatriculation</label>
                  <input
                    type="text"
                    placeholder="SN-SAF-2024-..."
                    value={eqSerial}
                    onChange={(e) => setEqSerial(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Fabricant</label>
                  <input
                    type="text"
                    placeholder="Ex: SAF-FRO, Atlas Copco..."
                    value={eqManufacturer}
                    onChange={(e) => setEqManufacturer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Modèle</label>
                  <input
                    type="text"
                    placeholder="Ex: Presto 250 Force"
                    value={eqModel}
                    onChange={(e) => setEqModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Emplacement / Base</label>
                <input
                  type="text"
                  value={eqLocation}
                  onChange={(e) => setEqLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewEquipmentOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nouvel Ordre de Travail */}
      {newOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Émettre un Ordre de Travail (OT)</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Équipement cible</label>
                <select
                  value={orderEquipmentId}
                  onChange={(e) => setOrderEquipmentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                >
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.reference} — {eq.name} ({eq.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Type d'Intervention</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="corrective">Corrective (Panne)</option>
                    <option value="preventive">Préventive (Périodique)</option>
                    <option value="amelioration">Amélioration / Rénovation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Priorité</label>
                  <select
                    value={orderPriority}
                    onChange={(e) => setOrderPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="normale">Normale</option>
                    <option value="haute">Haute</option>
                    <option value="urgente">Urgente (Arrêt Chantier)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description de la Panne ou Intervention</label>
                <textarea
                  rows={3}
                  placeholder="Symptômes constatés, voyants allumés, contrôle requis..."
                  value={orderFailureDesc}
                  onChange={(e) => setOrderFailureDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Technicien Assigné</label>
                <input
                  type="text"
                  value={orderTechName}
                  onChange={(e) => setOrderTechName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewOrderOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm"
                >
                  Émettre l'Ordre de Travail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Clôture d'Intervention */}
      {closingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Clôturer l'Ordre de Travail</h2>
            <p className="text-xs text-slate-400 mb-4">
              Confirmation de la fin des travaux de réparation et remise en service de la machine.
            </p>
            <form onSubmit={handleCloseOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Rapport technique de clôture</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Remplacement des pièces effectué, test d'effort concluant, équipement opérationnel."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setClosingOrderId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm"
                >
                  Clôturer et Libérer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DetailSidebar: Equipment Detail */}
      <DetailSidebar
        isOpen={!!viewEquipment}
        onClose={() => setViewEquipment(null)}
        title={viewEquipment?.name || ''}
        subtitle={viewEquipment ? `${viewEquipment.manufacturer} • ${viewEquipment.model}` : ''}
        referenceCode={viewEquipment?.reference}
        badge={viewEquipment ? {
          text: viewEquipment.status.replace(/_/g, ' '),
          color: viewEquipment.status === 'operationnel' ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
            : viewEquipment.status === 'en_maintenance' ? 'bg-amber-900/40 text-amber-300 border-amber-700'
            : 'bg-red-900/40 text-red-300 border-red-700',
        } : undefined}
        actions={viewEquipment ? [{
          label: 'Lancer une OT',
          icon: <Wrench className="w-3.5 h-3.5" />,
          onClick: () => { setOrderEquipmentId(viewEquipment.id); setNewOrderOpen(true); setViewEquipment(null); },
          variant: 'primary' as const,
        }] : []}
      >
        {viewEquipment && (
          <>
            <SidebarSection title="Fiche Équipement" icon={<Settings className="w-3.5 h-3.5" />}>
              <SidebarField label="Nom" value={viewEquipment.name} highlight />
              <SidebarField label="Catégorie" value={viewEquipment.category.replace(/_/g, ' ')} />
              <SidebarField label="Fabricant" value={viewEquipment.manufacturer} />
              <SidebarField label="Modèle" value={viewEquipment.model} />
              <SidebarField label="N° Série" value={viewEquipment.serialNumber} mono />
              <SidebarField label="Localisation" value={viewEquipment.location || viewEquipment.siteName || 'Base'} />
            </SidebarSection>
            <SidebarDivider />
            <SidebarSection title="Données Opérationnelles" icon={<Activity className="w-3.5 h-3.5" />}>
              <SidebarField label="Heures de service" value={`${viewEquipment.operatingHours || 0} h`} mono highlight />
              <SidebarField label="Coût maintenance cumulé" value={`${(viewEquipment.totalMaintenanceCost || 0).toLocaleString('fr-FR')} FCFA`} mono />
              <SidebarField label="Interventions" value={viewEquipment.interventionsCount || 0} mono />
              <SidebarField label="Prochaine révision" value={viewEquipment.nextScheduledMaintenance || 'À planifier'} />
              <SidebarField label="Date mise en service" value={viewEquipment.commissioningDate || '—'} />
            </SidebarSection>
          </>
        )}
      </DetailSidebar>

      {/* DetailSidebar: Work Order Detail */}
      <DetailSidebar
        isOpen={!!viewWorkOrder}
        onClose={() => setViewWorkOrder(null)}
        title={viewWorkOrder ? `OT : ${viewWorkOrder.equipmentName}` : ''}
        subtitle={viewWorkOrder ? `${viewWorkOrder.type.toUpperCase()} — Priorité ${viewWorkOrder.priority}` : ''}
        referenceCode={viewWorkOrder?.reference}
        badge={viewWorkOrder ? {
          text: viewWorkOrder.status.replace(/_/g, ' '),
          color: viewWorkOrder.status === 'cloture' ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
            : 'bg-amber-900/40 text-amber-300 border-amber-700',
        } : undefined}
        actions={viewWorkOrder && viewWorkOrder.status !== 'cloture' ? [{
          label: 'Clôturer OT',
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          onClick: () => { setClosingOrderId(viewWorkOrder.id); setViewWorkOrder(null); },
          variant: 'success' as const,
        }] : []}
      >
        {viewWorkOrder && (
          <>
            <SidebarSection title="Description de la panne" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
              <p className="text-xs bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {viewWorkOrder.failureDescription}
              </p>
            </SidebarSection>
            <SidebarDivider />
            <SidebarSection title="Informations OT" icon={<Wrench className="w-3.5 h-3.5" />}>
              <SidebarField label="Équipement" value={viewWorkOrder.equipmentName} highlight />
              <SidebarField label="Type" value={viewWorkOrder.type.toUpperCase()} />
              <SidebarField label="Priorité" value={viewWorkOrder.priority.toUpperCase()} highlight />
              <SidebarField label="Technicien assigné" value={viewWorkOrder.assignedTechnicianName} />
              <SidebarField label="Coût total" value={`${viewWorkOrder.totalCost.toLocaleString('fr-FR')} FCFA`} mono highlight />
              <SidebarField label="Date ouverture" value={viewWorkOrder.openedAt?.split('T')[0] || '—'} />
              {viewWorkOrder.closedAt && <SidebarField label="Date clôture" value={viewWorkOrder.closedAt.split('T')[0]} />}
            </SidebarSection>
            {viewWorkOrder.diagnostic && (
              <>
                <SidebarDivider />
                <SidebarSection title="Diagnostic">
                  <p className="text-xs bg-cyan-50 dark:bg-cyan-950/20 p-3 rounded-xl border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300">
                    {viewWorkOrder.diagnostic}
                  </p>
                </SidebarSection>
              </>
            )}
          </>
        )}
      </DetailSidebar>
    </div>
  );
};
