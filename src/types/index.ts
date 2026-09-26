export type UserRole = 'admin' | 'dg' | 'comptable' | 'chef_projet' | 'rh' | 'magasinier' | 'employe' | 'invite';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department: string;
  photoURL?: string;
}

export type DocumentCategory =
  | 'factures'
  | 'devis'
  | 'bons_commande'
  | 'bons_livraison'
  | 'contrats'
  | 'administratif'
  | 'comptable'
  | 'financier'
  | 'projets'
  | 'rh'
  | 'rapports'
  | 'justificatifs'
  | 'plans_techniques'
  | 'autre';

export type DocumentStatus = 'draft' | 'processing' | 'pending_validation' | 'validated' | 'archived' | 'deleted';

export interface CloudinaryMeta {
  publicId: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  pageCount?: number;
  folder?: string;
}

export interface OcrData {
  text: string;
  confidence: number;
  detectedFields?: {
    documentNumber?: string;
    documentDate?: string;
    amount?: number;
    currency?: string;
    vendorOrClient?: string;
    category?: DocumentCategory;
    projectId?: string;
  };
  processedAt: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  documentNumber: string;
  category: DocumentCategory;
  cloudinary: CloudinaryMeta;
  ocr: OcrData;
  context: {
    projectId?: string;
    projectName?: string;
    clientId?: string;
    clientName?: string;
    supplierId?: string;
    supplierName?: string;
    employeeId?: string;
    employeeName?: string;
    invoiceId?: string;
    expenseId?: string;
  };
  metadata: {
    documentDate: string;
    amount?: number;
    currency?: string;
    description: string;
    tags: string[];
  };
  status: DocumentStatus;
  uploadedBy: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectCategory =
  | 'ingenierie'
  | 'construction_industrielle'
  | 'genie_civil'
  | 'chaudronnerie'
  | 'tuyauterie'
  | 'instrumentation'
  | 'charpente'
  | 'maintenance';

export type ProjectStatus = 'draft' | 'in_progress' | 'on_hold' | 'completed' | 'archived';

export interface Project {
  id: string;
  code: string;
  name: string;
  clientId: string;
  clientName: string;
  category: ProjectCategory;
  location: string;
  budget: number;
  spent: number;
  progress: number;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  managerId: string;
  managerName: string;
  description: string;
  assignedWorkersCount: number;
  documentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | 'materiel'
  | 'main_oeuvre'
  | 'transport'
  | 'sous_traitance'
  | 'consommable'
  | 'carburant'
  | 'frais_chantier'
  | 'autre';

export type PaymentMethod = 'caisse' | 'virement_bancaire' | 'cheque' | 'carte' | 'mobile_money';

export type ExpenseStatus = 'en_attente' | 'valide' | 'paye' | 'rejete';

export interface Expense {
  id: string;
  reference: string;
  projectId: string;
  projectName: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  supplierId?: string;
  supplierName?: string;
  date: string;
  description: string;
  documentId?: string;
  documentUrl?: string;
  status: ExpenseStatus;
  approvedBy?: string;
  validationStatus?: 'en_attente_dg' | 'bon_a_payer_accorde' | 'rejete';
  approvedByDG?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceType = 'client' | 'fournisseur';
export type InvoiceStatus = 'brouillon' | 'emis' | 'partiel' | 'paye' | 'en_retard' | 'annule';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  partyName: string;
  projectId?: string;
  projectName?: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: InvoiceStatus;
  documentId?: string;
  documentUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type Department =
  | 'direction'
  | 'ingenierie'
  | 'operations'
  | 'chaudronnerie'
  | 'tuyauterie'
  | 'comptabilite'
  | 'rh'
  | 'logistique'
  | 'securite';

export type ContractType = 'cdi' | 'cdd' | 'prestation' | 'stage';
export type EmployeeStatus = 'actif' | 'conge' | 'mission' | 'archive';

export interface Employee {
  id: string;
  matricule: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  role: string;
  department: Department;
  phone: string;
  email: string;
  location?: string;
  salary: number;
  contractType: ContractType;
  cnssNumber?: string;
  bankName?: string;
  bankIban?: string;
  birthDate?: string;
  maritalStatus?: 'celibataire' | 'marie' | 'divorce' | 'veuf';
  childrenCount?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  photoUrl?: string;
  assignedProjectId?: string;
  assignedProjectName?: string;
  status: EmployeeStatus;
  hireDate: string;
  documentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  matricule: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm
  checkOutTime?: string; // HH:mm
  status: 'present' | 'retard' | 'absent' | 'mission' | 'conge';
  delayMinutes: number;
  overtimeMinutes: number;
  siteName?: string;
  comment?: string;
}

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  matricule: string;
  date: string;
  hoursCount: number;
  rate: '25%' | '50%' | '100%';
  taskDescription: string;
  status: 'soumis' | 'valide' | 'rejete';
  validatedBy?: string;
}

export type MaterialCategory =
  | 'outillage'
  | 'soudage'
  | 'levage'
  | 'protection'
  | 'vehicules'
  | 'consommables'
  | 'tuyauterie_acier';

export type MaterialCondition = 'neuf' | 'bon_etat' | 'en_maintenance' | 'hors_service';
export type MaterialStatus = 'disponible' | 'assigne' | 'maintenance' | 'reforme';

export interface Material {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  quantity: number;
  unit: string;
  condition: MaterialCondition;
  location: string;
  assignedProjectId?: string;
  assignedProjectName?: string;
  status: MaterialStatus;
  lastMaintenanceDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  sector: string;
  activeProjectsCount: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  details: string;
}

export interface SalaryAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  currency: string;
  requestDate: string;
  reason: string;
  status: 'en_attente' | 'accordee' | 'justifiee' | 'remboursee' | 'rejetee';
  repaymentMode: 'retenue_salaire' | 'especes' | 'virement';
  justificationNotes?: string;
  approvedBy?: string;
}

export interface FinancialLoss {
  id: string;
  reference: string;
  projectId?: string;
  projectName?: string;
  amount: number;
  currency: string;
  cause: 'rebut_matiere' | 'defaut_soudure' | 'casse_materiel' | 'intemperies' | 'retard_penalite' | 'autre';
  description: string;
  date: string;
  recordedBy: string;
}

export interface CashMovement {
  id: string;
  account: 'caisse_especes' | 'banque_sgc' | 'banque_ecobank';
  direction: 'entree' | 'sortie';
  amount: number;
  currency: string;
  date: string;
  reference: string;
  label: string;
  category: string;
  projectId?: string;
  documentId?: string;
  balanceAfter?: number;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  title: string;
  photoUrl: string;
  date: string;
  uploadedBy: string;
  phase: string;
}

export interface EmployeeLeave {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'conge_annuel' | 'absence_justifiee' | 'maladie' | 'mission_chantier';
  startDate: string;
  endDate: string;
  status: 'approuve' | 'en_cours' | 'termine';
  destination?: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folder: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface ScannedPage {
  id: string;
  originalDataUrl: string;
  processedDataUrl: string;
  rotation: number; // 0, 90, 180, 270
  filter: 'color' | 'grayscale' | 'bw' | 'enhanced';
  corners?: { x: number; y: number }[]; // 4 corners normalized [0-1]
}

export type StockMovementType = 'entree_fournisseur' | 'sortie_chantier' | 'retour_base' | 'rebut';

export interface StockMovement {
  id: string;
  reference: string;
  type: StockMovementType;
  materialId: string;
  materialName: string;
  materialCode: string;
  quantity: number;
  unit: string;
  date: string;
  projectId?: string;
  projectName?: string;
  recipientName: string; // ouvrier ou chef d'équipe prenant le matériel
  emitterName: string; // magasinier
  signedBy?: string;
  isRestituable: boolean; // outillage devant revenir ou consommable posé
  returnStatus?: 'en_cours' | 'restitue' | 'non_applicable';
  notes?: string;
  documentId?: string;
}

export interface TechnicalCertification {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  category: 'soudage' | 'securite_sst' | 'caces_engins' | 'cnd_ultrasons' | 'medical_offshore';
  issuingBody: string;
  issueDate: string;
  expiryDate: string;
  daysRemaining?: number;
  status: 'valide' | 'expire_bientot' | 'expire';
  documentId?: string;
}

export interface OfflineQueueItem {
  id: string;
  type: 'scan' | 'expense' | 'stock_exit';
  title: string;
  payload: any;
  createdAt: string;
  synced: boolean;
}

export type FiscalObligationType =
  | 'tva_mensuelle'
  | 'acompte_is'
  | 'retenue_tsr'
  | 'cnss_ouvriers'
  | 'patente_annuelle'
  | 'quitus_fiscal'
  | 'taxe_voirie';

export type FiscalObligationStatus =
  | 'a_declarer'
  | 'en_cours'
  | 'valide_quittance'
  | 'en_retard';

export interface FiscalObligation {
  id: string;
  code: string;
  type: FiscalObligationType;
  title: string;
  period: string;
  dueDate: string;
  declarationAmount: number;
  paidAmount: number;
  status: FiscalObligationStatus;
  quittanceUrl?: string;
  quittanceRef?: string;
  quittanceDate?: string;
  notes?: string;
  projectId?: string;
  projectName?: string;
  organisme: 'DGI' | 'CNSS' | 'MAIRIE' | 'DOUANES';
}

export type ProjectPhase = 'etude_appro' | 'atelier_soudure' | 'montage_site' | 'epreuve_reception';

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  phase: ProjectPhase;
  assignedTo?: string;
  dueDate: string;
  priority: 'basse' | 'normale' | 'haute' | 'urgente';
  completed: boolean;
  notes?: string;
  attachments?: {
    name: string;
    url: string;
    type?: string;
    size?: string;
  }[];
}

export * from './advancedModules';

