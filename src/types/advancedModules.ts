import { UserRole, DocumentCategory } from './index';

// ==========================================
// 1. MULTI-SITES & CHANTIERS DÉPORTÉS
// ==========================================
export type SiteType = 'headquarters' | 'branch' | 'construction_site' | 'warehouse' | 'temporary_site';
export type SiteStatus = 'actif' | 'en_attente' | 'cloture';

export interface OperationalSite {
  id: string;
  code: string; // e.g. SITE-PNR-01
  name: string;
  type: SiteType;
  address: string;
  city: string;
  region: string;
  country: string;
  managerId?: string;
  managerName: string;
  status: SiteStatus;
  projectsCount: number;
  employeesCount: number;
  materialsCount: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type TransferStatus = 'demande' | 'valide' | 'en_transit' | 'receptionne' | 'annule';

export interface SiteStockTransfer {
  id: string;
  reference: string; // e.g. TRF-2026-0001
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
  approvedBy?: string;
  status: TransferStatus;
  requestDate: string;
  departureDate?: string;
  receptionDate?: string;
  dispatchedBy?: string;
  receivedBy?: string;
  notes?: string;
  documentUrl?: string;
}

// ==========================================
// 2. MOTEUR OCR & IA
// ==========================================
export type OcrEngineType = 'gemini_vision' | 'tesseract' | 'client_heuristic' | 'tesseract_native';

export type OcrDocClassification =
  | 'facture'
  | 'bon_commande'
  | 'bon_livraison'
  | 'contrat'
  | 'rapport'
  | 'pv_technique'
  | 'document_rh'
  | 'document_administratif'
  | 'autre';

export type DocumentClassification =
  | OcrDocClassification
  | 'pv'
  | 'administratif';

export interface ExtractedLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ExtractedDocumentData {
  documentNumber?: string;
  documentDate?: string;
  dueDate?: string;
  supplierName?: string;
  clientName?: string;
  amountHT?: number;
  vatAmount?: number;
  amountTTC?: number;
  currency?: string;
  projectId?: string;
  projectName?: string;
  siteId?: string;
  employeeName?: string;
  employeeId?: string;
  documentCategory?: DocumentCategory;
  authorName?: string;
  lines?: ExtractedLineItem[];
  confidenceScores: {
    documentNumber: number;
    documentDate: number;
    amounts: number;
    parties: number;
    overall: number;
  };
}

export type ExtractedOcrData = ExtractedDocumentData;

export interface OcrResultRecord {
  id: string;
  documentId?: string;
  originalFileName: string;
  fileUrl: string;
  rawText: string;
  text?: string; // alias
  proposedClassification: DocumentClassification;
  finalClassification: DocumentClassification;
  extractedData: ExtractedDocumentData;
  validatedData?: ExtractedDocumentData;
  confidenceScore: number;
  confidence?: number; // alias
  detectedFields?: {
    documentNumber?: string;
    category?: string;
    amount?: number;
    vendorOrClient?: string;
    currency?: string;
  };
  engineUsed: OcrEngineType;
  status: 'pending_validation' | 'validated' | 'rejected';
  processedAt: string;
  validatedAt?: string;
  validatedBy?: string;
  corrections?: Record<string, any>;
}

// ==========================================
// 3. ACHATS & COMMANDES
// ==========================================
export type PurchaseRequestStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'ordered'
  | 'completed'
  | 'cancelled';

export interface PurchaseItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotalPrice: number;
  materialId?: string; // If linking to standard catalog
  receivedQuantity?: number;
}

export type PurchaseRequestItem = PurchaseItem;

export interface PurchaseQuoteComparison {
  supplierId: string;
  supplierName: string;
  quotedAmount: number;
  deliveryDays: number;
  paymentTerms: string;
  warrantyMonths?: number;
  notes?: string;
  quoteDocumentUrl?: string;
  selected?: boolean;
}

export type SupplierOfferComparison = PurchaseQuoteComparison;

export interface PurchaseRequest {
  id: string;
  reference: string; // DA-2026-XXXX
  requesterId: string;
  requesterName: string;
  departmentId: string;
  projectId?: string;
  projectName?: string;
  siteId?: string;
  siteName?: string;
  items: PurchaseItem[];
  reason: string;
  estimatedAmount: number;
  currency: string;
  priority: 'basse' | 'normale' | 'haute' | 'urgente';
  status: PurchaseRequestStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  supplierComparison?: PurchaseQuoteComparison | PurchaseQuoteComparison[];
  approvalHistory?: Array<{
    action: string;
    approverName: string;
    approverRole?: string;
    timestamp?: string;
    comment?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus =
  | 'brouillon'
  | 'en_attente_approbation'
  | 'approuve'
  | 'valide'
  | 'envoye_fournisseur'
  | 'reception_partielle'
  | 'reception_totale'
  | 'receptionne_partiel'
  | 'receptionne_complet'
  | 'annule';

export interface PurchaseOrder {
  id: string;
  reference: string; // BC-2026-XXXX
  requestId?: string;
  supplierId: string;
  supplierName: string;
  projectId?: string;
  projectName?: string;
  siteId?: string;
  siteName?: string;
  items: PurchaseItem[];
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentTerms: string;
  expectedDeliveryDate?: string;
  status: PurchaseOrderStatus;
  documentUrl?: string; // Cloudinary BC PDF
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceipt {
  id: string;
  reference: string; // REC-2026-XXXX
  orderId: string;
  orderReference: string;
  supplierId: string;
  supplierName: string;
  projectId?: string;
  projectName?: string;
  siteId?: string;
  siteName?: string;
  receptionDate: string;
  receivedBy: string;
  items: {
    description: string;
    orderedQuantity: number;
    receivedQuantity: number;
    damagedQuantity: number;
    missingQuantity: number;
    isStockable: boolean;
    materialId?: string;
  }[];
  deliveryNoteNumber: string; // Bon de livraison émargé
  deliveryNoteDocUrl?: string; // Cloudinary
  observations: string;
  isComplete: boolean;
  status: 'conforme' | 'reserves' | 'rejete';
  stockUpdated: boolean;
  createdAt: string;
}

// ==========================================
// 4. RAPPORTS & PV TECHNIQUES
// ==========================================
export type TechnicalReportType =
  | 'rapport_chantier'
  | 'avancement_travaux'
  | 'intervention'
  | 'inspection_cnd'
  | 'epreuve_hydraulique'
  | 'pv_reception'
  | 'pv_reunion'
  | 'pv_controle_qualite'
  | 'securite_hse'
  | 'rapport_maintenance';

export interface ReportActionItem {
  id: string;
  description: string;
  responsiblePerson: string;
  deadlineDate: string;
  status: 'en_attente' | 'en_cours' | 'termine';
}

export interface TechnicalReport {
  id: string;
  reference: string; // RPT-2026-XXXX or PV-2026-XXXX
  type: TechnicalReportType;
  title: string;
  projectId?: string;
  projectName: string;
  siteId?: string;
  siteName?: string;
  authorId: string;
  authorName: string;
  date: string;
  participants: string[];
  summary: string;
  observations: string;
  workPerformed: string;
  issues?: string;
  recommendations?: string;
  reserves?: string;
  actionItems?: ReportActionItem[];
  attachments: {
    id: string;
    title: string;
    url: string;
    type: 'photo' | 'plan' | 'document';
  }[];
  status: 'brouillon' | 'soumis' | 'valide' | 'rejete';
  validatedBy?: string;
  validatedAt?: string;
  pdfExportUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 5. CENTRE DE NOTIFICATIONS
// ==========================================
export type NotificationCategory =
  | 'finance'
  | 'projects'
  | 'documents'
  | 'stock'
  | 'purchases'
  | 'hr'
  | 'maintenance'
  | 'missions'
  | 'payroll'
  | 'accounting'
  | 'sites'
  | 'security'
  | 'system'
  | 'reports';

export type NotificationPriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AppNotification {
  id: string;
  type: NotificationCategory;
  title: string;
  message: string;
  recipientUserId?: string; // If targeted to user
  recipientRole?: UserRole | 'all' | string; // If targeted to role
  entityType?: string;
  entityId?: string;
  projectId?: string;
  siteId?: string;
  priority: NotificationPriorityLevel;
  read: boolean;
  deepLink?: string;
  createdAt: string;
}

// ==========================================
// 6. MAINTENANCE & GMAO
// ==========================================
export type EquipmentOperationalStatus = 'operationnel' | 'en_panne' | 'en_maintenance' | 'reforme' | 'hors_service';

export interface Equipment {
  id: string;
  reference: string; // EQ-2026-XXXX
  name: string;
  category: 'soudage' | 'levage' | 'compresseur' | 'vehicule' | 'generateur' | 'outillage_specifique';
  serialNumber: string;
  manufacturer: string;
  model: string;
  siteId?: string;
  siteName?: string;
  projectId?: string;
  projectName?: string;
  location: string;
  status: EquipmentOperationalStatus;
  commissioningDate: string;
  warrantyEndDate?: string;
  maintenancePlanId?: string;
  operatingHours: number;
  totalMaintenanceCost: number;
  interventionsCount: number;
  lastMaintenanceDate?: string;
  nextScheduledMaintenance?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenancePlan {
  id: string;
  equipmentId: string;
  title: string;
  frequencyDays: number; // e.g. every 90 days
  operations: string[];
  checklist: string[];
  estimatedDurationHours: number;
  assignedRole: string;
  active: boolean;
}

export interface WorkOrderPart {
  materialId?: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface MaintenanceWorkOrder {
  id: string;
  reference: string; // OT-2026-XXXX
  equipmentId: string;
  equipmentName: string;
  type: 'corrective' | 'preventive';
  priority: 'normale' | 'urgente' | 'critique';
  failureDescription: string;
  diagnostic?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName: string;
  siteId?: string;
  projectId?: string;
  partsUsed: WorkOrderPart[];
  laborHours: number;
  laborRatePerHour: number;
  totalCost: number;
  status: 'ouvert' | 'en_cours' | 'en_attente_pieces' | 'cloture';
  openedAt: string;
  closedAt?: string;
  reportNotes?: string;
  documentUrl?: string; // Cloudinary PV intervention
}

// ==========================================
// 7. MISSIONS & DÉPLACEMENTS
// ==========================================
export type MissionStatus =
  | 'brouillon'
  | 'demande'
  | 'soumise'
  | 'approuvee_dg'
  | 'rejetee'
  | 'en_cours'
  | 'terminee'
  | 'soldee';

export interface MissionExpenseRecord {
  id: string;
  category: 'transport' | 'hebergement' | 'repas' | 'carburant' | 'peage_frais' | 'autre';
  date: string;
  amount: number;
  currency: string;
  receiptUrl?: string;
  description: string;
}

export type MissionExpense = MissionExpenseRecord;

export interface Mission {
  id: string;
  reference: string; // MIS-2026-XXXX
  employeeId: string;
  employeeName: string;
  employeeMatricule: string;
  employeeRole: string;
  projectId?: string;
  projectName?: string;
  siteId?: string;
  siteName?: string;
  destination: string; // e.g. "Site Offshore Djeno - Plateforme FNP"
  purpose: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  transportType: 'avion' | 'vehicule_societe' | 'train' | 'navire_offshore' | 'transport_public' | 'route';
  accommodation: 'base_vie' | 'hotel' | 'chantier';
  estimatedCost: number;
  advanceRequested: number;
  advanceGiven?: number;
  advancePaymentMethod?: string;
  actualTotalCost: number;
  balanceAmount: number; // advanceGiven - actualTotalCost
  expenses: MissionExpenseRecord[];
  status: MissionStatus;
  approvedBy?: string;
  approvedAt?: string;
  orderDocumentUrl?: string; // Cloudinary Ordre de Mission officiel
  liquidationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 8. PAIE & RÉMUNÉRATION
// ==========================================
export type PayrollPeriodStatus = 'preparation' | 'calcule' | 'controle' | 'valide' | 'valide_dg' | 'cloture';

export interface PayrollTaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface PayrollSettings {
  currency: string;
  standardWorkingDays: number;
  standardWorkingHours: number;
  employeeCnssRate: number;
  employerCnssRate: number;
  cnssCeiling: number;
  irppBrackets: PayrollTaxBracket[];
  standardTransportAllowance: number;
}

export interface PayrollPeriod {
  id: string;
  periodKey: string; // e.g. "2026-09"
  month: number;
  year: number;
  status: PayrollPeriodStatus;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  totalEmployerContributions: number;
  employeesCount: number;
  calculatedAt?: string;
  validatedBy?: string;
  validatedAt?: string;
  closedAt?: string;
  closedBy?: string;
}

export interface Payslip {
  id: string;
  reference: string; // PAY-2026-XXXX
  periodId: string;
  periodKey: string;
  employeeId: string;
  matricule: string;
  employeeName: string;
  department: string;
  role: string;
  contractType: string;
  baseSalary: number;
  workedDays: number;
  overtimeHours: number;
  overtimeAmount: number;
  seniorityBonus: number;
  offshoreBonus: number; // Prime de panier / éloignement
  hazardBonus: number; // Prime de risque soudure / hauteur
  transportAllowance: number;
  housingAllowance: number;
  grossSalary: number;
  employeeCnss: number; // Cotisation sociale ouvrière (4.2%)
  incomeTax: number; // IRPP / Retenue à la source
  advanceDeduction: number; // Retenue sur acompte/avance
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  employerCnss: number; // Cotisation patronale (16.0%)
  totalEmployerCost: number;
  paymentMethod: 'virement' | 'especes' | 'cheque';
  paymentStatus: 'en_attente' | 'paye';
  bulletinPdfUrl?: string;
  generatedAt: string;
}

// ==========================================
// 9. COMPTABILITÉ AVANCÉE
// ==========================================
export type AccountType = 'actif' | 'passif' | 'charge' | 'produit';
export type JournalCode = 'achats' | 'ventes' | 'banque' | 'caisse' | 'od' | 'paie';

export interface AccountingAccount {
  id: string;
  code: string; // e.g. "401000", "411000", "512000"
  name: string;
  type: AccountType;
  parentId?: string;
  active: boolean;
  balanceDebit: number;
  balanceCredit: number;
}

export interface JournalEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  projectId?: string;
  siteId?: string;
}

export interface JournalEntry {
  id: string;
  reference: string; // JNL-2026-XXXX
  date: string;
  description: string;
  journalCode: JournalCode;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  sourceType?: 'facture' | 'depense' | 'paie' | 'mission' | 'reception' | 'manuel';
  sourceId?: string;
  documentId?: string;
  status: 'brouillon' | 'soumise' | 'validee' | 'cloturee';
  createdBy: string;
  validatedBy?: string;
  validatedAt?: string;
  createdAt: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  bankAccount: string;
  reference: string;
  label: string;
  debit: number;
  credit: number;
  reconciledWithEntryId?: string;
  matchedEntryId?: string;
  reconciled: boolean;
}
