import {
  PurchaseRequest,
  PurchaseOrder,
  GoodsReceipt,
  PurchaseRequestItem,
  SupplierOfferComparison,
} from '../types/advancedModules';
import { DataService } from './dataService';
import { AdminConfigService } from './adminConfigService';

export class PurchaseService {
  /**
   * Create a new Purchase Request (Demande d'Achat - DA)
   */
  public static async createPurchaseRequest(
    data: Omit<PurchaseRequest, 'id' | 'reference' | 'createdAt' | 'updatedAt' | 'status'> & { status?: PurchaseRequest['status'] }
  ): Promise<PurchaseRequest> {
    const reference = AdminConfigService.getNextSequenceNumber('da');
    const id = `da-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const pr: PurchaseRequest = {
      ...data,
      id,
      reference,
      status: data.status || 'submitted',
      createdAt: now,
      updatedAt: now,
    };

    await DataService.savePurchaseRequest(pr);
    return pr;
  }

  /**
   * Evaluates if a purchase request requires higher validation (DG / RAF) based on threshold
   */
  public static evaluateApprovalLevel(amount: number): {
    requiredRole: string;
    roleTitle: string;
    isOverDgThreshold: boolean;
  } {
    const workflows = AdminConfigService.getWorkflows();
    const purchaseWf = workflows.find((w) => w.type === 'purchases');

    if (!purchaseWf || !purchaseWf.levels || purchaseWf.levels.length === 0) {
      return { requiredRole: 'dg', roleTitle: 'Direction Générale (DG)', isOverDgThreshold: amount > 500000 };
    }

    const matchedLevel = purchaseWf.levels.find(
      (lvl) => amount >= lvl.thresholdMin && amount < lvl.thresholdMax
    ) || purchaseWf.levels[purchaseWf.levels.length - 1];

    return {
      requiredRole: matchedLevel.validatorRole,
      roleTitle: matchedLevel.validatorRoleTitle,
      isOverDgThreshold: matchedLevel.validatorRole === 'dg',
    };
  }

  /**
   * Approve a Purchase Request
   */
  public static async approvePurchaseRequest(
    requestId: string,
    approverName: string,
    approverRole: string
  ): Promise<{ success: boolean; message: string }> {
    const requests = DataService.getPurchaseRequests();
    const pr = requests.find((r) => r.id === requestId);
    if (!pr) return { success: false, message: 'Demande d\'achat introuvable' };

    const evaluation = this.evaluateApprovalLevel(pr.estimatedAmount);

    // If approver role is insufficient
    if (evaluation.requiredRole === 'dg' && approverRole !== 'dg' && approverRole !== 'admin') {
      return {
        success: false,
        message: `Montant supérieur au seuil (${pr.estimatedAmount.toLocaleString('fr-FR')} FCFA). Visa de la ${evaluation.roleTitle} requis.`,
      };
    }

    pr.status = 'approved';
    pr.approvedBy = `${approverName} (${approverRole.toUpperCase()})`;
    pr.approvedAt = new Date().toISOString();
    pr.updatedAt = new Date().toISOString();

    await DataService.savePurchaseRequest(pr);
    return { success: true, message: `Demande d'achat ${pr.reference} approuvée avec succès.` };
  }

  /**
   * Reject a Purchase Request
   */
  public static async rejectPurchaseRequest(
    requestId: string,
    reason: string,
    rejecterName: string
  ): Promise<void> {
    const requests = DataService.getPurchaseRequests();
    const pr = requests.find((r) => r.id === requestId);
    if (!pr) return;

    pr.status = 'rejected';
    pr.rejectionReason = reason;
    pr.updatedAt = new Date().toISOString();

    await DataService.savePurchaseRequest(pr);
  }

  /**
   * Save Supplier Comparison Analysis (Règle de mise en concurrence)
   */
  public static async saveOfferComparison(
    requestId: string,
    comparison: SupplierOfferComparison
  ): Promise<void> {
    const requests = DataService.getPurchaseRequests();
    const pr = requests.find((r) => r.id === requestId);
    if (!pr) return;

    pr.supplierComparison = comparison;
    pr.updatedAt = new Date().toISOString();

    await DataService.savePurchaseRequest(pr);
  }

  /**
   * Generate an official Purchase Order (Bon de Commande - BC) from an approved DA
   */
  public static async createPurchaseOrder(params: {
    requestId?: string;
    supplierId: string;
    supplierName: string;
    projectId?: string;
    projectName?: string;
    siteId?: string;
    siteName?: string;
    items: PurchaseRequestItem[];
    taxRate?: number;
    paymentTerms: string;
    expectedDeliveryDate?: string;
  }): Promise<PurchaseOrder> {
    const reference = AdminConfigService.getNextSequenceNumber('bc');
    const id = `bc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const subtotal = params.items.reduce((sum, item) => sum + (item.estimatedTotalPrice || 0), 0);
    const taxRate = params.taxRate !== undefined ? params.taxRate : 0.1925; // 19.25% TVA standard CEMAC
    const taxAmount = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + taxAmount;

    const currentUser = DataService.getCurrentUser();

    const po: PurchaseOrder = {
      id,
      reference,
      requestId: params.requestId,
      supplierId: params.supplierId,
      supplierName: params.supplierName,
      projectId: params.projectId,
      projectName: params.projectName,
      siteId: params.siteId,
      siteName: params.siteName,
      items: params.items,
      subtotalAmount: subtotal,
      taxAmount,
      totalAmount,
      currency: 'FCFA',
      paymentTerms: params.paymentTerms,
      expectedDeliveryDate: params.expectedDeliveryDate,
      status: 'valide',
      approvedBy: `${currentUser.displayName} (${currentUser.role.toUpperCase()})`,
      approvedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await DataService.savePurchaseOrder(po);

    // If linked to a DA, update DA status to ordered
    if (params.requestId) {
      const requests = DataService.getPurchaseRequests();
      const pr = requests.find((r) => r.id === params.requestId);
      if (pr) {
        pr.status = 'ordered';
        pr.updatedAt = now;
        await DataService.savePurchaseRequest(pr);
      }
    }

    return po;
  }

  /**
   * Process and record a Goods Receipt (Bon de Réception - REC) with automatic stock increment
   */
  public static async createGoodsReceipt(
    data: Omit<GoodsReceipt, 'id' | 'reference' | 'createdAt' | 'status' | 'stockUpdated'> & {
      status?: GoodsReceipt['status'];
    }
  ): Promise<GoodsReceipt> {
    const reference = AdminConfigService.getNextSequenceNumber('rec');
    const id = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const gr: GoodsReceipt = {
      ...data,
      id,
      reference,
      status: data.status || 'conforme',
      stockUpdated: false, // will be handled atomically in DataService.saveGoodsReceipt
      createdAt: now,
    };

    await DataService.saveGoodsReceipt(gr);

    // Update corresponding Purchase Order status if all lines complete
    const orders = DataService.getPurchaseOrders();
    const order = orders.find((o) => o.id === gr.orderId);
    if (order) {
      order.status = gr.isComplete ? 'receptionne_complet' : 'receptionne_partiel';
      order.updatedAt = now;
      await DataService.savePurchaseOrder(order);
    }

    return gr;
  }
}
