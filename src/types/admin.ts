export interface SystemModule {
  id: string;
  name: string;
  category: 'core' | 'operations' | 'finance' | 'ressources' | 'support';
  description: string;
  enabled: boolean;
  enabledAt: string;
  updatedAt: string;
  updatedBy: string;
  dependencies: string[]; // module IDs this depends on
  featuresCount: number;
  activeFeaturesCount: number;
  iconName: string;
  isCore?: boolean; // If true, cannot be disabled without super-admin confirmation
}

export interface FeatureOption {
  id: string;
  name: string;
  description: string;
  type: 'boolean' | 'number' | 'string' | 'select';
  value: any;
  options?: { label: string; value: any }[];
}

export interface SystemFeature {
  id: string;
  moduleId: string;
  category: 'Finance' | 'GED' | 'Projets' | 'RH' | 'Stock' | 'Achats' | 'Notifications';
  name: string;
  description: string;
  enabled: boolean;
  dependencies: string[]; // other feature or module IDs
  options: FeatureOption[];
}

export interface WorkflowLevel {
  id: string;
  thresholdMin: number;
  thresholdMax: number;
  validatorRole: string;
  validatorRoleTitle: string;
  requiredReceipt: boolean;
  requiresJustification: boolean;
  allowReject: boolean;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  type: 'expenses' | 'purchases' | 'invoices' | 'payments' | 'documents' | 'hr_requests';
  description: string;
  enabled: boolean;
  levels: WorkflowLevel[];
  rejectReasons: string[];
}

export interface RolePermissions {
  roleId: string;
  roleTitle: string;
  modulePermissions: {
    [moduleId: string]: {
      view: boolean;
      create: boolean;
      edit: boolean;
      validate: boolean;
      export: boolean;
      archive: boolean;
      delete: boolean;
    };
  };
}

export interface NumberingRule {
  id: string;
  entityName: string;
  prefix: string;
  includeYear: boolean;
  includeMonth: boolean;
  digitPadding: number;
  currentCounter: number;
  samplePreview: string;
  resetAnnually: boolean;
  lastResetYear: number;
}

export interface CompanySettings {
  name: string;
  shortName: string;
  legalForm: string;
  logoUrl?: string;
  registrationNumber: string;
  taxId: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  fiscalYearStart: string;
}

export interface NotificationSetting {
  id: string;
  event: string;
  description: string;
  enabled: boolean;
  channels: {
    internal: boolean;
    email: boolean;
    push: boolean;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipientsRole: string[];
  delayMinutes: number;
}

export interface SecuritySettings {
  sessionDurationMinutes: number;
  autoLogoutOnIdle: boolean;
  idleTimeoutMinutes: number;
  maxFailedLogins: number;
  requireMfa: boolean;
  passwordMinLength: number;
  auditTrailRetentionDays: number;
  lockedSections: string[]; // section IDs that are locked against modification
}

export interface GedSettings {
  allowedCategories: string[];
  maxUploadSizeBytes: number;
  retentionYears: number;
  mandatoryDocumentsPerProject: string[];
  versioningEnabled: boolean;
  signatureEnabled: boolean;
  autoTagging: boolean;
}

export interface ScannerOcrSettings {
  scannerEnabled: boolean;
  ocrEnabled: boolean;
  autoDetectEdges: boolean;
  perspectiveCorrection: boolean;
  imageEnhancement: boolean;
  multiPageSupport: boolean;
  ocrLanguage: 'fra' | 'eng' | 'fra+eng';
  pdfQuality: 'low' | 'medium' | 'high';
  autoExtraction: boolean;
  requireHumanValidation: boolean;
}

export interface ProjectSettings {
  statuses: { id: string; label: string; color: string }[];
  categories: { id: string; label: string }[];
  budgetWarningThresholdPct: number; // e.g. 80
  budgetCriticalThresholdPct: number; // e.g. 95
  mandatoryReportFrequencyDays: number; // e.g. 7
  requireWeeklySafetyBriefing: boolean;
}

export interface StockSettings {
  minStockAlertGlobal: number;
  enableMultiWarehouses: boolean;
  warehouses: { id: string; name: string; location: string }[];
  requireReturnReceipt: boolean;
  serialNumberTracking: boolean;
  batchTracking: boolean;
  maintenanceAlertHours: number;
}

export interface HrSettings {
  contractTypes: string[];
  departments: string[];
  positions: string[];
  leaveTypes: string[];
  certificationAlertDaysBeforeExpiry: number; // e.g. 30
  enablePayrollModule: boolean;
}

export interface FinanceSettings {
  currency: string;
  vatRatePct: number;
  applyVatByDefault: boolean;
  paymentMethods: string[];
  pettyCashLimit: number;
  cashRegisterAutoCloseDaily: boolean;
  cashRegisterClosingHour: string;
  mandatoryInvoiceDueDateDays: number;
}
