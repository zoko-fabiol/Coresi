import {
  OperationalSite,
  SiteStockTransfer,
} from '../types/advancedModules';
import { DataService } from './dataService';
import { AdminConfigService } from './adminConfigService';

export interface SiteConsolidatedMetrics {
  siteId: string;
  siteName: string;
  projectsCount: number;
  employeesCount: number;
  materialsCount: number;
  equipmentCount: number;
  totalExpenses: number;
  openWorkOrders: number;
}

export class SiteService {
  /**
   * Register a new operational site or remote shipyard
   */
  public static async createSite(
    data: Omit<OperationalSite, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'projectsCount' | 'employeesCount' | 'materialsCount'> & {
      code?: string;
    }
  ): Promise<OperationalSite> {
    const code = data.code || AdminConfigService.getNextSequenceNumber('site');
    const id = `site-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const site: OperationalSite = {
      ...data,
      id,
      code,
      projectsCount: 0,
      employeesCount: 0,
      materialsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await DataService.saveSite(site);
    return site;
  }

  /**
   * Initiate an inter-site stock transfer workflow
   */
  public static async initiateTransfer(params: {
    sourceSiteId: string;
    sourceSiteName: string;
    targetSiteId: string;
    targetSiteName: string;
    materialId: string;
    materialName: string;
    materialCode: string;
    quantity: number;
    unit: string;
    requestedBy: string;
    notes?: string;
  }): Promise<SiteStockTransfer> {
    const reference = `TRF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const id = `trf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const transfer: SiteStockTransfer = {
      id,
      reference,
      ...params,
      status: 'demande',
      requestDate: now,
    };

    await DataService.saveSiteTransfer(transfer);
    return transfer;
  }

  /**
   * Dispatch / Ship transfer
   */
  public static async dispatchTransfer(transferId: string, approverName: string): Promise<void> {
    const transfers = DataService.getSiteTransfers();
    const trf = transfers.find((t) => t.id === transferId);
    if (!trf) return;

    trf.status = 'en_transit';
    trf.approvedBy = approverName;
    trf.departureDate = new Date().toISOString();

    await DataService.saveSiteTransfer(trf);
  }

  /**
   * Confirm reception of transfer at destination site
   */
  public static async receiveTransfer(transferId: string, receiverName: string): Promise<void> {
    const transfers = DataService.getSiteTransfers();
    const trf = transfers.find((t) => t.id === transferId);
    if (!trf) return;

    trf.status = 'receptionne';
    trf.receivedBy = receiverName;
    trf.receptionDate = new Date().toISOString();

    await DataService.saveSiteTransfer(trf);
  }

  /**
   * Generates a consolidated summary of site metrics
   */
  public static getConsolidatedMetrics(): SiteConsolidatedMetrics[] {
    const sites = DataService.getSites();
    const projects = DataService.getProjects();
    const employees = DataService.getEmployees();
    const materials = DataService.getMaterials();
    const equipment = DataService.getEquipment();
    const expenses = DataService.getExpenses();
    const workOrders = DataService.getWorkOrders();

    return sites.map((site) => {
      const siteProjects = projects.filter((p) => p.location?.toLowerCase().includes(site.city.toLowerCase()) || p.id === site.id);
      const siteEmployees = employees.filter((e) => e.location?.toLowerCase().includes(site.city.toLowerCase()));
      const siteMaterials = materials.filter((m) => m.location?.toLowerCase().includes(site.name.toLowerCase()) || m.location?.toLowerCase().includes(site.city.toLowerCase()));
      const siteEquipment = equipment.filter((eq) => eq.siteId === site.id);
      const siteExpenses = expenses.filter((exp) => exp.description?.toLowerCase().includes(site.name.toLowerCase()));
      const siteWorkOrders = workOrders.filter((wo) => wo.siteId === site.id && wo.status !== 'cloture');

      return {
        siteId: site.id,
        siteName: site.name,
        projectsCount: siteProjects.length || site.projectsCount || 0,
        employeesCount: siteEmployees.length || site.employeesCount || 0,
        materialsCount: siteMaterials.length || site.materialsCount || 0,
        equipmentCount: siteEquipment.length,
        totalExpenses: siteExpenses.reduce((sum, e) => sum + e.amount, 0),
        openWorkOrders: siteWorkOrders.length,
      };
    });
  }
}
