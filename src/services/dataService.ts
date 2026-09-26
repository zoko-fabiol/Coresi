import {
  Project,
  DocumentRecord,
  Expense,
  Invoice,
  Employee,
  Material,
  Client,
  Supplier,
  AuditLog,
  UserProfile,
  StockMovement,
  TechnicalCertification,
  FiscalObligation,
  ProjectTask,
  ProjectPhase,
} from '../types';
import {
  OperationalSite,
  SiteStockTransfer,
  Equipment,
  MaintenancePlan,
  MaintenanceWorkOrder,
  PurchaseRequest,
  PurchaseOrder,
  GoodsReceipt,
  TechnicalReport,
  AppNotification,
  Mission,
  PayrollPeriod,
  Payslip,
  AccountingAccount,
  JournalEntry,
  BankTransaction,
  OcrResultRecord,
} from '../types/advancedModules';
import {
  INITIAL_PROJECTS,
  INITIAL_DOCUMENTS,
  INITIAL_EXPENSES,
  INITIAL_INVOICES,
  INITIAL_EMPLOYEES,
  INITIAL_MATERIALS,
  INITIAL_CLIENTS,
  INITIAL_SUPPLIERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ADVANCES,
  INITIAL_LOSSES,
  INITIAL_CASH_MOVEMENTS,
  INITIAL_PROJECT_PHOTOS,
  INITIAL_LEAVES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_CERTIFICATIONS,
  INITIAL_FISCAL_OBLIGATIONS,
  INITIAL_PROJECT_TASKS,
} from './seedData';
import {
  INITIAL_SITES,
  INITIAL_SITE_TRANSFERS,
  INITIAL_EQUIPMENT,
  INITIAL_MAINTENANCE_PLANS,
  INITIAL_WORK_ORDERS,
  INITIAL_PURCHASE_REQUESTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_GOODS_RECEIPTS,
  INITIAL_TECHNICAL_REPORTS,
  INITIAL_MISSIONS,
  INITIAL_PAYROLL_PERIODS,
  INITIAL_PAYSLIPS,
  INITIAL_ACCOUNTING_ACCOUNTS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_BANK_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_OCR_RESULTS,
} from './advancedSeedData';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { FirestoreService } from './firebase/firestoreService';

const LOCAL_STORAGE_KEY_PREFIX = 'coresi_erp_';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export class DataService {
  // Current active user simulation / state
  private static currentUser: UserProfile = {
    uid: 'coresi-dg-user',
    email: 'clausephwandji2020@gmail.com',
    displayName: 'Dr. Joseph Ndoundo',
    role: 'dg',
    department: 'direction',
  };

  private static dataChangeListeners: (() => void)[] = [];
  private static initialized: boolean = false;

  public static onDataChange(callback: () => void): () => void {
    this.dataChangeListeners.push(callback);
    return () => {
      this.dataChangeListeners = this.dataChangeListeners.filter((cb) => cb !== callback);
    };
  }

  private static notifyListeners(): void {
    this.dataChangeListeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Data change listener notice:', err);
      }
    });
  }

  /**
   * Initializes real-time synchronization with Cloud Firestore for collaborative multi-user sessions
   */
  public static initRealtimeSync(): void {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Projects Realtime
    try {
      onSnapshot(collection(db, 'projects'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as Project[];
          setLocal('projects', list);
          this.notifyListeners();
        } else {
          // Initial migration to Firestore if empty
          this.migrateCollectionIfEmpty('projects', INITIAL_PROJECTS);
        }
      }, (err) => console.warn('Projects real-time listener notice:', err.message));
    } catch {}

    // 2. Documents Realtime
    try {
      onSnapshot(collection(db, 'documents'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as DocumentRecord[];
          setLocal('documents', list);
          this.notifyListeners();
        } else {
          this.migrateCollectionIfEmpty('documents', INITIAL_DOCUMENTS);
        }
      }, (err) => console.warn('Documents real-time listener notice:', err.message));
    } catch {}

    // 3. Expenses Realtime
    try {
      onSnapshot(collection(db, 'expenses'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as Expense[];
          setLocal('expenses', list);
          this.notifyListeners();
        } else {
          this.migrateCollectionIfEmpty('expenses', INITIAL_EXPENSES);
        }
      }, (err) => console.warn('Expenses real-time listener notice:', err.message));
    } catch {}

    // 4. Invoices Realtime
    try {
      onSnapshot(collection(db, 'invoices'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as Invoice[];
          setLocal('invoices', list);
          this.notifyListeners();
        } else {
          this.migrateCollectionIfEmpty('invoices', INITIAL_INVOICES);
        }
      }, (err) => console.warn('Invoices real-time listener notice:', err.message));
    } catch {}

    // 5. Employees Realtime
    try {
      onSnapshot(collection(db, 'employees'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as Employee[];
          setLocal('employees', list);
          this.notifyListeners();
        } else {
          this.migrateCollectionIfEmpty('employees', INITIAL_EMPLOYEES);
        }
      }, (err) => console.warn('Employees real-time listener notice:', err.message));
    } catch {}

    // 6. Materials Realtime
    try {
      onSnapshot(collection(db, 'materials'), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as Material[];
          setLocal('materials', list);
          this.notifyListeners();
        } else {
          this.migrateCollectionIfEmpty('materials', INITIAL_MATERIALS);
        }
      }, (err) => console.warn('Materials real-time listener notice:', err.message));
    } catch {}

    // 7. Audit Logs Realtime
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(150));
      onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as AuditLog[];
          setLocal('audit_logs', list);
          this.notifyListeners();
        } else {
          this.migrateCollectionIfEmpty('auditLogs', INITIAL_AUDIT_LOGS);
        }
      }, (err) => console.warn('Audit logs real-time listener notice:', err.message));
    } catch {}

    // 8. Advanced Modules Realtime Synchronizations
    this.syncCollection('sites', 'sites', INITIAL_SITES);
    this.syncCollection('siteTransfers', 'site_transfers', INITIAL_SITE_TRANSFERS);
    this.syncCollection('equipment', 'equipment', INITIAL_EQUIPMENT);
    this.syncCollection('maintenancePlans', 'maintenance_plans', INITIAL_MAINTENANCE_PLANS);
    this.syncCollection('maintenanceWorkOrders', 'maintenance_work_orders', INITIAL_WORK_ORDERS);
    this.syncCollection('purchaseRequests', 'purchase_requests', INITIAL_PURCHASE_REQUESTS);
    this.syncCollection('purchaseOrders', 'purchase_orders', INITIAL_PURCHASE_ORDERS);
    this.syncCollection('goodsReceipts', 'goods_receipts', INITIAL_GOODS_RECEIPTS);
    this.syncCollection('technicalReports', 'technical_reports', INITIAL_TECHNICAL_REPORTS);
    this.syncCollection('missions', 'missions', INITIAL_MISSIONS);
    this.syncCollection('payrollPeriods', 'payroll_periods', INITIAL_PAYROLL_PERIODS);
    this.syncCollection('payslips', 'payslips', INITIAL_PAYSLIPS);
    this.syncCollection('accountingAccounts', 'accounting_accounts', INITIAL_ACCOUNTING_ACCOUNTS);
    this.syncCollection('journalEntries', 'journal_entries', INITIAL_JOURNAL_ENTRIES);
    this.syncCollection('bankTransactions', 'bank_transactions', INITIAL_BANK_TRANSACTIONS);
    this.syncCollection('notifications', 'notifications', INITIAL_NOTIFICATIONS);
    this.syncCollection('ocrResults', 'ocr_results', INITIAL_OCR_RESULTS);
  }

  private static syncCollection<T extends { id: string }>(collName: string, localKey: string, initialData: T[]): void {
    try {
      onSnapshot(collection(db, collName), (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as T[];
          setLocal(localKey, list);
          this.notifyListeners();
        } else {
          this.migrateCollectionIfEmpty(collName, initialData);
        }
      }, (err) => console.warn(`${collName} real-time sync notice:`, err.message));
    } catch {}
  }

  private static async migrateCollectionIfEmpty<T extends { id: string }>(collName: string, initialData: T[]): Promise<void> {
    try {
      const existing = await getDocs(collection(db, collName));
      if (existing.empty && initialData.length > 0) {
        console.log(`Initialisation de la collection Firestore [${collName}]...`);
        for (const item of initialData) {
          await setDoc(doc(db, collName, item.id), item).catch(() => {});
        }
      }
    } catch (e) {
      console.warn(`Notice initialisation collection ${collName}:`, e);
    }
  }

  public static getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public static setCurrentUser(user: UserProfile): void {
    this.currentUser = user;
    this.logAudit(
      'user_session_active',
      'user',
      user.uid,
      `Session utilisateur active : ${user.displayName} (${user.email}) [${user.role.toUpperCase()}]`
    );
  }

  // AUDIT LOGS
  public static getAuditLogs(): AuditLog[] {
    return getLocal<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
  }

  public static logAudit(action: string, entity: string, entityId: string, details: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      entity,
      entityId,
      userId: this.currentUser.uid,
      userName: this.currentUser.displayName,
      userRole: this.currentUser.role,
      timestamp: new Date().toISOString(),
      details,
    };
    logs.unshift(newLog);
    setLocal('audit_logs', logs.slice(0, 150));

    try {
      setDoc(doc(db, 'auditLogs', newLog.id), newLog).catch(() => {});
    } catch {}
  }

  // DOCUMENTS (GED)
  public static getDocuments(): DocumentRecord[] {
    return getLocal<DocumentRecord[]>('documents', INITIAL_DOCUMENTS).filter((d) => (d as any).isDeleted !== true);
  }

  public static async saveDocument(docData: DocumentRecord): Promise<void> {
    const docs = getLocal<DocumentRecord[]>('documents', INITIAL_DOCUMENTS);
    const idx = docs.findIndex((d) => d.id === docData.id);
    const updated = {
      ...docData,
      updatedAt: new Date().toISOString(),
      updatedById: this.currentUser.uid,
    };

    if (idx >= 0) {
      docs[idx] = updated;
      this.logAudit('document_updated', 'document', docData.id, `Mise à jour du document : ${docData.title} (${docData.documentNumber})`);
    } else {
      docs.unshift(updated);
      this.logAudit('document_created', 'document', docData.id, `Nouveau document numérisé/archivé : ${docData.title} (${docData.documentNumber})`);
    }
    setLocal('documents', docs);

    if (docData.context.projectId) {
      this.refreshProjectDocsCount(docData.context.projectId);
    }

    try {
      await setDoc(doc(db, 'documents', docData.id), updated);
    } catch (err) {
      console.warn('Firestore sync notice for documents:', err);
    }
    this.notifyListeners();
  }

  public static async archiveDocument(id: string): Promise<void> {
    const docs = getLocal<DocumentRecord[]>('documents', INITIAL_DOCUMENTS);
    const target = docs.find((d) => d.id === id);
    if (target) {
      target.status = 'archived';
      target.updatedAt = new Date().toISOString();
      setLocal('documents', docs);
      this.logAudit('document_archived', 'document', id, `Archivage du document ${target.title}`);
      try {
        await updateDoc(doc(db, 'documents', id), { status: 'archived', updatedAt: target.updatedAt });
      } catch {}
      this.notifyListeners();
    }
  }

  public static async deleteDocument(id: string): Promise<void> {
    const docs = getLocal<DocumentRecord[]>('documents', INITIAL_DOCUMENTS);
    const target = docs.find((d) => d.id === id);
    if (target) {
      // Soft-delete for business data protection
      (target as any).isDeleted = true;
      (target as any).deletedAt = new Date().toISOString();
      (target as any).deletedBy = this.currentUser.uid;
      setLocal('documents', docs);

      this.logAudit('document_deleted', 'document', id, `Suppression logique du document ${target.title} (${target.documentNumber})`);
      try {
        await updateDoc(doc(db, 'documents', id), {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: this.currentUser.uid,
        });
      } catch {}
      this.notifyListeners();
    }
  }

  // PROJECTS
  public static getProjects(): Project[] {
    return getLocal<Project[]>('projects', INITIAL_PROJECTS);
  }

  public static getProjectById(id: string): Project | undefined {
    return this.getProjects().find((p) => p.id === id);
  }

  public static async saveProject(project: Project): Promise<void> {
    const projects = this.getProjects();
    const idx = projects.findIndex((p) => p.id === project.id);
    const updated = {
      ...project,
      updatedAt: new Date().toISOString(),
      updatedById: this.currentUser.uid,
    };

    if (idx >= 0) {
      projects[idx] = updated;
      this.logAudit('project_updated', 'project', project.id, `Mise à jour du chantier ${project.code} - ${project.name}`);
    } else {
      projects.unshift(updated);
      this.logAudit('project_created', 'project', project.id, `Création du nouveau projet ${project.code} - ${project.name}`);
    }
    setLocal('projects', projects);

    try {
      await setDoc(doc(db, 'projects', project.id), updated);
    } catch (err) {
      console.warn('Firestore sync notice for project:', err);
    }
    this.notifyListeners();
  }

  private static refreshProjectDocsCount(projectId: string): void {
    const docs = this.getDocuments();
    const count = docs.filter((d) => d.context.projectId === projectId && d.status !== 'deleted').length;
    const projects = this.getProjects();
    const prj = projects.find((p) => p.id === projectId);
    if (prj) {
      prj.documentsCount = count;
      setLocal('projects', projects);
      setDoc(doc(db, 'projects', projectId), { documentsCount: count }, { merge: true }).catch(() => {});
    }
  }

  // FINANCES - EXPENSES
  public static getExpenses(): Expense[] {
    return getLocal<Expense[]>('expenses', INITIAL_EXPENSES);
  }

  public static async saveExpense(expense: Expense): Promise<void> {
    const expenses = this.getExpenses();
    const idx = expenses.findIndex((e) => e.id === expense.id);
    const updated = {
      ...expense,
      updatedAt: new Date().toISOString(),
      updatedById: this.currentUser.uid,
    };

    if (idx >= 0) {
      expenses[idx] = updated;
      this.logAudit('expense_updated', 'expense', expense.id, `Modification dépense ${expense.reference} (${expense.amount} ${expense.currency})`);
    } else {
      expenses.unshift(updated);
      this.logAudit('expense_created', 'expense', expense.id, `Enregistrement dépense ${expense.reference} de ${expense.amount} ${expense.currency} pour ${expense.projectName}`);
    }
    setLocal('expenses', expenses);

    if (expense.projectId) {
      this.recalculateProjectSpent(expense.projectId);
    }

    try {
      await setDoc(doc(db, 'expenses', expense.id), updated);
    } catch (err) {
      console.warn('Firestore sync notice for expense:', err);
    }
    this.notifyListeners();
  }

  private static recalculateProjectSpent(projectId: string): void {
    const expenses = this.getExpenses().filter((e) => e.projectId === projectId && e.status !== 'rejete');
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const projects = this.getProjects();
    const prj = projects.find((p) => p.id === projectId);
    if (prj) {
      prj.spent = totalSpent;
      setLocal('projects', projects);
      setDoc(doc(db, 'projects', projectId), { spent: totalSpent }, { merge: true }).catch(() => {});
    }
  }

  // FINANCES - INVOICES
  public static getInvoices(): Invoice[] {
    return getLocal<Invoice[]>('invoices', INITIAL_INVOICES);
  }

  public static async saveInvoice(inv: Invoice): Promise<void> {
    const invoices = this.getInvoices();
    const idx = invoices.findIndex((i) => i.id === inv.id);
    const updated = {
      ...inv,
      updatedAt: new Date().toISOString(),
      updatedById: this.currentUser.uid,
    };

    if (idx >= 0) {
      invoices[idx] = updated;
      this.logAudit('invoice_updated', 'invoice', inv.id, `Mise à jour facture ${inv.invoiceNumber} (${inv.totalAmount} ${inv.currency})`);
    } else {
      invoices.unshift(updated);
      this.logAudit('invoice_created', 'invoice', inv.id, `Création facture ${inv.invoiceNumber} (${inv.type.toUpperCase()}) pour ${inv.partyName}`);
    }
    setLocal('invoices', invoices);

    try {
      await setDoc(doc(db, 'invoices', inv.id), updated);
    } catch (err) {
      console.warn('Firestore sync notice for invoice:', err);
    }
    this.notifyListeners();
  }

  // EMPLOYEES (RH)
  public static getEmployees(): Employee[] {
    return getLocal<Employee[]>('employees', INITIAL_EMPLOYEES);
  }

  public static async saveEmployee(emp: Employee): Promise<void> {
    const employees = this.getEmployees();
    const idx = employees.findIndex((e) => e.id === emp.id);
    const updated = {
      ...emp,
      updatedAt: new Date().toISOString(),
      updatedById: this.currentUser.uid,
    };

    if (idx >= 0) {
      employees[idx] = updated;
      this.logAudit('employee_updated', 'employee', emp.id, `Mise à jour fiche collaborateur : ${emp.fullName} (${emp.matricule})`);
    } else {
      employees.unshift(updated);
      this.logAudit('employee_created', 'employee', emp.id, `Ajout nouvel employé : ${emp.fullName} (${emp.matricule})`);
    }
    setLocal('employees', employees);

    try {
      await setDoc(doc(db, 'employees', emp.id), updated);
    } catch (err) {
      console.warn('Firestore sync notice for employee:', err);
    }
    this.notifyListeners();
  }

  // MATERIALS / STOCKS
  public static getMaterials(): Material[] {
    return getLocal<Material[]>('materials', INITIAL_MATERIALS);
  }

  public static async saveMaterial(mat: Material): Promise<void> {
    const materials = this.getMaterials();
    const idx = materials.findIndex((m) => m.id === mat.id);
    const updated = {
      ...mat,
      updatedAt: new Date().toISOString(),
      updatedById: this.currentUser.uid,
    };

    if (idx >= 0) {
      materials[idx] = updated;
      this.logAudit('material_updated', 'material', mat.id, `Mise à jour matériel ${mat.code} - ${mat.name}`);
    } else {
      materials.unshift(updated);
      this.logAudit('material_created', 'material', mat.id, `Ajout matériel au parc : ${mat.code} - ${mat.name}`);
    }
    setLocal('materials', materials);

    try {
      await setDoc(doc(db, 'materials', mat.id), updated);
    } catch (err) {
      console.warn('Firestore sync notice for material:', err);
    }
    this.notifyListeners();
  }

  // CLIENTS & SUPPLIERS
  public static getClients(): Client[] {
    return getLocal<Client[]>('clients', INITIAL_CLIENTS);
  }

  public static async saveClient(client: Client): Promise<void> {
    const clients = this.getClients();
    const idx = clients.findIndex((c) => c.id === client.id);
    if (idx >= 0) {
      clients[idx] = client;
    } else {
      clients.unshift(client);
    }
    setLocal('clients', clients);
    this.logAudit('client_saved', 'client', client.id, `Enregistrement client ${client.name}`);
    setDoc(doc(db, 'clients', client.id), client).catch(() => {});
    this.notifyListeners();
  }

  public static getSuppliers(): Supplier[] {
    return getLocal<Supplier[]>('suppliers', INITIAL_SUPPLIERS);
  }

  public static async saveSupplier(sup: Supplier): Promise<void> {
    const suppliers = this.getSuppliers();
    const idx = suppliers.findIndex((s) => s.id === sup.id);
    if (idx >= 0) {
      suppliers[idx] = sup;
    } else {
      suppliers.unshift(sup);
    }
    setLocal('suppliers', suppliers);
    this.logAudit('supplier_saved', 'supplier', sup.id, `Enregistrement fournisseur ${sup.name}`);
    setDoc(doc(db, 'suppliers', sup.id), sup).catch(() => {});
    this.notifyListeners();
  }

  // EMPLOYEE ARCHIVING
  public static async archiveEmployee(id: string): Promise<void> {
    const employees = this.getEmployees();
    const emp = employees.find((e) => e.id === id);
    if (emp) {
      emp.status = 'archive';
      emp.updatedAt = new Date().toISOString();
      setLocal('employees', employees);
      this.logAudit('employee_archived', 'employee', id, `Archivage de l'employé ${emp.fullName} (${emp.matricule}) - Historique conservé`);
      try {
        await setDoc(doc(db, 'employees', id), emp);
      } catch {}
      this.notifyListeners();
    }
  }

  // SALARY ADVANCES
  public static getSalaryAdvances(): any[] {
    return getLocal<any[]>('salary_advances', INITIAL_ADVANCES);
  }

  public static async saveSalaryAdvance(adv: any): Promise<void> {
    const advances = this.getSalaryAdvances();
    const idx = advances.findIndex((a) => a.id === adv.id);
    if (idx >= 0) {
      advances[idx] = adv;
    } else {
      advances.unshift(adv);
    }
    setLocal('salary_advances', advances);
    this.logAudit('advance_saved', 'salary_advance', adv.id, `Avance sur salaire pour ${adv.employeeName} (${adv.amount} ${adv.currency}) - Statut : ${adv.status}`);
    this.notifyListeners();
  }

  // FINANCIAL LOSSES
  public static getFinancialLosses(): any[] {
    return getLocal<any[]>('financial_losses', INITIAL_LOSSES);
  }

  public static async saveFinancialLoss(loss: any): Promise<void> {
    const losses = this.getFinancialLosses();
    const idx = losses.findIndex((l) => l.id === loss.id);
    if (idx >= 0) {
      losses[idx] = loss;
    } else {
      losses.unshift(loss);
    }
    setLocal('financial_losses', losses);
    this.logAudit('loss_recorded', 'financial_loss', loss.id, `Enregistrement perte financière : ${loss.amount} ${loss.currency} (${loss.cause}) sur ${loss.projectName || 'général'}`);
    this.notifyListeners();
  }

  // CASH & BANK MOVEMENTS
  public static getCashMovements(): any[] {
    return getLocal<any[]>('cash_movements', INITIAL_CASH_MOVEMENTS);
  }

  public static async saveCashMovement(move: any): Promise<void> {
    const moves = this.getCashMovements();
    moves.unshift(move);
    setLocal('cash_movements', moves);
    this.logAudit('cash_movement', 'cash', move.id, `Mouvement ${move.direction.toUpperCase()} de ${move.amount} ${move.currency} sur compte ${move.account}`);
    this.notifyListeners();
  }

  // PROJECT PHOTOS
  public static getProjectPhotos(projectId?: string): any[] {
    const photos = getLocal<any[]>('project_photos', INITIAL_PROJECT_PHOTOS);
    return projectId ? photos.filter((p) => p.projectId === projectId) : photos;
  }

  public static async saveProjectPhoto(photo: any): Promise<void> {
    const photos = getLocal<any[]>('project_photos', INITIAL_PROJECT_PHOTOS);
    photos.unshift(photo);
    setLocal('project_photos', photos);
    this.logAudit('photo_uploaded', 'project_photo', photo.id, `Ajout photo de chantier pour projet ${photo.projectId}`);
    this.notifyListeners();
  }

  // EMPLOYEE LEAVES & MISSIONS
  public static getEmployeeLeaves(employeeId?: string): any[] {
    const leaves = getLocal<any[]>('employee_leaves', INITIAL_LEAVES);
    return employeeId ? leaves.filter((l) => l.employeeId === employeeId) : leaves;
  }

  public static async saveEmployeeLeave(leave: any): Promise<void> {
    const leaves = getLocal<any[]>('employee_leaves', INITIAL_LEAVES);
    leaves.unshift(leave);
    setLocal('employee_leaves', leaves);
    this.logAudit('leave_recorded', 'employee_leave', leave.id, `Enregistrement ${leave.type} pour ${leave.employeeName}`);
    this.notifyListeners();
  }

  // STOCK MOVEMENTS
  public static getStockMovements(): StockMovement[] {
    return getLocal<StockMovement[]>('stock_movements', INITIAL_STOCK_MOVEMENTS);
  }

  public static async saveStockMovement(movement: StockMovement): Promise<void> {
    const movements = this.getStockMovements();
    movements.unshift(movement);
    setLocal('stock_movements', movements);

    const materials = this.getMaterials();
    const mat = materials.find((m) => m.id === movement.materialId || m.code === movement.materialCode);
    if (mat) {
      if (movement.type === 'sortie_chantier') {
        if (movement.isRestituable) {
          mat.status = 'assigne';
          mat.assignedProjectId = movement.projectId;
          mat.assignedProjectName = movement.projectName;
          mat.location = movement.projectName || 'Sur chantier';
        } else {
          mat.quantity = Math.max(0, mat.quantity - movement.quantity);
        }
      } else if (movement.type === 'retour_base') {
        mat.status = 'disponible';
        mat.assignedProjectId = undefined;
        mat.assignedProjectName = undefined;
        mat.location = 'Base Logistique Pointe-Noire';
      } else if (movement.type === 'entree_fournisseur') {
        mat.quantity += movement.quantity;
      }
      mat.updatedAt = new Date().toISOString();
      await this.saveMaterial(mat);
    }

    setDoc(doc(db, 'stockMovements', movement.id), movement).catch(() => {});

    this.logAudit(
      'stock_movement',
      'material',
      movement.materialId,
      `Bon de Mouvement ${movement.reference} (${movement.type.toUpperCase()}) : ${movement.quantity} ${movement.unit} de ${movement.materialName} - Affecté à : ${movement.recipientName} (${movement.projectName || 'Base'})`
    );
    this.notifyListeners();
  }

  // TECHNICAL CERTIFICATIONS
  public static getCertifications(): TechnicalCertification[] {
    return getLocal<TechnicalCertification[]>('certifications', INITIAL_CERTIFICATIONS);
  }

  public static async saveCertification(cert: TechnicalCertification): Promise<void> {
    const certs = this.getCertifications();
    const idx = certs.findIndex((c) => c.id === cert.id);
    if (idx >= 0) {
      certs[idx] = cert;
    } else {
      certs.unshift(cert);
    }
    setLocal('certifications', certs);
    this.logAudit('certification_saved', 'certification', cert.id, `Enregistrement qualification technique : ${cert.title} pour ${cert.employeeName}`);
    this.notifyListeners();
  }

  // ========================================================
  // 1. SITES OPÉRATIONNELS & CHANTIERS DÉPORTÉS
  // ========================================================
  public static getSites(): OperationalSite[] {
    return getLocal<OperationalSite[]>('sites', INITIAL_SITES);
  }

  public static async saveSite(site: OperationalSite): Promise<void> {
    const list = this.getSites();
    const idx = list.findIndex((s) => s.id === site.id);
    if (idx >= 0) {
      list[idx] = site;
    } else {
      list.unshift(site);
    }
    setLocal('sites', list);
    setDoc(doc(db, 'sites', site.id), site).catch(() => {});
    this.logAudit('site_saved', 'site', site.id, `Enregistrement site opérationnel : ${site.name} (${site.code})`);
    this.notifyListeners();
  }

  public static async deleteSite(id: string): Promise<void> {
    const list = this.getSites().filter((s) => s.id !== id);
    setLocal('sites', list);
    deleteDoc(doc(db, 'sites', id)).catch(() => {});
    this.logAudit('site_deleted', 'site', id, `Suppression site opérationnel ${id}`);
    this.notifyListeners();
  }

  public static getSiteTransfers(): SiteStockTransfer[] {
    return getLocal<SiteStockTransfer[]>('site_transfers', INITIAL_SITE_TRANSFERS);
  }

  public static async saveSiteTransfer(trf: SiteStockTransfer): Promise<void> {
    const list = this.getSiteTransfers();
    const idx = list.findIndex((t) => t.id === trf.id);
    if (idx >= 0) {
      list[idx] = trf;
    } else {
      list.unshift(trf);
    }
    setLocal('site_transfers', list);
    setDoc(doc(db, 'siteTransfers', trf.id), trf).catch(() => {});

    // If transfer is completed, record stock movement
    if (trf.status === 'receptionne') {
      const mat = this.getMaterials().find((m) => m.id === trf.materialId || m.code === trf.materialCode);
      if (mat) {
        mat.location = trf.targetSiteName;
        mat.updatedAt = new Date().toISOString();
        await this.saveMaterial(mat);
      }
    }

    this.logAudit('site_transfer_saved', 'siteTransfer', trf.id, `Transfert inter-sites ${trf.reference} (${trf.materialName}) : ${trf.sourceSiteName} → ${trf.targetSiteName} [${trf.status.toUpperCase()}]`);
    this.notifyListeners();
  }

  // ========================================================
  // 2. ACHATS & CYCLE COMMANDES FOURNISSEURS
  // ========================================================
  public static getPurchaseRequests(): PurchaseRequest[] {
    return getLocal<PurchaseRequest[]>('purchase_requests', INITIAL_PURCHASE_REQUESTS);
  }

  public static async savePurchaseRequest(pr: PurchaseRequest): Promise<void> {
    const list = this.getPurchaseRequests();
    const idx = list.findIndex((r) => r.id === pr.id);
    if (idx >= 0) {
      list[idx] = pr;
    } else {
      list.unshift(pr);
    }
    setLocal('purchase_requests', list);
    setDoc(doc(db, 'purchaseRequests', pr.id), pr).catch(() => {});
    this.logAudit('purchase_request_saved', 'purchaseRequest', pr.id, `Demande d'achat ${pr.reference} (${pr.estimatedAmount.toLocaleString('fr-FR')} FCFA) - Statut: ${pr.status}`);
    this.notifyListeners();
  }

  public static async deletePurchaseRequest(id: string): Promise<void> {
    const list = this.getPurchaseRequests().filter((r) => r.id !== id);
    setLocal('purchase_requests', list);
    deleteDoc(doc(db, 'purchaseRequests', id)).catch(() => {});
    this.logAudit('purchase_request_deleted', 'purchaseRequest', id, `Suppression demande d'achat ${id}`);
    this.notifyListeners();
  }

  public static getPurchaseOrders(): PurchaseOrder[] {
    return getLocal<PurchaseOrder[]>('purchase_orders', INITIAL_PURCHASE_ORDERS);
  }

  public static async savePurchaseOrder(po: PurchaseOrder): Promise<void> {
    const list = this.getPurchaseOrders();
    const idx = list.findIndex((o) => o.id === po.id);
    if (idx >= 0) {
      list[idx] = po;
    } else {
      list.unshift(po);
    }
    setLocal('purchase_orders', list);
    setDoc(doc(db, 'purchaseOrders', po.id), po).catch(() => {});
    this.logAudit('purchase_order_saved', 'purchaseOrder', po.id, `Bon de commande ${po.reference} Fournisseur: ${po.supplierName} (${po.totalAmount.toLocaleString('fr-FR')} FCFA)`);
    this.notifyListeners();
  }

  public static getGoodsReceipts(): GoodsReceipt[] {
    return getLocal<GoodsReceipt[]>('goods_receipts', INITIAL_GOODS_RECEIPTS);
  }

  public static async saveGoodsReceipt(gr: GoodsReceipt): Promise<void> {
    const list = this.getGoodsReceipts();
    const idx = list.findIndex((g) => g.id === gr.id);
    if (idx >= 0) {
      list[idx] = gr;
    } else {
      list.unshift(gr);
    }
    setLocal('goods_receipts', list);
    setDoc(doc(db, 'goodsReceipts', gr.id), gr).catch(() => {});

    // Stock update trigger if validated receipt with stockable items
    if (gr.status === 'conforme' && !gr.stockUpdated) {
      gr.stockUpdated = true;
      for (const item of gr.items) {
        if (item.isStockable && item.receivedQuantity > 0) {
          await this.saveStockMovement({
            id: `sm-rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            reference: `BE-REC-${gr.reference.replace(/[^0-9]/g, '').slice(-4)}`,
            materialId: 'mat-auto-rec',
            materialName: item.description,
            materialCode: 'REC-MAT',
            type: 'entree_fournisseur',
            quantity: item.receivedQuantity,
            unit: 'unités',
            date: new Date().toISOString(),
            projectId: gr.projectId,
            projectName: gr.projectName,
            recipientName: gr.receivedBy,
            emitterName: gr.supplierName || 'Magasin Central',
            signedBy: gr.receivedBy,
            isRestituable: false,
            notes: `Entrée automatique sur bon de réception ${gr.reference} (BL Fournisseur : ${gr.deliveryNoteNumber || 'N/A'})`,
          });
        }
      }
    }

    this.logAudit('goods_receipt_saved', 'goodsReceipt', gr.id, `Bon de réception ${gr.reference} pour commande ${gr.orderReference} - Statut: ${gr.status}`);
    this.notifyListeners();
  }

  // ========================================================
  // 3. RAPPORTS & PROCÈS-VERBAUX TECHNIQUES
  // ========================================================
  public static getTechnicalReports(): TechnicalReport[] {
    return getLocal<TechnicalReport[]>('technical_reports', INITIAL_TECHNICAL_REPORTS);
  }

  public static async saveTechnicalReport(rep: TechnicalReport): Promise<void> {
    const list = this.getTechnicalReports();
    const idx = list.findIndex((r) => r.id === rep.id);
    if (idx >= 0) {
      list[idx] = rep;
    } else {
      list.unshift(rep);
    }
    setLocal('technical_reports', list);
    setDoc(doc(db, 'technicalReports', rep.id), rep).catch(() => {});
    this.logAudit('technical_report_saved', 'technicalReport', rep.id, `Rapport/PV technique ${rep.reference} [${rep.type.toUpperCase()}] : "${rep.title}" - Statut: ${rep.status}`);
    this.notifyListeners();
  }

  public static async deleteTechnicalReport(id: string): Promise<void> {
    const list = this.getTechnicalReports().filter((r) => r.id !== id);
    setLocal('technical_reports', list);
    deleteDoc(doc(db, 'technicalReports', id)).catch(() => {});
    this.logAudit('technical_report_deleted', 'technicalReport', id, `Suppression rapport technique ${id}`);
    this.notifyListeners();
  }

  // ========================================================
  // 4. MAINTENANCE & GMAO
  // ========================================================
  public static getEquipment(): Equipment[] {
    return getLocal<Equipment[]>('equipment', INITIAL_EQUIPMENT);
  }

  public static async saveEquipment(eq: Equipment): Promise<void> {
    const list = this.getEquipment();
    const idx = list.findIndex((e) => e.id === eq.id);
    if (idx >= 0) {
      list[idx] = eq;
    } else {
      list.unshift(eq);
    }
    setLocal('equipment', list);
    setDoc(doc(db, 'equipment', eq.id), eq).catch(() => {});
    this.logAudit('equipment_saved', 'equipment', eq.id, `Équipement GMAO ${eq.reference} : ${eq.name} (${eq.manufacturer} - ${eq.model}) [${eq.status.toUpperCase()}]`);
    this.notifyListeners();
  }

  public static async deleteEquipment(id: string): Promise<void> {
    const list = this.getEquipment().filter((e) => e.id !== id);
    setLocal('equipment', list);
    deleteDoc(doc(db, 'equipment', id)).catch(() => {});
    this.logAudit('equipment_deleted', 'equipment', id, `Suppression équipement ${id}`);
    this.notifyListeners();
  }

  public static getMaintenancePlans(): MaintenancePlan[] {
    return getLocal<MaintenancePlan[]>('maintenance_plans', INITIAL_MAINTENANCE_PLANS);
  }

  public static async saveMaintenancePlan(plan: MaintenancePlan): Promise<void> {
    const list = this.getMaintenancePlans();
    const idx = list.findIndex((p) => p.id === plan.id);
    if (idx >= 0) {
      list[idx] = plan;
    } else {
      list.unshift(plan);
    }
    setLocal('maintenance_plans', list);
    setDoc(doc(db, 'maintenancePlans', plan.id), plan).catch(() => {});
    this.logAudit('maintenance_plan_saved', 'maintenancePlan', plan.id, `Plan de maintenance préventive : ${plan.title}`);
    this.notifyListeners();
  }

  public static getWorkOrders(): MaintenanceWorkOrder[] {
    return getLocal<MaintenanceWorkOrder[]>('maintenance_work_orders', INITIAL_WORK_ORDERS);
  }

  public static async saveWorkOrder(wo: MaintenanceWorkOrder): Promise<void> {
    const list = this.getWorkOrders();
    const idx = list.findIndex((w) => w.id === wo.id);
    if (idx >= 0) {
      list[idx] = wo;
    } else {
      list.unshift(wo);
    }
    setLocal('maintenance_work_orders', list);
    setDoc(doc(db, 'maintenanceWorkOrders', wo.id), wo).catch(() => {});

    // Update equipment operating hours & maintenance cost
    if (wo.status === 'cloture') {
      const equip = this.getEquipment().find((e) => e.id === wo.equipmentId);
      if (equip) {
        equip.totalMaintenanceCost = (equip.totalMaintenanceCost || 0) + wo.totalCost;
        equip.lastMaintenanceDate = wo.closedAt?.split('T')[0] || new Date().toISOString().split('T')[0];
        equip.status = 'operationnel';
        equip.updatedAt = new Date().toISOString();
        await this.saveEquipment(equip);
      }
    }

    this.logAudit('work_order_saved', 'maintenanceWorkOrder', wo.id, `Ordre de travail GMAO ${wo.reference} : ${wo.equipmentName} (${wo.totalCost.toLocaleString('fr-FR')} FCFA) [${wo.status.toUpperCase()}]`);
    this.notifyListeners();
  }

  // ========================================================
  // 5. MISSIONS PROFESSIONNELLES & DÉPLACEMENTS
  // ========================================================
  public static getMissions(): Mission[] {
    return getLocal<Mission[]>('missions', INITIAL_MISSIONS);
  }

  public static async saveMission(mis: Mission): Promise<void> {
    const list = this.getMissions();
    const idx = list.findIndex((m) => m.id === mis.id);
    if (idx >= 0) {
      list[idx] = mis;
    } else {
      list.unshift(mis);
    }
    setLocal('missions', list);
    setDoc(doc(db, 'missions', mis.id), mis).catch(() => {});
    this.logAudit('mission_saved', 'mission', mis.id, `Ordre de mission ${mis.reference} pour ${mis.employeeName} → ${mis.destination} [${mis.status.toUpperCase()}]`);
    this.notifyListeners();
  }

  public static async deleteMission(id: string): Promise<void> {
    const list = this.getMissions().filter((m) => m.id !== id);
    setLocal('missions', list);
    deleteDoc(doc(db, 'missions', id)).catch(() => {});
    this.logAudit('mission_deleted', 'mission', id, `Suppression mission ${id}`);
    this.notifyListeners();
  }

  // ========================================================
  // 6. PAIE & RÉMUNÉRATION (SYSCOHADA)
  // ========================================================
  public static getPayrollPeriods(): PayrollPeriod[] {
    return getLocal<PayrollPeriod[]>('payroll_periods', INITIAL_PAYROLL_PERIODS);
  }

  public static async savePayrollPeriod(period: PayrollPeriod): Promise<void> {
    const list = this.getPayrollPeriods();
    const idx = list.findIndex((p) => p.id === period.id);
    if (idx >= 0) {
      list[idx] = period;
    } else {
      list.unshift(period);
    }
    setLocal('payroll_periods', list);
    setDoc(doc(db, 'payrollPeriods', period.id), period).catch(() => {});
    this.logAudit('payroll_period_saved', 'payrollPeriod', period.id, `Période de paie ${period.periodKey} (Masse salariale nette : ${period.totalNet.toLocaleString('fr-FR')} FCFA) - Statut: ${period.status}`);
    this.notifyListeners();
  }

  public static getPayslips(): Payslip[] {
    return getLocal<Payslip[]>('payslips', INITIAL_PAYSLIPS);
  }

  public static async savePayslip(slip: Payslip): Promise<void> {
    const list = this.getPayslips();
    const idx = list.findIndex((p) => p.id === slip.id);
    if (idx >= 0) {
      list[idx] = slip;
    } else {
      list.unshift(slip);
    }
    setLocal('payslips', list);
    setDoc(doc(db, 'payslips', slip.id), slip).catch(() => {});
    this.logAudit('payslip_saved', 'payslip', slip.id, `Bulletin de salaire ${slip.reference} : ${slip.employeeName} (Net : ${slip.netSalary.toLocaleString('fr-FR')} FCFA)`);
    this.notifyListeners();
  }

  // ========================================================
  // 7. COMPTABILITÉ AVANCÉE (SYSCOHADA)
  // ========================================================
  public static getAccountingAccounts(): AccountingAccount[] {
    return getLocal<AccountingAccount[]>('accounting_accounts', INITIAL_ACCOUNTING_ACCOUNTS);
  }

  public static async saveAccountingAccount(acc: AccountingAccount): Promise<void> {
    const list = this.getAccountingAccounts();
    const idx = list.findIndex((a) => a.id === acc.id);
    if (idx >= 0) {
      list[idx] = acc;
    } else {
      list.unshift(acc);
    }
    setLocal('accounting_accounts', list);
    setDoc(doc(db, 'accountingAccounts', acc.id), acc).catch(() => {});
    this.logAudit('accounting_account_saved', 'accountingAccount', acc.id, `Compte comptable ${acc.code} : ${acc.name} (${acc.type.toUpperCase()})`);
    this.notifyListeners();
  }

  public static getJournalEntries(): JournalEntry[] {
    return getLocal<JournalEntry[]>('journal_entries', INITIAL_JOURNAL_ENTRIES);
  }

  public static async saveJournalEntry(entry: JournalEntry): Promise<void> {
    // Strict verification of balance
    const diff = Math.abs(entry.totalDebit - entry.totalCredit);
    if (diff > 0.01) {
      throw new Error(`Écriture comptable déséquilibrée ! Débit (${entry.totalDebit}) ≠ Crédit (${entry.totalCredit})`);
    }
    entry.isBalanced = true;

    const list = this.getJournalEntries();
    const idx = list.findIndex((j) => j.id === entry.id);
    if (idx >= 0) {
      list[idx] = entry;
    } else {
      list.unshift(entry);
    }
    setLocal('journal_entries', list);
    setDoc(doc(db, 'journalEntries', entry.id), entry).catch(() => {});
    this.logAudit('journal_entry_saved', 'journalEntry', entry.id, `Écriture comptable ${entry.reference} [${entry.journalCode.toUpperCase()}] : Total équilibré ${entry.totalDebit.toLocaleString('fr-FR')} FCFA - Statut: ${entry.status}`);
    this.notifyListeners();
  }

  public static getBankTransactions(): BankTransaction[] {
    return getLocal<BankTransaction[]>('bank_transactions', INITIAL_BANK_TRANSACTIONS);
  }

  public static async saveBankTransaction(tx: BankTransaction): Promise<void> {
    const list = this.getBankTransactions();
    const idx = list.findIndex((b) => b.id === tx.id);
    if (idx >= 0) {
      list[idx] = tx;
    } else {
      list.unshift(tx);
    }
    setLocal('bank_transactions', list);
    setDoc(doc(db, 'bankTransactions', tx.id), tx).catch(() => {});
    this.logAudit('bank_tx_saved', 'bankTransaction', tx.id, `Transaction bancaire ${tx.reference} (${tx.bankAccount}) - Rapprochement: ${tx.reconciled ? 'OUI' : 'NON'}`);
    this.notifyListeners();
  }

  // ========================================================
  // 8. CENTRE DE NOTIFICATIONS
  // ========================================================
  public static getNotifications(): AppNotification[] {
    return getLocal<AppNotification[]>('notifications', INITIAL_NOTIFICATIONS);
  }

  public static async saveNotification(notif: AppNotification): Promise<void> {
    const list = this.getNotifications();
    const idx = list.findIndex((n) => n.id === notif.id);
    if (idx >= 0) {
      list[idx] = notif;
    } else {
      list.unshift(notif);
    }
    setLocal('notifications', list);
    setDoc(doc(db, 'notifications', notif.id), notif).catch(() => {});
    this.notifyListeners();
  }

  public static async markNotificationRead(id: string): Promise<void> {
    const list = this.getNotifications();
    const target = list.find((n) => n.id === id);
    if (target) {
      target.read = true;
      setLocal('notifications', list);
      updateDoc(doc(db, 'notifications', id), { read: true }).catch(() => {});
      this.notifyListeners();
    }
  }

  public static async markAllNotificationsRead(): Promise<void> {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    setLocal('notifications', list);
    this.notifyListeners();
  }

  // ========================================================
  // 9. OCR RESULTS RECORDS & AUDIT
  // ========================================================
  public static getOcrResults(): OcrResultRecord[] {
    return getLocal<OcrResultRecord[]>('ocr_results', INITIAL_OCR_RESULTS);
  }

  public static async saveOcrResult(record: OcrResultRecord): Promise<void> {
    const list = this.getOcrResults();
    const idx = list.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    setLocal('ocr_results', list);
    setDoc(doc(db, 'ocrResults', record.id), record).catch(() => {});
    this.logAudit('ocr_processed', 'ocrResult', record.id, `Traitement OCR document "${record.originalFileName}" - Type: ${record.finalClassification || record.proposedClassification} (Confiance: ${record.confidenceScore}%) - Statut: ${record.status}`);
    this.notifyListeners();
  }

  // ========================================================
  // 10. FISCAL OBLIGATIONS & DÉMARCHES
  // ========================================================
  public static getFiscalObligations(): FiscalObligation[] {
    return getLocal<FiscalObligation[]>('fiscal_obligations', INITIAL_FISCAL_OBLIGATIONS);
  }

  public static async saveFiscalObligation(record: FiscalObligation): Promise<void> {
    const list = this.getFiscalObligations();
    const idx = list.findIndex((o) => o.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    setLocal('fiscal_obligations', list);
    setDoc(doc(db, 'fiscalObligations', record.id), record).catch(() => {});
    this.logAudit(
      'fiscal_obligation_updated',
      'fiscalObligation',
      record.id,
      `Obligation fiscale "${record.title}" - Statut: ${record.status} - Montant: ${record.declarationAmount} FCFA`
    );
    this.notifyListeners();
  }

  // ========================================================
  // 11. PROJECT TASKS & KANBAN PHASES
  // ========================================================
  public static getProjectTasks(projectId?: string): ProjectTask[] {
    const all = getLocal<ProjectTask[]>('project_tasks', INITIAL_PROJECT_TASKS);
    if (projectId) {
      return all.filter((t) => t.projectId === projectId);
    }
    return all;
  }

  public static async saveProjectTask(task: ProjectTask): Promise<void> {
    const list = getLocal<ProjectTask[]>('project_tasks', INITIAL_PROJECT_TASKS);
    const idx = list.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      list[idx] = task;
    } else {
      list.push(task);
    }
    setLocal('project_tasks', list);
    setDoc(doc(db, 'projectTasks', task.id), task).catch(() => {});
    this.notifyListeners();
  }

  public static async updateProjectTaskPhase(taskId: string, phase: ProjectPhase): Promise<void> {
    const list = getLocal<ProjectTask[]>('project_tasks', INITIAL_PROJECT_TASKS);
    const task = list.find((t) => t.id === taskId);
    if (task) {
      task.phase = phase;
      setLocal('project_tasks', list);
      setDoc(doc(db, 'projectTasks', taskId), task).catch(() => {});
      this.notifyListeners();
    }
  }

  // Reset to initial demo data
  public static resetToDemoData(): void {
    setLocal('projects', INITIAL_PROJECTS);
    setLocal('documents', INITIAL_DOCUMENTS);
    setLocal('expenses', INITIAL_EXPENSES);
    setLocal('invoices', INITIAL_INVOICES);
    setLocal('employees', INITIAL_EMPLOYEES);
    setLocal('materials', INITIAL_MATERIALS);
    setLocal('clients', INITIAL_CLIENTS);
    setLocal('suppliers', INITIAL_SUPPLIERS);
    setLocal('audit_logs', INITIAL_AUDIT_LOGS);
    setLocal('salary_advances', INITIAL_ADVANCES);
    setLocal('financial_losses', INITIAL_LOSSES);
    setLocal('cash_movements', INITIAL_CASH_MOVEMENTS);
    setLocal('project_photos', INITIAL_PROJECT_PHOTOS);
    setLocal('employee_leaves', INITIAL_LEAVES);
    setLocal('stock_movements', INITIAL_STOCK_MOVEMENTS);
    setLocal('certifications', INITIAL_CERTIFICATIONS);
    // Advanced modules reset
    setLocal('sites', INITIAL_SITES);
    setLocal('site_transfers', INITIAL_SITE_TRANSFERS);
    setLocal('equipment', INITIAL_EQUIPMENT);
    setLocal('maintenance_plans', INITIAL_MAINTENANCE_PLANS);
    setLocal('maintenance_work_orders', INITIAL_WORK_ORDERS);
    setLocal('purchase_requests', INITIAL_PURCHASE_REQUESTS);
    setLocal('purchase_orders', INITIAL_PURCHASE_ORDERS);
    setLocal('goods_receipts', INITIAL_GOODS_RECEIPTS);
    setLocal('technical_reports', INITIAL_TECHNICAL_REPORTS);
    setLocal('missions', INITIAL_MISSIONS);
    setLocal('payroll_periods', INITIAL_PAYROLL_PERIODS);
    setLocal('payslips', INITIAL_PAYSLIPS);
    setLocal('accounting_accounts', INITIAL_ACCOUNTING_ACCOUNTS);
    setLocal('journal_entries', INITIAL_JOURNAL_ENTRIES);
    setLocal('bank_transactions', INITIAL_BANK_TRANSACTIONS);
    setLocal('notifications', INITIAL_NOTIFICATIONS);
    setLocal('ocr_results', INITIAL_OCR_RESULTS);
    setLocal('fiscal_obligations', INITIAL_FISCAL_OBLIGATIONS);
    setLocal('project_tasks', INITIAL_PROJECT_TASKS);

    this.logAudit('system_reset', 'system', 'all', 'Réinitialisation complète des données industrielles de démonstration (Modules de Base & Modules Avancés).');
    this.notifyListeners();
  }
}
