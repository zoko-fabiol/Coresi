import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Settings,
  RefreshCw,
  HardHat,
  Briefcase,
  ShieldCheck,
  FileText,
  Search,
  ExternalLink,
  Info,
  Check,
  Zap,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  detectAllPendingReminders,
  sendIndividualReminder,
  runAutomatedRemindersCheck,
  PendingReminderItem,
} from '../../services/autoReminderEngine';
import {
  getEmailSettings,
  saveEmailSettings,
  dispatchRealEmail,
  EmailSettings,
} from '../../services/emailService';
import {
  getDailySentRegistry,
  pruneExpiredRegistryEntries,
  SentEmailEntry,
} from '../../services/emailRateLimiter';
import {
  generateTaskDeadlineEmail,
  generateCertificationExpiryEmail,
  generateInvoiceReminderEmail,
  generateDirectMessageEmail,
} from '../../services/emailTemplates';

export const EmailRemindersModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'test' | 'history' | 'settings'>('pending');
  const [reminders, setReminders] = useState<PendingReminderItem[]>([]);
  const [registry, setRegistry] = useState<Record<string, SentEmailEntry>>({});
  const [settings, setSettings] = useState<EmailSettings>(getEmailSettings());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Filtre pour la liste des échéances
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PROJECT_TASK' | 'CERTIFICATION_HSE' | 'INVOICE_CLIENT'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // États du banc de test
  const [testTemplate, setTestTemplate] = useState<'TASK' | 'CERT' | 'INVOICE' | 'MSG'>('TASK');
  const [testToEmail, setTestToEmail] = useState<string>('direction@coresi-cm.com');
  const [testToName, setTestToName] = useState<string>('M. le Directeur Général');
  const [testForceSend, setTestForceSend] = useState<boolean>(true);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  // Charger les données
  const refreshData = () => {
    setReminders(detectAllPendingReminders());
    setRegistry(getDailySentRegistry());
    setSettings(getEmailSettings());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Déclencher le scan automatique
  const handleRunManualScan = async () => {
    setIsScanning(true);
    try {
      const result = await runAutomatedRemindersCheck();
      refreshData();
      showToast(
        `Scan terminé : ${result.checkedCount} échéances analysées, ${result.sentCount} e-mails expédiés, ${result.skippedCount} doublons ignorés.`,
        'success'
      );
    } catch (err: any) {
      showToast(`Erreur lors du scan : ${err.message}`, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Envoi individuel
  const handleSendReminder = async (item: PendingReminderItem) => {
    setSendingId(item.id);
    try {
      const res = await sendIndividualReminder(item);
      refreshData();
      if (res.skippedDuplicate) {
        showToast(`Rappel déjà envoyé aujourd'hui pour ce dossier (Anti-Doublon actif).`, 'info');
      } else if (res.success) {
        showToast(`E-mail de rappel envoyé avec succès via [${res.provider}] !`, 'success');
      } else {
        showToast(`Erreur d'envoi : ${res.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`Erreur : ${err.message}`, 'error');
    } finally {
      setSendingId(null);
    }
  };

  // Sauvegarde des paramètres
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailSettings(settings);
    showToast('Paramètres de passerelle e-mail sauvegardés avec succès.', 'success');
  };

  // Aperçu dynamique du modèle test
  const testEmailPreview = useMemo(() => {
    if (testTemplate === 'TASK') {
      return generateTaskDeadlineEmail({
        toName: testToName,
        toEmail: testToEmail,
        projectName: 'Passerelle Métallique Kribi',
        taskTitle: 'Contrôle par Ressuage des Soudures Principales',
        dueDate: '2026-09-30',
        daysRemaining: 3,
        priority: 'Haute',
      });
    } else if (testTemplate === 'CERT') {
      return generateCertificationExpiryEmail({
        toName: testToName,
        toEmail: testToEmail,
        employeeName: 'Paul BIKELE',
        matricule: 'COR-02',
        certificationName: 'Habilitation Travaux en Hauteur & Échafaudage',
        expiryDate: '2026-09-30',
        daysRemaining: 3,
      });
    } else if (testTemplate === 'INVOICE') {
      return generateInvoiceReminderEmail({
        toName: testToName,
        toEmail: testToEmail,
        clientName: 'SNH Cameroun',
        invoiceNumber: 'FAC-2026-0042',
        amountFcfa: 18500000,
        dueDate: '2026-09-28',
        projectName: 'Cuves de Stockage Pétrolier',
      });
    } else {
      return generateDirectMessageEmail({
        toName: testToName,
        toEmail: testToEmail,
        senderName: 'Fabrice TCHOUENKAM',
        senderRole: 'Directeur Général',
        messagePreview: 'Veuillez vérifier les plans de détail d\'ossature avant la réunion technique de demain 10h.',
      });
    }
  }, [testTemplate, testToEmail, testToName]);

  // Envoi de l'email de test
  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      const res = await dispatchRealEmail({
        toEmail: testToEmail,
        toName: testToName,
        subject: testEmailPreview.subject,
        htmlContent: testEmailPreview.htmlContent,
        entityKey: `TEST_${testTemplate}`,
        forceResend: testForceSend,
      });
      refreshData();
      if (res.success) {
        showToast(`E-mail de test expédié vers ${testToEmail} via [${res.provider}] !`, 'success');
      } else {
        showToast(`Échec du test : ${res.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`Erreur d'envoi test : ${err.message}`, 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Filtrage des échéances
  const filteredReminders = useMemo(() => {
    return reminders.filter((item) => {
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.recipientName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reminders, categoryFilter, searchTerm]);

  // Statistiques du tableau de bord
  const sentTodayCount = Object.keys(registry).length;
  const overdueCount = reminders.filter((r) => r.daysRemaining < 0).length;
  const urgentCount = reminders.filter((r) => r.daysRemaining >= 0 && r.daysRemaining <= 2).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast de notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-white transition-all transform animate-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-[#3B7A2C]'
              : toastMessage.type === 'error'
              ? 'bg-red-600'
              : 'bg-slate-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : toastMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Info className="w-4 h-4" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & KPI Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-[#4FA33B] flex items-center justify-center font-bold">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Rappels & E-mails Automatisés
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Supervision proactive des échéances, relances chantiers, certifications HSE et situations clients
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRunManualScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3B7A2C] hover:bg-[#2D6020] text-white text-xs font-bold shadow-md shadow-[#3B7A2C]/20 transition-transform active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scan en cours...' : 'Exécuter le scan automatique'}</span>
          </button>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Échéances surveillées</span>
            <Clock className="w-4 h-4 text-[#3B7A2C]" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{reminders.length}</p>
          <span className="text-[10px] text-slate-400">Tâches, HSE & Facturation</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Alertes critiques (≤ 2j)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500">{urgentCount}</p>
          <span className="text-[10px] text-slate-400">Échéance imminente</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Dépassées / Retards</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-500">{overdueCount}</p>
          <span className="text-[10px] text-slate-400">Action immédiate</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Expédiés aujourd'hui</span>
            <Zap className="w-4 h-4 text-[#3B7A2C]" />
          </div>
          <p className="text-2xl font-black text-[#3B7A2C] dark:text-[#4FA33B]">{sentTodayCount}</p>
          <span className="text-[10px] text-slate-400">Passerelle : {settings.provider}</span>
        </div>
      </div>

      {/* Onglets Principaux */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-[#3B7A2C] text-[#3B7A2C] dark:text-[#4FA33B]'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Échéances Détectées ({reminders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'test'
              ? 'border-[#3B7A2C] text-[#3B7A2C] dark:text-[#4FA33B]'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Banc de Test & Modèles HTML</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'history'
              ? 'border-[#3B7A2C] text-[#3B7A2C] dark:text-[#4FA33B]'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Registre Anti-Doublon & Historique ({sentTodayCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-[#3B7A2C] text-[#3B7A2C] dark:text-[#4FA33B]'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuration & Passerelles</span>
        </button>
      </div>

      {/* =========================================================================
          CONTENU ONGLET 1 : ÉCHÉANCES DÉTECTÉES
      ========================================================================= */}
      {activeTab === 'pending' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-4 p-5">
          {/* Filtres & Recherche */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  categoryFilter === 'ALL'
                    ? 'bg-[#3B7A2C] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Toutes ({reminders.length})
              </button>
              <button
                onClick={() => setCategoryFilter('PROJECT_TASK')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  categoryFilter === 'PROJECT_TASK'
                    ? 'bg-[#3B7A2C] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Tâches Chantiers
              </button>
              <button
                onClick={() => setCategoryFilter('CERTIFICATION_HSE')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  categoryFilter === 'CERTIFICATION_HSE'
                    ? 'bg-[#3B7A2C] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Habilitations HSE
              </button>
              <button
                onClick={() => setCategoryFilter('INVOICE_CLIENT')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  categoryFilter === 'INVOICE_CLIENT'
                    ? 'bg-[#3B7A2C] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Factures Clients
              </button>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrer par titre, chantier..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B7A2C]"
              />
            </div>
          </div>

          {/* Tableau des échéances */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Dossier / Échéance</th>
                  <th className="p-3">Date Butoir</th>
                  <th className="p-3">Décompte</th>
                  <th className="p-3">Destinataire</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReminders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Aucune échéance ne requiert d'attention immédiate.
                    </td>
                  </tr>
                ) : (
                  filteredReminders.map((item) => {
                    const isSending = sendingId === item.id;
                    const isOverdue = item.daysRemaining < 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          {item.category === 'PROJECT_TASK' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                              <HardHat className="w-3 h-3" /> Chantier
                            </span>
                          )}
                          {item.category === 'CERTIFICATION_HSE' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3" /> Habilitation HSE
                            </span>
                          )}
                          {item.category === 'INVOICE_CLIENT' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              <Briefcase className="w-3 h-3" /> Facturation
                            </span>
                          )}
                        </td>

                        <td className="p-3 max-w-[280px]">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.subtitle}</p>
                        </td>

                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                          {item.dueDate}
                        </td>

                        <td className="p-3">
                          {isOverdue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white">
                              Dépassé (+{Math.abs(item.daysRemaining)} j)
                            </span>
                          ) : item.daysRemaining === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                              Aujourd'hui
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.daysRemaining <= 2
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                                  : 'bg-[#3B7A2C]/15 text-[#3B7A2C] dark:text-[#4FA33B]'
                              }`}
                            >
                              J-{item.daysRemaining}
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <p className="font-medium text-slate-900 dark:text-white">{item.recipientName}</p>
                          <p className="text-[10px] text-slate-400">{item.recipientEmail}</p>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleSendReminder(item)}
                            disabled={isSending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B7A2C]/10 hover:bg-[#3B7A2C] text-[#3B7A2C] hover:text-white dark:text-[#4FA33B] dark:hover:text-white font-bold transition-all text-xs active:scale-95 disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isSending ? 'Envoi...' : 'Envoyer Rappel'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTENU ONGLET 2 : BANC DE TEST & APERÇU HTML
      ========================================================================= */}
      {activeTab === 'test' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panneau de configuration du test */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#3B7A2C]" />
              Paramètres du Modèle de Test
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Choisir un modèle à tester
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestTemplate('TASK')}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                    testTemplate === 'TASK'
                      ? 'border-[#3B7A2C] bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-[#4FA33B]'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Rappel Tâche Projet
                </button>
                <button
                  type="button"
                  onClick={() => setTestTemplate('CERT')}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                    testTemplate === 'CERT'
                      ? 'border-[#3B7A2C] bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-[#4FA33B]'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Alerte Habilitation HSE
                </button>
                <button
                  type="button"
                  onClick={() => setTestTemplate('INVOICE')}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                    testTemplate === 'INVOICE'
                      ? 'border-[#3B7A2C] bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-[#4FA33B]'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Relance Facture Client
                </button>
                <button
                  type="button"
                  onClick={() => setTestTemplate('MSG')}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                    testTemplate === 'MSG'
                      ? 'border-[#3B7A2C] bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-[#4FA33B]'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Message Collaborateur
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail destinataire de test
              </label>
              <input
                type="email"
                value={testToEmail}
                onChange={(e) => setTestToEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nom complet du destinataire
              </label>
              <input
                type="text"
                value={testToName}
                onChange={(e) => setTestToName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="forceSendCheckbox"
                checked={testForceSend}
                onChange={(e) => setTestForceSend(e.target.checked)}
                className="rounded border-slate-300 text-[#3B7A2C] focus:ring-[#3B7A2C]"
              />
              <label htmlFor="forceSendCheckbox" className="text-xs text-slate-600 dark:text-slate-400">
                Forcer l'envoi immédiat (contourner le filtre anti-doublon pour ce test)
              </label>
            </div>

            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={isSendingTest}
              className="w-full py-2.5 rounded-xl bg-[#3B7A2C] hover:bg-[#2D6020] text-white text-xs font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingTest ? 'Transmission en cours...' : "Expédier l'e-mail de test"}</span>
            </button>
          </div>

          {/* Prévisualisation Réelle HTML */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Aperçu HTML Responsive en direct
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Sujet : {testEmailPreview.subject}
              </span>
            </div>

            <div className="flex-1 min-h-[460px] bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <iframe
                title="Preview"
                srcDoc={testEmailPreview.htmlContent}
                className="w-full h-full min-h-[460px] border-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTENU ONGLET 3 : HISTORIQUE & ANTI-DOUBLON
      ========================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Registre Anti-Doublon & Historique Journalier
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tous les e-mails envoyés aujourd'hui sont enregistrés afin d'éviter le sur-sollicitage des clients et équipes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                pruneExpiredRegistryEntries();
                refreshData();
                showToast('Registre nettoyé avec succès.', 'info');
              }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
            >
              Nettoyer les archives &gt; 48h
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Horodatage</th>
                  <th className="p-3">Destinataire</th>
                  <th className="p-3">Sujet de l'E-mail</th>
                  <th className="p-3">Fournisseur</th>
                  <th className="p-3">Empreinte Unique</th>
                  <th className="p-3 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.values(registry).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Aucun e-mail n'a encore été envoyé aujourd'hui.
                    </td>
                  </tr>
                ) : (
                  Object.values(registry).map((entry) => (
                    <tr key={entry.fingerprint} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {new Date(entry.sentAt).toLocaleTimeString('fr-FR')}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        {entry.toEmail}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 max-w-[260px] truncate">
                        {entry.subject}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-[#4FA33B]">
                          {entry.provider}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-400 max-w-[200px] truncate">
                        {entry.fingerprint}
                      </td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3 h-3" /> Transmis
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTENU ONGLET 4 : CONFIGURATION DES PASSERELLES
      ========================================================================= */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Passerelle d'Envoi & Fournisseur SMTP / API
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configurez le canal utilisé pour router les e-mails automatiques de CORESI SARL.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Fournisseur actif
              </label>
              <select
                value={settings.provider}
                onChange={(e) => setSettings({ ...settings, provider: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="SANDBOX">Bac à sable / Simulation réaliste (Recommandé en local)</option>
                <option value="EMAILJS">EmailJS (Envoi direct navigateur sans serveur)</option>
                <option value="RESEND">Resend API (Clé d'API)</option>
                <option value="BREVO">Brevo (Sendinblue API)</option>
                <option value="WEBHOOK">Webhook Cloud personnalisé</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nom d'expéditeur affiché
              </label>
              <input
                type="text"
                value={settings.senderName}
                onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Adresse e-mail d'expédition
              </label>
              <input
                type="email"
                value={settings.senderEmail}
                onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Adresse de réponse (Reply-To)
              </label>
              <input
                type="email"
                value={settings.replyTo}
                onChange={(e) => setSettings({ ...settings, replyTo: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Paramètres Spécifiques selon fournisseur */}
          {settings.provider === 'EMAILJS' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Identifiants EmailJS</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Service ID (ex: service_xyz)"
                  value={settings.emailjsServiceId || ''}
                  onChange={(e) => setSettings({ ...settings, emailjsServiceId: e.target.value })}
                  className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
                <input
                  type="text"
                  placeholder="Template ID (ex: template_abc)"
                  value={settings.emailjsTemplateId || ''}
                  onChange={(e) => setSettings({ ...settings, emailjsTemplateId: e.target.value })}
                  className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
                <input
                  type="text"
                  placeholder="Public Key (ex: user_123)"
                  value={settings.emailjsPublicKey || ''}
                  onChange={(e) => setSettings({ ...settings, emailjsPublicKey: e.target.value })}
                  className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          )}

          {settings.provider === 'RESEND' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Clé API Resend</h4>
              <input
                type="password"
                placeholder="re_1234567890..."
                value={settings.resendApiKey || ''}
                onChange={(e) => setSettings({ ...settings, resendApiKey: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
          )}

          {settings.provider === 'BREVO' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Clé API Brevo (Sendinblue)</h4>
              <input
                type="password"
                placeholder="xkeysib-..."
                value={settings.brevoApiKey || ''}
                onChange={(e) => setSettings({ ...settings, brevoApiKey: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
          )}

          {/* Options de routage & automatisation */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoRemindersToggle"
                checked={settings.autoRemindersEnabled}
                onChange={(e) => setSettings({ ...settings, autoRemindersEnabled: e.target.checked })}
                className="rounded border-slate-300 text-[#3B7A2C] focus:ring-[#3B7A2C]"
              />
              <label htmlFor="autoRemindersToggle" className="text-xs font-bold text-slate-900 dark:text-white">
                Activer les scans et relances automatiques en arrière-plan
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="copyDGToggle"
                checked={settings.notificationCopyDG}
                onChange={(e) => setSettings({ ...settings, notificationCopyDG: e.target.checked })}
                className="rounded border-slate-300 text-[#3B7A2C] focus:ring-[#3B7A2C]"
              />
              <label htmlFor="copyDGToggle" className="text-xs font-bold text-slate-900 dark:text-white">
                Transmettre une copie invisible (BCC) des alertes critiques à la Direction Générale
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#3B7A2C] hover:bg-[#2D6020] text-white text-xs font-bold shadow-md transition-transform active:scale-95"
            >
              Enregistrer les Paramètres
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EmailRemindersModule;
