import {
  Equipment,
  MaintenancePlan,
  MaintenanceWorkOrder,
  WorkOrderPart,
} from '../types/advancedModules';
import { DataService } from './dataService';
import { AdminConfigService } from './adminConfigService';

export interface MaintenanceAlert {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: 'overdue' | 'upcoming' | 'warranty_expiring' | 'breakdown';
  severity: 'high' | 'medium' | 'critical';
  title: string;
  message: string;
  dueDate?: string;
}

export class GmaoService {
  /**
   * Register a new industrial equipment
   */
  public static async createEquipment(
    data: Omit<Equipment, 'id' | 'reference' | 'createdAt' | 'updatedAt' | 'operatingHours' | 'totalMaintenanceCost' | 'interventionsCount'> & {
      operatingHours?: number;
    }
  ): Promise<Equipment> {
    const id = `eq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const reference = AdminConfigService.getNextSequenceNumber('eq') || `EQ-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const eq: Equipment = {
      ...data,
      id,
      reference,
      operatingHours: data.operatingHours || 0,
      totalMaintenanceCost: 0,
      interventionsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await DataService.saveEquipment(eq);
    return eq;
  }

  /**
   * Create an Order of Work (Ordre de Travail - OT)
   */
  public static async createWorkOrder(
    data: Omit<MaintenanceWorkOrder, 'id' | 'reference' | 'openedAt' | 'status' | 'totalCost'> & {
      status?: MaintenanceWorkOrder['status'];
    }
  ): Promise<MaintenanceWorkOrder> {
    const reference = AdminConfigService.getNextSequenceNumber('ot');
    const id = `ot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const partsCost = (data.partsUsed || []).reduce((sum, p) => sum + (p.totalCost || 0), 0);
    const laborCost = (data.laborHours || 0) * (data.laborRatePerHour || 15000);
    const totalCost = partsCost + laborCost;

    const wo: MaintenanceWorkOrder = {
      ...data,
      id,
      reference,
      totalCost,
      status: data.status || 'ouvert',
      openedAt: now,
    };

    await DataService.saveWorkOrder(wo);

    // If equipment exists, update status to 'en_maintenance' if corrective
    if (wo.type === 'corrective') {
      const equip = DataService.getEquipment().find((e) => e.id === wo.equipmentId);
      if (equip && equip.status !== 'hors_service') {
        equip.status = 'en_maintenance';
        equip.interventionsCount = (equip.interventionsCount || 0) + 1;
        equip.updatedAt = now;
        await DataService.saveEquipment(equip);
      }
    }

    return wo;
  }

  /**
   * Close a Work Order with final notes and update machine status to 'operationnel'
   */
  public static async closeWorkOrder(
    workOrderId: string,
    notes: string,
    additionalLaborHours?: number
  ): Promise<void> {
    const orders = DataService.getWorkOrders();
    const wo = orders.find((w) => w.id === workOrderId);
    if (!wo) return;

    if (additionalLaborHours) {
      wo.laborHours = (wo.laborHours || 0) + additionalLaborHours;
      const partsCost = (wo.partsUsed || []).reduce((sum, p) => sum + (p.totalCost || 0), 0);
      wo.totalCost = partsCost + (wo.laborHours * (wo.laborRatePerHour || 15000));
    }

    wo.status = 'cloture';
    wo.closedAt = new Date().toISOString();
    wo.reportNotes = notes;

    await DataService.saveWorkOrder(wo);
  }

  /**
   * Computes proactive GMAO alerts for all equipment
   */
  public static getAlerts(): MaintenanceAlert[] {
    const alerts: MaintenanceAlert[] = [];
    const equipment = DataService.getEquipment();
    const today = new Date();

    equipment.forEach((eq) => {
      // 1. Breakdown alert
      if (eq.status === 'hors_service' || eq.status === 'en_maintenance') {
        alerts.push({
          id: `alt-break-${eq.id}`,
          equipmentId: eq.id,
          equipmentName: eq.name,
          type: 'breakdown',
          severity: 'critical',
          title: `Arrêt Machine : ${eq.name}`,
          message: `L'équipement est actuellement ${eq.status.replace(/_/g, ' ')} (${eq.location || eq.siteName || 'Base'}).`,
        });
      }

      // 2. Overdue / Upcoming Scheduled Maintenance
      if (eq.nextScheduledMaintenance) {
        const nextDate = new Date(eq.nextScheduledMaintenance);
        const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          alerts.push({
            id: `alt-over-${eq.id}`,
            equipmentId: eq.id,
            equipmentName: eq.name,
            type: 'overdue',
            severity: 'critical',
            title: `Maintenance en Retard : ${eq.reference}`,
            message: `L'échéance préventive était fixée au ${eq.nextScheduledMaintenance} (retard de ${Math.abs(diffDays)} jours).`,
            dueDate: eq.nextScheduledMaintenance,
          });
        } else if (diffDays <= 15) {
          alerts.push({
            id: `alt-up-${eq.id}`,
            equipmentId: eq.id,
            equipmentName: eq.name,
            type: 'upcoming',
            severity: 'medium',
            title: `Échéance Révision Proche : ${eq.name}`,
            message: `Maintenance préventive programmée dans ${diffDays} jours (${eq.nextScheduledMaintenance}).`,
            dueDate: eq.nextScheduledMaintenance,
          });
        }
      }

      // 3. Warranty Expiring
      if (eq.warrantyEndDate) {
        const warrantyDate = new Date(eq.warrantyEndDate);
        const diffWarranty = Math.ceil((warrantyDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffWarranty >= 0 && diffWarranty <= 30) {
          alerts.push({
            id: `alt-war-${eq.id}`,
            equipmentId: eq.id,
            equipmentName: eq.name,
            type: 'warranty_expiring',
            severity: 'medium',
            title: `Fin de Garantie Constructeur : ${eq.name}`,
            message: `La garantie constructeur expire le ${eq.warrantyEndDate} (reste ${diffWarranty} jours).`,
            dueDate: eq.warrantyEndDate,
          });
        }
      }
    });

    return alerts;
  }
}
