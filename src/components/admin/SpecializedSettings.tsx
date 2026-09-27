import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  FolderOpen,
  Camera,
  FolderKanban,
  Package,
  Users,
  Bell,
  Check,
  Save,
  AlertTriangle,
  Plus,
  Trash2,
  Wrench,
  Compass,
  MapPin,
  ClipboardCheck,
  ShoppingCart,
  Handshake,
  Calculator,
  Printer,
  ShieldAlert,
  Sliders,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { AdminConfigService } from '../../services/adminConfigService';
import {
  FinanceSettings,
  GedSettings,
  ScannerOcrSettings,
  ProjectSettings,
  StockSettings,
  HrSettings,
  GmaoSettings,
  MissionSettings,
  SiteSettings,
  ReportSettings,
  PurchaseSettings,
  PartnerSettings,
  PayrollSettings,
  PrintSettings,
  NotificationSetting,
} from '../../types/admin';

export type SpecializedSection =
  | 'finance'
  | 'ged'
  | 'scanner_ocr'
  | 'projects'
  | 'stock'
  | 'hr'
  | 'notifications'
  | 'gmao'
  | 'missions'
  | 'sites'
  | 'reports'
  | 'purchases'
  | 'partners'
  | 'payroll'
  | 'print';

interface SpecializedSettingsProps {
  section: SpecializedSection;
  onSaved: (msg: string) => void;
}

export const SpecializedSettings: React.FC<SpecializedSettingsProps> = ({ section, onSaved }) => {
  // 1. Finance
  const [finance, setFinance] = useState<FinanceSettings>(AdminConfigService.getFinanceSettings());
  const [newPayMethod, setNewPayMethod] = useState('');

  // 2. GED
  const [ged, setGed] = useState<GedSettings>(AdminConfigService.getGedSettings());
  const [newMandatoryDoc, setNewMandatoryDoc] = useState('');

  // 3. Scanner & OCR
  const [scannerOcr, setScannerOcr] = useState<ScannerOcrSettings>(AdminConfigService.getScannerOcrSettings());

  // 4. Projects
  const [projects, setProjects] = useState<ProjectSettings>(AdminConfigService.getProjectSettings());

  // 5. Stock
  const [stock, setStock] = useState<StockSettings>(AdminConfigService.getStockSettings());

  // 6. HR
  const [hr, setHr] = useState<HrSettings>(AdminConfigService.getHrSettings());
  const [newDept, setNewDept] = useState('');

  // 7. Notifications
  const [notifications, setNotifications] = useState<NotificationSetting[]>(AdminConfigService.getNotificationSettings());

  // 8. GMAO
  const [gmao, setGmao] = useState<GmaoSettings>(AdminConfigService.getGmaoSettings());
  const [newEquipmentCat, setNewEquipmentCat] = useState('');

  // 9. Missions
  const [missions, setMissions] = useState<MissionSettings>(AdminConfigService.getMissionSettings());

  // 10. Multi-Sites
  const [sites, setSites] = useState<SiteSettings>(AdminConfigService.getSiteSettings());

  // 11. Reports & PV
  const [reports, setReports] = useState<ReportSettings>(AdminConfigService.getReportSettings());
  const [newStandard, setNewStandard] = useState('');

  // 12. Purchases
  const [purchases, setPurchases] = useState<PurchaseSettings>(AdminConfigService.getPurchaseSettings());

  // 13. Partners
  const [partners, setPartners] = useState<PartnerSettings>(AdminConfigService.getPartnerSettings());
  const [newHseDoc, setNewHseDoc] = useState('');

  // 14. Payroll
  const [payroll, setPayroll] = useState<PayrollSettings>(AdminConfigService.getPayrollSettings());

  // 15. Print & A4
  const [print, setPrint] = useState<PrintSettings>(AdminConfigService.getPrintSettings());

  const [isSaving, setIsSaving] = useState(false);

  // Reload state whenever section changes or listeners trigger
  useEffect(() => {
    setFinance(AdminConfigService.getFinanceSettings());
    setGed(AdminConfigService.getGedSettings());
    setScannerOcr(AdminConfigService.getScannerOcrSettings());
    setProjects(AdminConfigService.getProjectSettings());
    setStock(AdminConfigService.getStockSettings());
    setHr(AdminConfigService.getHrSettings());
    setNotifications(AdminConfigService.getNotificationSettings());
    setGmao(AdminConfigService.getGmaoSettings());
    setMissions(AdminConfigService.getMissionSettings());
    setSites(AdminConfigService.getSiteSettings());
    setReports(AdminConfigService.getReportSettings());
    setPurchases(AdminConfigService.getPurchaseSettings());
    setPartners(AdminConfigService.getPartnerSettings());
    setPayroll(AdminConfigService.getPayrollSettings());
    setPrint(AdminConfigService.getPrintSettings());
  }, [section]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      switch (section) {
        case 'finance':
          await AdminConfigService.saveFinanceSettings(finance);
          onSaved('Paramètres financiers et facturation enregistrés.');
          break;
        case 'ged':
          await AdminConfigService.saveGedSettings(ged);
          onSaved('Paramètres GED et rétention documentaire enregistrés.');
          break;
        case 'scanner_ocr':
          await AdminConfigService.saveScannerOcrSettings(scannerOcr);
          onSaved('Paramètres Scanner mobile et moteur OCR enregistrés.');
          break;
        case 'projects':
          await AdminConfigService.saveProjectSettings(projects);
          onSaved('Paramètres projets et seuils de surveillance budgétaire enregistrés.');
          break;
        case 'stock':
          await AdminConfigService.saveStockSettings(stock);
          onSaved('Paramètres gestion des stocks et outillages enregistrés.');
          break;
        case 'hr':
          await AdminConfigService.saveHrSettings(hr);
          onSaved('Paramètres RH et qualifications de soudage enregistrés.');
          break;
        case 'notifications':
          await AdminConfigService.saveNotificationSettings(notifications);
          onSaved('Matrice des notifications et alertes enregistrée.');
          break;
        case 'gmao':
          await AdminConfigService.saveGmaoSettings(gmao);
          onSaved('Paramètres GMAO & maintenance préventive enregistrés.');
          break;
        case 'missions':
          await AdminConfigService.saveMissionSettings(missions);
          onSaved('Barème des perdiems et gestion des missions enregistré.');
          break;
        case 'sites':
          await AdminConfigService.saveSiteSettings(sites);
          onSaved('Paramètres multi-sites et règles de transferts enregistrés.');
          break;
        case 'reports':
          await AdminConfigService.saveReportSettings(reports);
          onSaved('Normes de PV techniques et épreuves hydrauliques enregistrées.');
          break;
        case 'purchases':
          await AdminConfigService.savePurchaseSettings(purchases);
          onSaved('Seuils de commande et règles des 3 devis enregistrés.');
          break;
        case 'partners':
          await AdminConfigService.savePartnerSettings(partners);
          onSaved('Paramètres tiers, sous-traitance et agréments HSE enregistrés.');
          break;
        case 'payroll':
          await AdminConfigService.savePayrollSettings(payroll);
          onSaved('Paramètres de paie, cotisations CNSS et primes enregistrés.');
          break;
        case 'print':
          await AdminConfigService.savePrintSettings(print);
          onSaved('Paramètres d\'impression A4 et charte officielle enregistrés.');
          break;
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderSaveHeader = (title: string, icon: React.ReactNode, subtitle?: string) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
      </button>
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* 1. FINANCE */}
      {section === 'finance' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Paramètres Financiers & Facturation',
            <DollarSign className="w-5 h-5 text-emerald-400" />,
            'Devise, taux de TVA en vigueur au Congo, plafond caisse espèces et modes de règlement.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Devise du système</label>
              <input
                type="text"
                value={finance.currency}
                onChange={(e) => setFinance({ ...finance, currency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Taux de TVA (%)</label>
              <input
                type="number"
                value={finance.vatRatePct}
                onChange={(e) => setFinance({ ...finance, vatRatePct: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Plafond espèces / Caisse (FCFA)</label>
              <input
                type="number"
                value={finance.pettyCashLimit}
                onChange={(e) => setFinance({ ...finance, pettyCashLimit: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Délai d'échéance facture standard (jours)</label>
              <input
                type="number"
                value={finance.mandatoryInvoiceDueDateDays}
                onChange={(e) => setFinance({ ...finance, mandatoryInvoiceDueDateDays: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Heure de clôture quotidienne de caisse</label>
              <input
                type="time"
                value={finance.cashRegisterClosingHour || '17:30'}
                onChange={(e) => setFinance({ ...finance, cashRegisterClosingHour: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="flex flex-col justify-end space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={finance.applyVatByDefault}
                  onChange={(e) => setFinance({ ...finance, applyVatByDefault: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0"
                />
                <span className="text-slate-300">Appliquer la TVA automatiquement sur les devis</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={finance.cashRegisterAutoCloseDaily}
                  onChange={(e) => setFinance({ ...finance, cashRegisterAutoCloseDaily: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0"
                />
                <span className="text-slate-300">Clôture journalière automatique de caisse</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs font-bold text-white mb-2">Modes de règlement autorisés</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {finance.paymentMethods.map((m, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs flex items-center gap-2"
                >
                  <span>{m}</span>
                  <button
                    onClick={() =>
                      setFinance({
                        ...finance,
                        paymentMethods: finance.paymentMethods.filter((_, idx) => idx !== i),
                      })
                    }
                    className="text-slate-500 hover:text-red-400 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Nouveau mode de règlement..."
                value={newPayMethod}
                onChange={(e) => setNewPayMethod(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <button
                onClick={() => {
                  if (newPayMethod.trim()) {
                    setFinance({
                      ...finance,
                      paymentMethods: [...finance.paymentMethods, newPayMethod.trim()],
                    });
                    setNewPayMethod('');
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. GED */}
      {section === 'ged' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Paramètres GED & Rétention Documentaire',
            <FolderOpen className="w-5 h-5 text-cyan-400" />,
            'Durée légale d\'archivage, taille maximale des uploads et pièces exigées par projet.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Durée légale de conservation (années)</label>
              <input
                type="number"
                value={ged.retentionYears}
                onChange={(e) => setGed({ ...ged, retentionYears: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Taille max fichier uploadé (Mo)</label>
              <input
                type="number"
                value={Math.round(ged.maxUploadSizeBytes / (1024 * 1024))}
                onChange={(e) =>
                  setGed({ ...ged, maxUploadSizeBytes: Number(e.target.value) * 1024 * 1024 })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ged.versioningEnabled}
                  onChange={(e) => setGed({ ...ged, versioningEnabled: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Activer le versioning des révisions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ged.signatureEnabled}
                  onChange={(e) => setGed({ ...ged, signatureEnabled: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Activer le visa électronique de conformité</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ged.autoTagging}
                  onChange={(e) => setGed({ ...ged, autoTagging: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Étiquetage automatique par intelligence GED</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs font-bold text-white mb-2">Documents obligatoires pour clôture de chantier</p>
            <div className="space-y-2 max-w-lg mb-3">
              {ged.mandatoryDocumentsPerProject.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                >
                  <span className="text-slate-300 font-medium">{doc}</span>
                  <button
                    onClick={() =>
                      setGed({
                        ...ged,
                        mandatoryDocumentsPerProject: ged.mandatoryDocumentsPerProject.filter(
                          (_, i) => i !== idx
                        ),
                      })
                    }
                    className="text-slate-500 hover:text-red-400 font-bold"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Ex: PV d'épreuve hydraulique..."
                value={newMandatoryDoc}
                onChange={(e) => setNewMandatoryDoc(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <button
                onClick={() => {
                  if (newMandatoryDoc.trim()) {
                    setGed({
                      ...ged,
                      mandatoryDocumentsPerProject: [
                        ...ged.mandatoryDocumentsPerProject,
                        newMandatoryDoc.trim(),
                      ],
                    });
                    setNewMandatoryDoc('');
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SCANNER & OCR */}
      {section === 'scanner_ocr' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Paramètres Scanner Mobile & Moteur OCR',
            <Camera className="w-5 h-5 text-amber-400" />,
            'Prétraitement d\'image, seuils de netteté et validation humaine des indexations.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <p className="font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Traitements d'Image &amp; Numérisation Mobile</span>
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scannerOcr.scannerEnabled}
                  onChange={(e) => setScannerOcr({ ...scannerOcr, scannerEnabled: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Activer le module scanner mobile</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scannerOcr.autoDetectEdges}
                  onChange={(e) => setScannerOcr({ ...scannerOcr, autoDetectEdges: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Détection automatique des contours du document</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scannerOcr.perspectiveCorrection}
                  onChange={(e) => setScannerOcr({ ...scannerOcr, perspectiveCorrection: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Redressement automatique de la perspective</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scannerOcr.multiPageSupport}
                  onChange={(e) => setScannerOcr({ ...scannerOcr, multiPageSupport: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Support multi-pages (assemblage en un seul PDF)</span>
              </label>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <p className="font-bold text-white flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-amber-400" />
                <span>Reconnaissance Optique des Caractères (OCR)</span>
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scannerOcr.ocrEnabled}
                  onChange={(e) => setScannerOcr({ ...scannerOcr, ocrEnabled: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Activer le module d'extraction automatique OCR</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scannerOcr.requireHumanValidation}
                  onChange={(e) => setScannerOcr({ ...scannerOcr, requireHumanValidation: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Exiger validation humaine des montants extraits</span>
              </label>
              <div>
                <label className="text-slate-400 block mb-1">Dictionnaire OCR</label>
                <select
                  value={scannerOcr.ocrLanguage}
                  onChange={(e) => setScannerOcr({ ...scannerOcr, ocrLanguage: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="fra">Français (Industriel &amp; Facturation OHADA)</option>
                  <option value="fra+eng">Bilingue Français + Anglais (Normes ASME)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Qualité d'encodage PDF</label>
                <select
                  value={scannerOcr.pdfQuality}
                  onChange={(e) => setScannerOcr({ ...scannerOcr, pdfQuality: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="low">Économique (Moins de 500 Ko)</option>
                  <option value="medium">Standard (Équilibré 1-2 Mo)</option>
                  <option value="high">Haute définition (Plans et PV épreuves)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PROJETS */}
      {section === 'projects' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Paramètres Projets & Surveillance Budgétaire',
            <FolderKanban className="w-5 h-5 text-blue-400" />,
            'Plafonds d\'alerte de dérive des coûts, fréquence des comptes-rendus et sécurité chantier.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Seuil alerte préventive budget (%)</label>
              <input
                type="number"
                value={projects.budgetWarningThresholdPct}
                onChange={(e) =>
                  setProjects({ ...projects, budgetWarningThresholdPct: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Notifie le chef de projet</span>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Seuil alerte critique budget (%)</label>
              <input
                type="number"
                value={projects.budgetCriticalThresholdPct}
                onChange={(e) =>
                  setProjects({ ...projects, budgetCriticalThresholdPct: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Notifie la Direction Générale</span>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Fréquence rapports d'avancement (jours)</label>
              <input
                type="number"
                value={projects.mandatoryReportFrequencyDays}
                onChange={(e) =>
                  setProjects({ ...projects, mandatoryReportFrequencyDays: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                checked={projects.requireWeeklySafetyBriefing}
                onChange={(e) =>
                  setProjects({ ...projects, requireWeeklySafetyBriefing: e.target.checked })
                }
                className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0"
              />
              <span className="text-slate-300">Exiger le causerie / briefing sécurité hebdomadaire (HSE obligatoire)</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. STOCK */}
      {section === 'stock' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Paramètres des Stocks & Équipements',
            <Package className="w-5 h-5 text-emerald-400" />,
            'Seuils d\'alerte matière première, traçabilité par numéro de série et multi-dépôts.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Seuil d'alerte stock minimum standard</label>
              <input
                type="number"
                value={stock.minStockAlertGlobal}
                onChange={(e) => setStock({ ...stock, minStockAlertGlobal: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Alerte maintenance outillage (heures d'usage)</label>
              <input
                type="number"
                value={stock.maintenanceAlertHours}
                onChange={(e) =>
                  setStock({ ...stock, maintenanceAlertHours: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stock.enableMultiWarehouses}
                  onChange={(e) => setStock({ ...stock, enableMultiWarehouses: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Activer le multi-entrepôt (Magasin Central + Chantiers)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stock.serialNumberTracking}
                  onChange={(e) => setStock({ ...stock, serialNumberTracking: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Traçabilité individuelle par numéro de série</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stock.batchTracking}
                  onChange={(e) => setStock({ ...stock, batchTracking: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Suivi des numéros de coulée (tubes, tôles &amp; électrodes)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 6. RH */}
      {section === 'hr' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Paramètres Ressources Humaines & Qualifications',
            <Users className="w-5 h-5 text-cyan-400" />,
            'Délais d\'alerte pour les certificats de soudage (6G / ASME) et départements CORESI.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">
                Alerte péremption qualification soudeur (jours avant échéance)
              </label>
              <input
                type="number"
                value={hr.certificationAlertDaysBeforeExpiry}
                onChange={(e) =>
                  setHr({ ...hr, certificationAlertDaysBeforeExpiry: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={hr.enablePayrollModule}
                onChange={(e) => setHr({ ...hr, enablePayrollModule: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-cyan-600"
              />
              <span className="text-slate-300">Activer le module complet Paie &amp; Bulletins</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs font-bold text-white mb-2">Départements d'entreprise actifs</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {hr.departments.map((dept, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs flex items-center gap-2"
                >
                  <span>{dept}</span>
                  <button
                    onClick={() =>
                      setHr({
                        ...hr,
                        departments: hr.departments.filter((_, idx) => idx !== i),
                      })
                    }
                    className="text-slate-500 hover:text-red-400 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Nouveau département..."
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <button
                onClick={() => {
                  if (newDept.trim()) {
                    setHr({
                      ...hr,
                      departments: [...hr.departments, newDept.trim()],
                    });
                    setNewDept('');
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. GMAO */}
      {section === 'gmao' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Paramètres GMAO & Maintenance Industrielle',
            <Wrench className="w-5 h-5 text-blue-400" />,
            'Cycles d\'heures de fonctionnement, seuils d\'urgence financière et diagnostic obligatoire.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Seuil révision préventive (heures de marche)</label>
              <input
                type="number"
                value={gmao.preventiveAlertHours}
                onChange={(e) => setGmao({ ...gmao, preventiveAlertHours: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Compresseurs, groupes et postes TIG</span>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Seuil panne critique urgente (FCFA)</label>
              <input
                type="number"
                value={gmao.urgentPriorityThresholdCost}
                onChange={(e) =>
                  setGmao({ ...gmao, urgentPriorityThresholdCost: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gmao.requireDiagnosticBeforeClosure}
                  onChange={(e) =>
                    setGmao({ ...gmao, requireDiagnosticBeforeClosure: e.target.checked })
                  }
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Exiger un rapport diagnostic avant clôture de l'OT</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gmao.autoGenerateWorkOrderOnAlert}
                  onChange={(e) =>
                    setGmao({ ...gmao, autoGenerateWorkOrderOnAlert: e.target.checked })
                  }
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Générer automatiquement un OT à l'atteinte des heures</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs font-bold text-white mb-2">Familles d'équipements sous contrat</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {gmao.equipmentCategories.map((cat, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs flex items-center gap-2"
                >
                  <span>{cat}</span>
                  <button
                    onClick={() =>
                      setGmao({
                        ...gmao,
                        equipmentCategories: gmao.equipmentCategories.filter((_, idx) => idx !== i),
                      })
                    }
                    className="text-slate-500 hover:text-red-400 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Nouvelle famille (ex: Découpeur plasma)..."
                value={newEquipmentCat}
                onChange={(e) => setNewEquipmentCat(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <button
                onClick={() => {
                  if (newEquipmentCat.trim()) {
                    setGmao({
                      ...gmao,
                      equipmentCategories: [...gmao.equipmentCategories, newEquipmentCat.trim()],
                    });
                    setNewEquipmentCat('');
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MISSIONS */}
      {section === 'missions' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Barème des Missions & Ordres de Déplacement',
            <Compass className="w-5 h-5 text-indigo-400" />,
            'Indemnités journalières (perdiems) Onshore/Offshore, avance de trésorerie et délais de décharge.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Per diem Onshore (FCFA / jour)</label>
              <input
                type="number"
                value={missions.perDiemOnshoreFCFA}
                onChange={(e) =>
                  setMissions({ ...missions, perDiemOnshoreFCFA: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Brazzaville, Kouilou, Niari</span>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Per diem Offshore / Plateforme (FCFA / jour)</label>
              <input
                type="number"
                value={missions.perDiemOffshoreFCFA}
                onChange={(e) =>
                  setMissions({ ...missions, perDiemOffshoreFCFA: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Champs pétroliers en mer</span>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Per diem International (FCFA / jour)</label>
              <input
                type="number"
                value={missions.perDiemInternationalFCFA}
                onChange={(e) =>
                  setMissions({ ...missions, perDiemInternationalFCFA: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Plafond d'avance de frais autorisé (%)</label>
              <input
                type="number"
                value={missions.maxAdvancePercentage}
                onChange={(e) =>
                  setMissions({ ...missions, maxAdvancePercentage: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Délai justification dépenses (jours après retour)</label>
              <input
                type="number"
                value={missions.justificationDeadlineDays}
                onChange={(e) =>
                  setMissions({ ...missions, justificationDeadlineDays: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Seuil validation DG obligatoire (FCFA)</label>
              <input
                type="number"
                value={missions.requireDgApprovalAboveFCFA}
                onChange={(e) =>
                  setMissions({ ...missions, requireDgApprovalAboveFCFA: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* 9. SITES */}
      {section === 'sites' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Paramètres Multi-Sites & Transferts Inter-Chantiers',
            <MapPin className="w-5 h-5 text-emerald-400" />,
            'Base principale, double visa de transfert et gestion des délais de transit fluvial/routier.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Identifiant de la Base Principale</label>
              <input
                type="text"
                value={sites.defaultBaseSiteId}
                onChange={(e) => setSites({ ...sites, defaultBaseSiteId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Ex: site-pnr-base (Pointe-Noire)</span>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Délai max de transit toléré (jours)</label>
              <input
                type="number"
                value={sites.maxTransitDays}
                onChange={(e) => setSites({ ...sites, maxTransitDays: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sites.requireDualApprovalForTransfer}
                  onChange={(e) =>
                    setSites({ ...sites, requireDualApprovalForTransfer: e.target.checked })
                  }
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Double visa obligatoire (Émetteur + Récepteur)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sites.quarantineRequiredForIncoming}
                  onChange={(e) =>
                    setSites({ ...sites, quarantineRequiredForIncoming: e.target.checked })
                  }
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Contrôle qualité &amp; quarantaine à l'arrivée</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 10. RAPPORTS & PV TECHNIQUES */}
      {section === 'reports' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Normes Techniques & PV d\'Épreuve Hydraulique',
            <ClipboardCheck className="w-5 h-5 text-amber-400" />,
            'Facteurs de surpression d\'épreuve selon CODAP/ASME, temps de maintien et visa technique.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Facteur de surpression épreuve hydraulique</label>
              <input
                type="number"
                step="0.05"
                value={reports.hydraulicTestPressureFactor}
                onChange={(e) =>
                  setReports({ ...reports, hydraulicTestPressureFactor: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Ex: 1.43x ou 1.50x la Pression de Service (PS)</span>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Durée maintien de pression (minutes)</label>
              <input
                type="number"
                value={reports.hydraulicTestHoldDurationMinutes}
                onChange={(e) =>
                  setReports({ ...reports, hydraulicTestHoldDurationMinutes: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Filigrane de certification par défaut</label>
              <input
                type="text"
                value={reports.defaultSafetyWatermark}
                onChange={(e) => setReports({ ...reports, defaultSafetyWatermark: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="sm:col-span-3 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                checked={reports.requireTechnicalDirectorVisa}
                onChange={(e) =>
                  setReports({ ...reports, requireTechnicalDirectorVisa: e.target.checked })
                }
                className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0"
              />
              <span className="text-slate-300">
                Visa obligatoire du Directeur Technique avant remise officielle du PV au client
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs font-bold text-white mb-2">Normes industrielles proposées</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {reports.defaultApplicableStandards.map((std, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs flex items-center gap-2"
                >
                  <span className="font-mono text-cyan-300">{std}</span>
                  <button
                    onClick={() =>
                      setReports({
                        ...reports,
                        defaultApplicableStandards: reports.defaultApplicableStandards.filter(
                          (_, idx) => idx !== i
                        ),
                      })
                    }
                    className="text-slate-500 hover:text-red-400 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Ex: API 650, ISO 15614-1..."
                value={newStandard}
                onChange={(e) => setNewStandard(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
              <button
                onClick={() => {
                  if (newStandard.trim()) {
                    setReports({
                      ...reports,
                      defaultApplicableStandards: [
                        ...reports.defaultApplicableStandards,
                        newStandard.trim(),
                      ],
                    });
                    setNewStandard('');
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. ACHATS & APPROVISIONNEMENT */}
      {section === 'purchases' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Paramètres Achats & Règle des 3 Devis',
            <ShoppingCart className="w-5 h-5 text-orange-400" />,
            'Circuits d\'approbation, seuils de validation hiérarchiques et tolérances de réception.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Seuil validation N1 Chef de Dépt (FCFA)</label>
              <input
                type="number"
                value={purchases.approvalTier1LimitFCFA}
                onChange={(e) =>
                  setPurchases({ ...purchases, approvalTier1LimitFCFA: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Seuil validation N2 Direction Générale (FCFA)</label>
              <input
                type="number"
                value={purchases.approvalTier2LimitFCFA}
                onChange={(e) =>
                  setPurchases({ ...purchases, approvalTier2LimitFCFA: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Règle des 3 devis exigée au-delà de (FCFA)</label>
              <input
                type="number"
                value={purchases.requireThreeQuotesAboveFCFA}
                onChange={(e) =>
                  setPurchases({
                    ...purchases,
                    requireThreeQuotesAboveFCFA: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Tolérance de quantité à réception (%)</label>
              <input
                type="number"
                value={purchases.deliveryQuantityTolerancePct}
                onChange={(e) =>
                  setPurchases({
                    ...purchases,
                    deliveryQuantityTolerancePct: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={purchases.autoGenerateGoodsReceipt}
                onChange={(e) =>
                  setPurchases({ ...purchases, autoGenerateGoodsReceipt: e.target.checked })
                }
                className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0"
              />
              <span className="text-slate-300">
                Génération automatique du Bon d'Entrée Magasin lors de la validation du BC
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 12. PARTENAIRES & SOUS-TRAITANTS */}
      {section === 'partners' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Paramètres Partenaires & Sous-Traitance Industrielle',
            <Handshake className="w-5 h-5 text-indigo-400" />,
            'Conditions d\'agrément fournisseurs, conformité fiscale et pièces de sécurité chantier.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Délai standard règlement sous-traitants (jours)</label>
              <input
                type="number"
                value={partners.defaultPaymentTermDays}
                onChange={(e) =>
                  setPartners({ ...partners, defaultPaymentTermDays: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Échelle d'évaluation qualité tiers (sur)</label>
              <input
                type="number"
                value={partners.supplierRatingScale}
                onChange={(e) =>
                  setPartners({ ...partners, supplierRatingScale: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={partners.requireTaxCertificateNif}
                onChange={(e) =>
                  setPartners({ ...partners, requireTaxCertificateNif: e.target.checked })
                }
                className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0"
              />
              <span className="text-slate-300">Attestation fiscale (NIF/RCCM) obligatoire pour référencement</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs font-bold text-white mb-2">Documents HSE obligatoires pour accès chantier</p>
            <div className="space-y-2 max-w-lg mb-3">
              {partners.mandatoryHseDocumentsForSubcontractors.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                >
                  <span className="text-slate-300 font-medium">{doc}</span>
                  <button
                    onClick={() =>
                      setPartners({
                        ...partners,
                        mandatoryHseDocumentsForSubcontractors:
                          partners.mandatoryHseDocumentsForSubcontractors.filter(
                            (_, i) => i !== idx
                          ),
                      })
                    }
                    className="text-slate-500 hover:text-red-400 font-bold"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Ex: Plan de Prévention des Risques..."
                value={newHseDoc}
                onChange={(e) => setNewHseDoc(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <button
                onClick={() => {
                  if (newHseDoc.trim()) {
                    setPartners({
                      ...partners,
                      mandatoryHseDocumentsForSubcontractors: [
                        ...partners.mandatoryHseDocumentsForSubcontractors,
                        newHseDoc.trim(),
                      ],
                    });
                    setNewHseDoc('');
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. PAIE & FISCALITÉ SOCIALE */}
      {section === 'payroll' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Barèmes de Paie & Cotisations Sociales CNSS',
            <Calculator className="w-5 h-5 text-emerald-400" />,
            'Taux CNSS en République du Congo, indemnités conventionnelles de transport et primes de panier/chantier.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Cotisation Salariale CNSS (%)</label>
              <input
                type="number"
                step="0.1"
                value={payroll.cnssEmployeeRatePct}
                onChange={(e) =>
                  setPayroll({ ...payroll, cnssEmployeeRatePct: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Taux légal Congo : 4.0%</span>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Cotisation Patronale CNSS (%)</label>
              <input
                type="number"
                step="0.1"
                value={payroll.cnssEmployerRatePct}
                onChange={(e) =>
                  setPayroll({ ...payroll, cnssEmployerRatePct: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Taux employeur : 16.0%</span>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Indemnité forfaitaire transport (FCFA/mois)</label>
              <input
                type="number"
                value={payroll.standardTransportAllowanceFCFA}
                onChange={(e) =>
                  setPayroll({
                    ...payroll,
                    standardTransportAllowanceFCFA: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Prime de chantier / jour offshore (FCFA)</label>
              <input
                type="number"
                value={payroll.standardSiteBonusFCFA}
                onChange={(e) =>
                  setPayroll({ ...payroll, standardSiteBonusFCFA: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Prime d'ancienneté (% par an d'ancienneté)</label>
              <input
                type="number"
                step="0.1"
                value={payroll.seniorityBonusRatePerYearPct}
                onChange={(e) =>
                  setPayroll({
                    ...payroll,
                    seniorityBonusRatePerYearPct: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Mode de règlement salaires privilégié</label>
              <select
                value={payroll.defaultPaymentMode}
                onChange={(e) => setPayroll({ ...payroll, defaultPaymentMode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              >
                <option value="Virement Bancaire (UBA / BGFI)">Virement Bancaire (UBA / BGFI)</option>
                <option value="Chèque de Banque">Chèque de Banque</option>
                <option value="Mobile Money (Airtel / MTN)">Mobile Money (Airtel / MTN)</option>
                <option value="Espèces / Caisse Paye">Espèces / Caisse Paye</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 14. IMPRESSION & CHARTE OFFICIELLE A4 */}
      {section === 'print' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Charte Graphique d\'Impression & Gabarit A4 Officiel',
            <Printer className="w-5 h-5 text-cyan-400" />,
            'En-tête officiel des documents PDF, mentions légales OHADA, filigranes et signataires autorisés.'
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Titre Principal En-Tête</label>
              <input
                type="text"
                value={print.companyHeaderTitle}
                onChange={(e) => setPrint({ ...print, companyHeaderTitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-semibold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Sous-Titre / Métiers Agréés</label>
              <input
                type="text"
                value={print.companySubtitle}
                onChange={(e) => setPrint({ ...print, companySubtitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Mention Légale OHADA Bas de Page</label>
              <input
                type="text"
                value={print.legalFormOhada}
                onChange={(e) => setPrint({ ...print, legalFormOhada: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Filigrane de Sécurité par Défaut</label>
              <input
                type="text"
                value={print.officialWatermark}
                onChange={(e) => setPrint({ ...print, officialWatermark: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Signataire Gauche (Opérations / QHSE)</label>
              <input
                type="text"
                value={print.defaultSignerLeft}
                onChange={(e) => setPrint({ ...print, defaultSignerLeft: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Signataire Droit (Direction Générale)</label>
              <input
                type="text"
                value={print.defaultSignerRight}
                onChange={(e) => setPrint({ ...print, defaultSignerRight: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Tampon Certification ASME / CODAP</label>
              <input
                type="text"
                value={print.stampAsmeIsoText}
                onChange={(e) => setPrint({ ...print, stampAsmeIsoText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={print.showQrCode}
                onChange={(e) => setPrint({ ...print, showQrCode: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0"
              />
              <span className="text-slate-300">Intégrer le QR Code de traçabilité numérique sur les documents A4</span>
            </div>
          </div>
        </div>
      )}

      {/* 15. NOTIFICATIONS */}
      {section === 'notifications' && (
        <div className="space-y-6">
          {renderSaveHeader(
            'Canaux & Règles d\'Alerte du Système',
            <Bell className="w-5 h-5 text-amber-400" />,
            'Configuration fine des notifications email, push et alertes internes par rôle.'
          )}

          <div className="space-y-3">
            {notifications.map((notif, index) => (
              <div
                key={notif.id}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{notif.name}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                        notif.priority === 'critical'
                          ? 'bg-red-950/80 text-red-300 border-red-800'
                          : notif.priority === 'high'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                          : 'bg-blue-950/80 text-blue-300 border-blue-800'
                      }`}
                    >
                      {notif.priority}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{notif.description}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notif.channels.internal}
                      onChange={(e) => {
                        const updated = [...notifications];
                        updated[index].channels.internal = e.target.checked;
                        setNotifications(updated);
                      }}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Interne</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notif.channels.email}
                      onChange={(e) => {
                        const updated = [...notifications];
                        updated[index].channels.email = e.target.checked;
                        setNotifications(updated);
                      }}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Email</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notif.channels.push}
                      onChange={(e) => {
                        const updated = [...notifications];
                        updated[index].channels.push = e.target.checked;
                        setNotifications(updated);
                      }}
                      className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Push</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
