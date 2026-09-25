import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle,
  XCircle,
  FileText,
  Truck,
  ArrowRight,
  Building2,
  DollarSign,
  AlertTriangle,
  Search,
  Package,
  ClipboardList,
  Download,
} from 'lucide-react';
import {
  PurchaseRequest,
  PurchaseOrder,
  GoodsReceipt,
  PurchaseRequestItem,
} from '../../types/advancedModules';
import { PurchaseService } from '../../services/purchaseService';
import { DataService } from '../../services/dataService';
import { Supplier, Project } from '../../types';
import { DetailSidebar, SidebarSection, SidebarField, SidebarDivider } from '../shared/DetailSidebar';

interface PurchasesModuleProps {
  requests: PurchaseRequest[];
  orders: PurchaseOrder[];
  receipts: GoodsReceipt[];
  suppliers: Supplier[];
  projects: Project[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const PurchasesModule: React.FC<PurchasesModuleProps> = ({
  requests,
  orders,
  receipts,
  suppliers,
  projects,
  onRefresh,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'orders' | 'receipts'>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [newReceiptOpen, setNewReceiptOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [viewRequest, setViewRequest] = useState<PurchaseRequest | null>(null);
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);

  // New Request Form State
  const [reqProjectId, setReqProjectId] = useState(projects[0]?.id || '');
  const [reqReason, setReqReason] = useState('');
  const [reqPriority, setReqPriority] = useState<PurchaseRequest['priority']>('normale');
  const [reqItems, setReqItems] = useState<Array<{ description: string; quantity: number; unit: string; price: number }>>([
    { description: '', quantity: 1, unit: 'unités', price: 0 },
  ]);

  // New Order Form State
  const [orderSupplierId, setOrderSupplierId] = useState(suppliers[0]?.id || '');
  const [orderTerms, setOrderTerms] = useState('Virement bancaire sous 30 jours fin de mois');
  const [orderDeliveryDate, setOrderDeliveryDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);

  // New Receipt Form State
  const [recOrderId, setRecOrderId] = useState(orders[0]?.id || '');
  const [recDeliveryNote, setRecDeliveryNote] = useState('');
  const [recObservations, setRecObservations] = useState('');

  const currentUser = DataService.getCurrentUser();

  const handleAddReqItem = () => {
    setReqItems([...reqItems, { description: '', quantity: 1, unit: 'unités', price: 0 }]);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqReason.trim() || reqItems.some((i) => !i.description.trim())) {
      showToast('Veuillez remplir le motif et les désignations de tous les articles.');
      return;
    }

    const items: PurchaseRequestItem[] = reqItems.map((item, idx) => ({
      id: `it-${Date.now()}-${idx}`,
      description: item.description,
      category: 'fournitures',
      quantity: Number(item.quantity) || 1,
      unit: item.unit,
      estimatedUnitPrice: Number(item.price) || 0,
      estimatedTotalPrice: (Number(item.quantity) || 1) * (Number(item.price) || 0),
    }));

    const totalAmount = items.reduce((sum, i) => sum + i.estimatedTotalPrice, 0);
    const proj = projects.find((p) => p.id === reqProjectId);

    await PurchaseService.createPurchaseRequest({
      requesterId: currentUser.uid,
      requesterName: currentUser.displayName,
      departmentId: currentUser.department || 'operations',
      projectId: reqProjectId || undefined,
      projectName: proj?.name || 'Base Industrielle',
      items,
      reason: reqReason,
      estimatedAmount: totalAmount,
      currency: 'FCFA',
      priority: reqPriority,
    });

    setNewRequestOpen(false);
    setReqReason('');
    setReqItems([{ description: '', quantity: 1, unit: 'unités', price: 0 }]);
    onRefresh();
    showToast('Demande d\'achat soumise dans le circuit de validation.');
  };

  const handleApproveRequest = async (req: PurchaseRequest) => {
    const res = await PurchaseService.approvePurchaseRequest(req.id, currentUser.displayName, currentUser.role);
    showToast(res.message);
    if (res.success) {
      onRefresh();
    }
  };

  const handleCreateOrderFromRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    const sup = suppliers.find((s) => s.id === orderSupplierId);
    if (!sup) return;

    await PurchaseService.createPurchaseOrder({
      requestId: selectedRequest.id,
      supplierId: sup.id,
      supplierName: sup.name,
      projectId: selectedRequest.projectId,
      projectName: selectedRequest.projectName,
      siteId: selectedRequest.siteId,
      siteName: selectedRequest.siteName,
      items: selectedRequest.items,
      paymentTerms: orderTerms,
      expectedDeliveryDate: orderDeliveryDate,
    });

    setNewOrderOpen(false);
    setSelectedRequest(null);
    onRefresh();
    showToast('Bon de commande fournisseur émis avec succès.');
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find((o) => o.id === recOrderId);
    if (!order) return;

    await PurchaseService.createGoodsReceipt({
      orderId: order.id,
      orderReference: order.reference,
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      projectId: order.projectId,
      projectName: order.projectName,
      receptionDate: new Date().toISOString(),
      receivedBy: currentUser.displayName,
      items: order.items.map((i) => ({
        description: i.description,
        orderedQuantity: i.quantity,
        receivedQuantity: i.quantity,
        damagedQuantity: 0,
        missingQuantity: 0,
        isStockable: true,
      })),
      deliveryNoteNumber: recDeliveryNote,
      observations: recObservations,
      isComplete: true,
    });

    setNewReceiptOpen(false);
    setRecDeliveryNote('');
    setRecObservations('');
    onRefresh();
    showToast('Réception conforme enregistrée et stock mis à jour.');
  };

  const filteredRequests = requests.filter(
    (r) =>
      r.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requesterName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(
    (o) =>
      o.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReceipts = receipts.filter(
    (g) =>
      g.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.orderReference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Achats & Commandes Fournisseurs</h1>
            <p className="text-sm text-slate-400">
              Circuit DA, validation hiérarchique, bons de commande et entrées en stock
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'requests' && (
            <button
              onClick={() => setNewRequestOpen(true)}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-sm transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" /> Nouvelle Demande (DA)
            </button>
          )}
          {activeTab === 'receipts' && (
            <button
              onClick={() => setNewReceiptOpen(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 text-sm transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> Réceptionner Marchandises
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'requests'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Demandes d'Achat ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bons de Commande ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'receipts'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bons de Réception ({receipts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tab 1: Demandes d'Achat */}
      {activeTab === 'requests' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Référence</th>
                  <th className="p-4">Demandeur & Chantier</th>
                  <th className="p-4">Motif d'achat</th>
                  <th className="p-4">Montant Estimé</th>
                  <th className="p-4">Seuil & Circuit</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRequests.map((req) => {
                  const evalLevel = PurchaseService.evaluateApprovalLevel(req.estimatedAmount);
                  return (
                    <tr key={req.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setViewRequest(req)}>
                      <td className="p-4 font-mono font-bold text-cyan-400">{req.reference}</td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{req.requesterName}</div>
                        <div className="text-xs text-slate-400">{req.projectName || 'Base'}</div>
                      </td>
                      <td className="p-4 max-w-xs truncate text-slate-300">{req.reason}</td>
                      <td className="p-4 font-bold text-white whitespace-nowrap">
                        {req.estimatedAmount.toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="p-4">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                          Visa requis: <strong className="text-cyan-300">{evalLevel.roleTitle}</strong>
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                            req.status === 'approved'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : req.status === 'ordered'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : req.status === 'rejected'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        {req.status === 'submitted' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApproveRequest(req); }}
                            className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors"
                          >
                            Approuver
                          </button>
                        )}
                        {req.status === 'approved' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(req);
                              setNewOrderOpen(true);
                            }}
                            className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-bold transition-colors"
                          >
                            Générer Bon de Commande
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Aucune demande d'achat trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Bons de Commande */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">N° Bon Commande</th>
                  <th className="p-4">Fournisseur Référencé</th>
                  <th className="p-4">Chantier / Projet</th>
                  <th className="p-4">Montant Total TTC</th>
                  <th className="p-4">Délai Livraison</th>
                  <th className="p-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setViewOrder(order)}>
                    <td className="p-4 font-mono font-bold text-cyan-400">{order.reference}</td>
                    <td className="p-4">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {order.supplierName}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{order.projectName || 'Base'}</td>
                    <td className="p-4 font-bold text-white whitespace-nowrap">
                      {order.totalAmount.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-4 text-xs text-slate-400">{order.expectedDeliveryDate || 'Non spécifié'}</td>
                    <td className="p-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase bg-blue-950 text-blue-400 border border-blue-800">
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Aucun bon de commande émis.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Bons de Réception */}
      {activeTab === 'receipts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">N° Réception</th>
                  <th className="p-4">Bon Commande Lié</th>
                  <th className="p-4">Fournisseur & BL</th>
                  <th className="p-4">Réceptionnaire</th>
                  <th className="p-4">Date Réception</th>
                  <th className="p-4">Impact Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredReceipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-emerald-400">{rec.reference}</td>
                    <td className="p-4 font-mono text-cyan-400">{rec.orderReference}</td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{rec.supplierName}</div>
                      <div className="text-xs text-slate-400">BL: {rec.deliveryNoteNumber || 'N/A'}</div>
                    </td>
                    <td className="p-4 text-slate-300">{rec.receivedBy}</td>
                    <td className="p-4 text-xs text-slate-400">{rec.receptionDate.split('T')[0]}</td>
                    <td className="p-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3.5 h-3.5" /> Stock Mis à Jour
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Aucune réception enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Nouvelle Demande d'Achat */}
      {newRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Émettre une Demande d'Achat (DA)</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Chantier / Projet concerné</label>
                <select
                  value={reqProjectId}
                  onChange={(e) => setReqProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                >
                  <option value="">Base Principale (Stock Central)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Motif / Justification de l'achat</label>
                <textarea
                  rows={2}
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="Ex: Raccordement tuyauterie HP, approvisionnement électrodes..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Priorité</label>
                <select
                  value={reqPriority}
                  onChange={(e) => setReqPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                >
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente (Arrêt Chantier)</option>
                </select>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Articles ou fournitures demandés</label>
                  <button
                    type="button"
                    onClick={handleAddReqItem}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    + Ajouter une ligne
                  </button>
                </div>
                {reqItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      placeholder="Désignation article"
                      value={item.description}
                      onChange={(e) => {
                        const copy = [...reqItems];
                        copy[idx].description = e.target.value;
                        setReqItems(copy);
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Qté"
                      value={item.quantity}
                      onChange={(e) => {
                        const copy = [...reqItems];
                        copy[idx].quantity = Number(e.target.value);
                        setReqItems(copy);
                      }}
                      className="w-20 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Unité"
                      value={item.unit}
                      onChange={(e) => {
                        const copy = [...reqItems];
                        copy[idx].unit = e.target.value;
                        setReqItems(copy);
                      }}
                      className="w-20 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Prix unit. FCFA"
                      value={item.price}
                      onChange={(e) => {
                        const copy = [...reqItems];
                        copy[idx].price = Number(e.target.value);
                        setReqItems(copy);
                      }}
                      className="w-28 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewRequestOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm"
                >
                  Soumettre pour Validation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Générer Bon de Commande depuis DA */}
      {newOrderOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Émettre Bon de Commande Fournisseur</h2>
            <p className="text-xs text-slate-400 mb-4">
              Génération du bon officiel pour la demande <strong>{selectedRequest.reference}</strong> ({selectedRequest.estimatedAmount.toLocaleString('fr-FR')} FCFA).
            </p>
            <form onSubmit={handleCreateOrderFromRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Fournisseur retenu</label>
                <select
                  value={orderSupplierId}
                  onChange={(e) => setOrderSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Conditions de règlement</label>
                <input
                  type="text"
                  value={orderTerms}
                  onChange={(e) => setOrderTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Date prévisionnelle de livraison</label>
                <input
                  type="date"
                  value={orderDeliveryDate}
                  onChange={(e) => setOrderDeliveryDate(e.target.value)}
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
                  Générer et Transmettre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Réception Marchandises */}
      {newReceiptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Enregistrer une Réception Fournisseur</h2>
            <p className="text-xs text-slate-400 mb-4">
              Contrôle physique des marchandises et mise à jour automatique des quantités en stock.
            </p>
            <form onSubmit={handleCreateReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Bon de commande concerné</label>
                <select
                  value={recOrderId}
                  onChange={(e) => setRecOrderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.reference} — {o.supplierName} ({o.totalAmount.toLocaleString('fr-FR')} FCFA)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">N° Bon de Livraison (BL) Fournisseur</label>
                <input
                  type="text"
                  placeholder="Ex: BL-VAL-2026-4401"
                  value={recDeliveryNote}
                  onChange={(e) => setRecDeliveryNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Observations / Contrôle qualité</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Colisage intact, certificats matière 3.1 vérifiés, conformité totale."
                  value={recObservations}
                  onChange={(e) => setRecObservations(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewReceiptOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm"
                >
                  Valider et Entrer en Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DetailSidebar: Purchase Request (DA) Detail */}
      <DetailSidebar
        isOpen={!!viewRequest}
        onClose={() => setViewRequest(null)}
        title={viewRequest ? `Demande d'Achat` : ''}
        subtitle={viewRequest ? `${viewRequest.requesterName} — ${viewRequest.projectName || 'Base'}` : ''}
        referenceCode={viewRequest?.reference}
        badge={
          viewRequest
            ? {
                text: viewRequest.status,
                color:
                  viewRequest.status === 'approved'
                    ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
                    : viewRequest.status === 'rejected'
                    ? 'bg-red-900/40 text-red-300 border-red-700'
                    : viewRequest.status === 'ordered'
                    ? 'bg-blue-900/40 text-blue-300 border-blue-700'
                    : 'bg-amber-900/40 text-amber-300 border-amber-700',
              }
            : undefined
        }
        actions={
          viewRequest
            ? [
                ...(viewRequest.status === 'submitted'
                  ? [{
                      label: 'Approuver cette DA',
                      icon: <CheckCircle className="w-3.5 h-3.5" />,
                      onClick: () => { handleApproveRequest(viewRequest); setViewRequest(null); },
                      variant: 'success' as const,
                    }]
                  : []),
                ...(viewRequest.status === 'approved'
                  ? [{
                      label: 'Générer Bon de Commande',
                      icon: <FileText className="w-3.5 h-3.5" />,
                      onClick: () => { setSelectedRequest(viewRequest); setNewOrderOpen(true); setViewRequest(null); },
                      variant: 'primary' as const,
                    }]
                  : []),
              ]
            : []
        }
      >
        {viewRequest && (
          <>
            <SidebarSection title="Informations Générales" icon={<ClipboardList className="w-3.5 h-3.5" />}>
              <SidebarField label="Demandeur" value={viewRequest.requesterName} highlight />
              <SidebarField label="Chantier / Projet" value={viewRequest.projectName || 'Base Industrielle'} />
              <SidebarField label="Priorité" value={viewRequest.priority.toUpperCase()} highlight />
              <SidebarField label="Motif d'achat" value={viewRequest.reason} />
              <SidebarField label="Montant estimé" value={`${viewRequest.estimatedAmount.toLocaleString('fr-FR')} FCFA`} mono highlight />
              <SidebarField label="Devise" value={viewRequest.currency || 'FCFA'} mono />
              <SidebarField label="Date de création" value={viewRequest.createdAt?.split('T')[0] || '—'} />
            </SidebarSection>

            <SidebarDivider />

            <SidebarSection title={`Articles Demandés (${viewRequest.items?.length || 0})`} icon={<Package className="w-3.5 h-3.5" />}>
              {viewRequest.items?.map((item, idx) => (
                <div key={item.id || idx} className="p-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-white">{item.description}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.quantity} {item.unit || 'unités'} × {(item.estimatedUnitPrice || 0).toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                    <span className="font-mono font-bold text-slate-800 dark:text-white shrink-0 ml-3">
                      {(item.estimatedTotalPrice || 0).toLocaleString('fr-FR')} F
                    </span>
                  </div>
                </div>
              ))}
            </SidebarSection>

            {/* Approval History */}
            {viewRequest.approvalHistory && viewRequest.approvalHistory.length > 0 && (
              <>
                <SidebarDivider />
                <SidebarSection title="Historique d'Approbation" icon={<CheckCircle className="w-3.5 h-3.5" />}>
                  {viewRequest.approvalHistory.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs py-1.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        h.action === 'approved' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
                      }`}>
                        {h.action === 'approved' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      </div>
                      <div>
                        <p className="text-slate-800 dark:text-white font-medium">{h.approverName} <span className="text-slate-400 font-normal">({h.approverRole})</span></p>
                        <p className="text-slate-500 dark:text-slate-400">{h.timestamp?.split('T')[0] || ''}</p>
                      </div>
                    </div>
                  ))}
                </SidebarSection>
              </>
            )}
          </>
        )}
      </DetailSidebar>

      {/* DetailSidebar: Purchase Order (BC) Detail */}
      <DetailSidebar
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
        title={viewOrder ? `Bon de Commande Fournisseur` : ''}
        subtitle={viewOrder ? viewOrder.supplierName : ''}
        referenceCode={viewOrder?.reference}
        badge={
          viewOrder
            ? {
                text: viewOrder.status.replace(/_/g, ' '),
                color: 'bg-blue-900/40 text-blue-300 border-blue-700',
              }
            : undefined
        }
      >
        {viewOrder && (
          <>
            <SidebarSection title="Informations Commande" icon={<Truck className="w-3.5 h-3.5" />}>
              <SidebarField label="Fournisseur" value={viewOrder.supplierName} highlight />
              <SidebarField label="Chantier / Projet" value={viewOrder.projectName || 'Base'} />
              <SidebarField label="Montant Total" value={`${viewOrder.totalAmount.toLocaleString('fr-FR')} FCFA`} mono highlight />
              <SidebarField label="Conditions de paiement" value={viewOrder.paymentTerms || '—'} />
              <SidebarField label="Livraison prévue" value={viewOrder.expectedDeliveryDate || 'Non spécifié'} />
              <SidebarField label="Date d'émission" value={viewOrder.createdAt?.split('T')[0] || '—'} />
            </SidebarSection>

            <SidebarDivider />

            <SidebarSection title={`Articles Commandés (${viewOrder.items?.length || 0})`} icon={<Package className="w-3.5 h-3.5" />}>
              {viewOrder.items?.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-white">{item.description}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.quantity} {item.unit || 'unités'}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-slate-800 dark:text-white shrink-0 ml-3">
                      {(item.estimatedTotalPrice || item.quantity * (item.estimatedUnitPrice || 0)).toLocaleString('fr-FR')} F
                    </span>
                  </div>
                </div>
              ))}
            </SidebarSection>
          </>
        )}
      </DetailSidebar>
    </div>
  );
};
