import React, { useState } from 'react';
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
} from 'lucide-react';
import { AdminConfigService } from '../../services/adminConfigService';

interface SpecializedSettingsProps {
  section: 'finance' | 'ged' | 'scanner_ocr' | 'projects' | 'stock' | 'hr' | 'notifications';
  onSaved: (msg: string) => void;
}

export const SpecializedSettings: React.FC<SpecializedSettingsProps> = ({ section, onSaved }) => {
  // Finance settings state
  const [currency, setCurrency] = useState<string>('FCFA');
  const [vatRate, setVatRate] = useState<number>(18);
  const [applyVat, setApplyVat] = useState<boolean>(true);
  const [cashLimit, setCashLimit] = useState<number>(2500000);
  const [dueDays, setDueDays] = useState<number>(30);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([
    'Virement Bancaire',
    'Chèque',
    'Espèces / Caisse',
    'Mobile Money (Airtel/MTN)',
  ]);
  const [newPayMethod, setNewPayMethod] = useState<string>('');

  // GED settings state
  const [retentionYears, setRetentionYears] = useState<number>(10);
  const [maxUploadMb, setMaxUploadMb] = useState<number>(25);
  const [enableVersioning, setEnableVersioning] = useState<boolean>(true);
  const [enableSignature, setEnableSignature] = useState<boolean>(true);
  const [mandatoryDocs, setMandatoryDocs] = useState<string[]>([
    'Bon de livraison émargé',
    'PV d\'épreuve hydraulique',
    'Attestation de ressuage COFREND',
    'Licence de soudage 6G à jour',
  ]);
  const [newMandatoryDoc, setNewMandatoryDoc] = useState<string>('');

  // Scanner & OCR state
  const [scannerActive, setScannerActive] = useState<boolean>(true);
  const [ocrActive, setOcrActive] = useState<boolean>(true);
  const [autoDetect, setAutoDetect] = useState<boolean>(true);
  const [perspectiveCorrect, setPerspectiveCorrect] = useState<boolean>(true);
  const [ocrLang, setOcrLang] = useState<'fra' | 'fra+eng'>('fra');
  const [pdfQuality, setPdfQuality] = useState<'medium' | 'high'>('high');
  const [requireHumanVal, setRequireHumanVal] = useState<boolean>(true);

  // Projects state
  const [budgetWarnPct, setBudgetWarnPct] = useState<number>(80);
  const [budgetCritPct, setBudgetCritPct] = useState<number>(95);
  const [reportFreqDays, setReportFreqDays] = useState<number>(7);
  const [requireSafetyBrief, setRequireSafetyBrief] = useState<boolean>(true);

  // Stock state
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [multiWarehouse, setMultiWarehouse] = useState<boolean>(true);
  const [trackSerial, setTrackSerial] = useState<boolean>(true);
  const [requireReturnReceipt, setRequireReturnReceipt] = useState<boolean>(true);

  // HR state
  const [certAlertDays, setCertAlertDays] = useState<number>(30);
  const [contractTypes, setContractTypes] = useState<string[]>([
    'CDI (Durée Indéterminée)',
    'CDD (Durée Déterminée)',
    'Prestation Chantier',
    'Stage Professionnel',
  ]);
  const [departments, setDepartments] = useState<string[]>([
    'Direction Générale',
    'Chaudronnerie & Tuyauterie',
    'Ingénierie & Études',
    'Comptabilité & Finances',
    'Ressources Humaines',
    'Logistique & Magasin',
    'HSE & Sécurité',
  ]);

  // Notifications state
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [pushAlerts, setPushAlerts] = useState<boolean>(true);
  const [internalAlerts, setInternalAlerts] = useState<boolean>(true);
  const [alertBudgetThreshold, setAlertBudgetThreshold] = useState<number>(85);

  const handleSave = () => {
    onSaved(`Paramètres "${section.toUpperCase()}" enregistrés avec succès.`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* 1. FINANCE */}
      {section === 'finance' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <span>Paramètres Financiers &amp; Facturation</span>
            </h3>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer Finance</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Devise du système</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Taux de TVA (%)</label>
              <input
                type="number"
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Plafond espèces / Caisse (FCFA)</label>
              <input
                type="number"
                value={cashLimit}
                onChange={(e) => setCashLimit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Délai d'échéance facture standard (jours)</label>
              <input
                type="number"
                value={dueDays}
                onChange={(e) => setDueDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={applyVat}
                onChange={(e) => setApplyVat(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-600 focus:ring-0"
              />
              <span className="text-slate-300">Appliquer la TVA automatiquement sur les devis</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs font-bold text-white mb-2">Modes de règlement autorisés</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {paymentMethods.map((m, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs flex items-center gap-2"
                >
                  <span>{m}</span>
                  <button
                    onClick={() => setPaymentMethods(paymentMethods.filter((_, idx) => idx !== i))}
                    className="text-slate-500 hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Nouveau mode de paiement..."
                value={newPayMethod}
                onChange={(e) => setNewPayMethod(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <button
                onClick={() => {
                  if (newPayMethod.trim()) {
                    setPaymentMethods([...paymentMethods, newPayMethod.trim()]);
                    setNewPayMethod('');
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. GED */}
      {section === 'ged' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              <span>Paramètres GED &amp; Rétention Documentaire</span>
            </h3>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer GED</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Durée légale de conservation (années)</label>
              <input
                type="number"
                value={retentionYears}
                onChange={(e) => setRetentionYears(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Taille max fichier uploadé (Mo)</label>
              <input
                type="number"
                value={maxUploadMb}
                onChange={(e) => setMaxUploadMb(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableVersioning}
                  onChange={(e) => setEnableVersioning(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Activer le versioning des révisions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSignature}
                  onChange={(e) => setEnableSignature(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Activer le visa électronique de conformité</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs font-bold text-white mb-2">Documents obligatoires pour clôture de chantier</p>
            <div className="space-y-2 max-w-lg mb-3">
              {mandatoryDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                >
                  <span className="text-slate-300 font-medium">{doc}</span>
                  <button
                    onClick={() => setMandatoryDocs(mandatoryDocs.filter((_, i) => i !== idx))}
                    className="text-slate-500 hover:text-red-400"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Ex: Rapport ressuage..."
                value={newMandatoryDoc}
                onChange={(e) => setNewMandatoryDoc(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              <button
                onClick={() => {
                  if (newMandatoryDoc.trim()) {
                    setMandatoryDocs([...mandatoryDocs, newMandatoryDoc.trim()]);
                    setNewMandatoryDoc('');
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SCANNER & OCR */}
      {section === 'scanner_ocr' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Paramètres du Scanner Mobile &amp; Moteur OCR</span>
            </h3>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer Scanner/OCR</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <p className="font-bold text-white">Traitements d'Image en Temps Réel</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDetect}
                  onChange={(e) => setAutoDetect(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Détection automatique des contours du document</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={perspectiveCorrect}
                  onChange={(e) => setPerspectiveCorrect(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Redressement automatique de la perspective</span>
              </label>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <p className="font-bold text-white">Reconnaissance Optique des Caractères (OCR)</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ocrActive}
                  onChange={(e) => setOcrActive(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Activer le module d'extraction automatique</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireHumanVal}
                  onChange={(e) => setRequireHumanVal(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Exiger validation humaine des montants extraits</span>
              </label>
              <div>
                <label className="text-slate-400 block mb-1">Dictionnaire OCR</label>
                <select
                  value={ocrLang}
                  onChange={(e) => setOcrLang(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="fra">Français (Industriel &amp; Facturation)</option>
                  <option value="fra+eng">Bilingue Français + Anglais (Normes ASME)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PROJETS */}
      {section === 'projects' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-400" />
              <span>Paramètres des Projets &amp; Alertes Chantiers</span>
            </h3>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer Projets</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Seuil alerte préventive budget (%)</label>
              <input
                type="number"
                value={budgetWarnPct}
                onChange={(e) => setBudgetWarnPct(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Seuil alerte critique budget (%)</label>
              <input
                type="number"
                value={budgetCritPct}
                onChange={(e) => setBudgetCritPct(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Fréquence rapports d'avancement (jours)</label>
              <input
                type="number"
                value={reportFreqDays}
                onChange={(e) => setReportFreqDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. STOCK */}
      {section === 'stock' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Paramètres des Stocks &amp; Outillages</span>
            </h3>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer Stock</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Seuil d'alerte stock minimum standard</label>
              <input
                type="number"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={multiWarehouse}
                  onChange={(e) => setMultiWarehouse(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Activer le multi-entrepôt (Base + Conteneurs de chantier)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackSerial}
                  onChange={(e) => setTrackSerial(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Traçabilité individuelle par numéro de série</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 6. RH */}
      {section === 'hr' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Paramètres RH &amp; Licences de Soudage</span>
            </h3>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer RH</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">
                Alerte péremption qualification soudeur (jours avant échéance)
              </label>
              <input
                type="number"
                value={certAlertDays}
                onChange={(e) => setCertAlertDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. NOTIFICATIONS */}
      {section === 'notifications' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Canaux &amp; Règles de Notification</span>
            </h3>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer Notifications</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <p className="font-bold text-white">Canal Interne ERP</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={internalAlerts}
                  onChange={(e) => setInternalAlerts(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Bannières et compteurs d'alerte</span>
              </label>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <p className="font-bold text-white">Notifications Email</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Emails récapitulatifs quotidiens</span>
              </label>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <p className="font-bold text-white">Notifications Push Mobiles</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushAlerts}
                  onChange={(e) => setPushAlerts(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-600"
                />
                <span className="text-slate-300">Alertes critiques instantanées</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
