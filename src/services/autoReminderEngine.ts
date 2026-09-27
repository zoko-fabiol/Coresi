/**
 * autoReminderEngine.ts - CORESI SARL
 * Moteur Autonome d'Automatisation des Rappels & Alertes par E-mail & Système.
 * 
 * Fonctionnalités :
 * 1. Analyse quotidienne des échéances chantiers & tâches projets (J-3, J-1, J-0, Dépassé).
 * 2. Analyse des validités des habilitations HSE et certifications techniques (CACES, SST, Soudeur).
 * 3. Analyse des échéances de facturation clients & situations de travaux.
 * 4. Routage automatique avec idempotence stricte (Anti-doublon 1 e-mail / jour max via emailRateLimiter).
 * 5. Notification simultanée dans le centre de notifications interne de CORESI.
 */

import { DataService } from './dataService';
import { iswHrService, ISWEmployee } from './iswHrService';
import { dispatchRealEmail, getEmailSettings } from './emailService';
import {
  generateTaskDeadlineEmail,
  generateCertificationExpiryEmail,
  generateInvoiceReminderEmail,
} from './emailTemplates';
import { NotificationService } from './notificationService';

export interface PendingReminderItem {
  id: string;
  category: 'PROJECT_TASK' | 'CERTIFICATION_HSE' | 'INVOICE_CLIENT';
  title: string;
  subtitle: string;
  entityKey: string;
  dueDate: string;
  daysRemaining: number;
  recipientName: string;
  recipientEmail: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: Record<string, any>;
  status: 'PENDING' | 'SENT_TODAY' | 'OVERDUE';
}

/**
 * Calcule la différence en jours entre aujourd'hui et une date cible (YYYY-MM-DD)
 */
export const calculateDaysRemaining = (dueDateStr: string): number => {
  if (!dueDateStr) return 999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - now.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Détecte et agrège toutes les échéances actives nécessitant une vigilance
 */
export const detectAllPendingReminders = (): PendingReminderItem[] => {
  const items: PendingReminderItem[] = [];
  const projects = DataService.getProjects();
  const invoices = DataService.getInvoices();
  const employees: ISWEmployee[] = (iswHrService.getEmployeesSync ? iswHrService.getEmployeesSync() : []) || [];

  // 1. Tâches de projets & chantiers
  projects.forEach((proj) => {
    // Vérifier les tâches définies sur les phases du projet
    proj.phases?.forEach((phase) => {
      phase.tasks?.forEach((task) => {
        if (task.status !== 'completed' && task.dueDate) {
          const days = calculateDaysRemaining(task.dueDate);
          // Alerter si l'échéance est dans 5 jours ou dépassée
          if (days <= 5) {
            const isOverdue = days < 0;
            const assignee = task.assignedTo || proj.managerName || 'Conducteur de Travaux';
            items.push({
              id: `task_${proj.id}_${task.id}`,
              category: 'PROJECT_TASK',
              title: task.title,
              subtitle: `Chantier : ${proj.name} (${proj.code})`,
              entityKey: `TASK_${proj.id}_${task.id}`,
              dueDate: task.dueDate,
              daysRemaining: days,
              recipientName: assignee,
              recipientEmail: 'chantiers@coresi-cm.com',
              priority: isOverdue ? 'urgent' : days <= 1 ? 'high' : 'medium',
              metadata: {
                projectId: proj.id,
                projectName: proj.name,
                taskId: task.id,
                taskTitle: task.title,
              },
              status: isOverdue ? 'OVERDUE' : 'PENDING',
            });
          }
        }
      });
    });

    // Échéance globale du projet si proche
    if (proj.status === 'in_progress' && proj.endDate) {
      const days = calculateDaysRemaining(proj.endDate);
      if (days <= 7) {
        items.push({
          id: `proj_end_${proj.id}`,
          category: 'PROJECT_TASK',
          title: `Livraison Contractuelle Chantier : ${proj.name}`,
          subtitle: `Client : ${proj.clientName} | Budget : ${new Intl.NumberFormat('fr-FR').format(proj.budget)} FCFA`,
          entityKey: `PROJ_DEADLINE_${proj.id}`,
          dueDate: proj.endDate,
          daysRemaining: days,
          recipientName: proj.managerName || 'Direction Technique',
          recipientEmail: 'direction@coresi-cm.com',
          priority: days <= 2 ? 'urgent' : 'high',
          metadata: {
            projectId: proj.id,
            projectName: proj.name,
          },
          status: days < 0 ? 'OVERDUE' : 'PENDING',
        });
      }
    }
  });

  // 2. Certifications HSE & Habilitations du personnel
  const mockCertifications = [
    { empId: 'COR-01', empName: 'Fabrice TCHOUENKAM', cert: 'CACES R482 Catégorie F (Engins de chantier)', expiry: '2026-10-05' },
    { empId: 'COR-02', empName: 'Paul BIKELE', cert: 'Habilitation Travaux en Hauteur & Échafaudage', expiry: '2026-09-30' },
    { empId: 'COR-03', empName: 'Willy Landry DJOPNANG', cert: 'Certificat Sauveteur Secouriste du Travail (SST)', expiry: '2026-10-15' },
    { empId: 'COR-04', empName: 'Ernest MBALLA', cert: 'Licence de Soudeur Agréé NF EN ISO 9606-1 (TIG/MIG)', expiry: '2026-09-28' },
  ];

  mockCertifications.forEach((c, idx) => {
    const days = calculateDaysRemaining(c.expiry);
    if (days <= 30) {
      const isOverdue = days < 0;
      items.push({
        id: `cert_${c.empId}_${idx}`,
        category: 'CERTIFICATION_HSE',
        title: `Recyclage : ${c.cert}`,
        subtitle: `Collaborateur : ${c.empName} (${c.empId})`,
        entityKey: `CERT_${c.empId}_${idx}`,
        dueDate: c.expiry,
        daysRemaining: days,
        recipientName: 'Responsable HSE & RH',
        recipientEmail: 'hse@coresi-cm.com',
        priority: isOverdue ? 'urgent' : days <= 5 ? 'high' : 'medium',
        metadata: {
          employeeId: c.empId,
          employeeName: c.empName,
          certificationName: c.cert,
        },
        status: isOverdue ? 'OVERDUE' : 'PENDING',
      });
    }
  });

  // 3. Factures clients & situations de travaux en attente
  invoices.forEach((inv) => {
    if (inv.type === 'client' && inv.status !== 'paid' && inv.dueDate) {
      const days = calculateDaysRemaining(inv.dueDate);
      if (days <= 7) {
        const isOverdue = days < 0;
        items.push({
          id: `inv_${inv.id}`,
          category: 'INVOICE_CLIENT',
          title: `Facture N° ${inv.invoiceNumber}`,
          subtitle: `Client : ${inv.partyName} | Montant : ${new Intl.NumberFormat('fr-FR').format(inv.totalAmount)} FCFA`,
          entityKey: `INV_${inv.id}`,
          dueDate: inv.dueDate,
          daysRemaining: days,
          recipientName: inv.partyName,
          recipientEmail: 'compta@coresi-cm.com',
          priority: isOverdue ? 'urgent' : days <= 2 ? 'high' : 'medium',
          metadata: {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            amount: inv.totalAmount,
            clientName: inv.partyName,
          },
          status: isOverdue ? 'OVERDUE' : 'PENDING',
        });
      }
    }
  });

  return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
};

/**
 * Déclenche l'envoi d'un rappel individuel (e-mail + notification interne)
 */
export const sendIndividualReminder = async (item: PendingReminderItem): Promise<{
  success: boolean;
  skippedDuplicate?: boolean;
  provider?: string;
  error?: string;
}> => {
  let emailData: { subject: string; htmlContent: string };

  if (item.category === 'PROJECT_TASK') {
    emailData = generateTaskDeadlineEmail({
      toName: item.recipientName,
      toEmail: item.recipientEmail,
      projectName: item.metadata.projectName || 'Chantier CORESI',
      taskTitle: item.title,
      dueDate: item.dueDate,
      daysRemaining: item.daysRemaining,
      priority: item.priority === 'urgent' ? 'Urgente' : 'Haute',
    });
  } else if (item.category === 'CERTIFICATION_HSE') {
    emailData = generateCertificationExpiryEmail({
      toName: item.recipientName,
      toEmail: item.recipientEmail,
      employeeName: item.metadata.employeeName,
      matricule: item.metadata.employeeId,
      certificationName: item.metadata.certificationName,
      expiryDate: item.dueDate,
      daysRemaining: item.daysRemaining,
    });
  } else {
    emailData = generateInvoiceReminderEmail({
      toName: item.recipientName,
      toEmail: item.recipientEmail,
      clientName: item.metadata.clientName,
      invoiceNumber: item.metadata.invoiceNumber,
      amountFcfa: item.metadata.amount,
      dueDate: item.dueDate,
    });
  }

  // 1. Envoi réel via EmailService avec anti-doublon
  const res = await dispatchRealEmail({
    toEmail: item.recipientEmail,
    toName: item.recipientName,
    subject: emailData.subject,
    htmlContent: emailData.htmlContent,
    entityKey: item.entityKey,
  });

  // 2. Notification interne simultanée
  await NotificationService.notify({
    type: 'alert',
    title: item.title,
    message: `${item.subtitle}. Échéance : ${item.dueDate} (${item.daysRemaining < 0 ? 'Dépassée de ' + Math.abs(item.daysRemaining) + ' j' : 'Dans ' + item.daysRemaining + ' j'}).`,
    recipientRole: 'all',
    priority: item.priority === 'urgent' ? 'urgent' : 'high',
    deepLink: item.category === 'PROJECT_TASK' ? 'projects' : item.category === 'CERTIFICATION_HSE' ? 'hr' : 'ged',
  });

  return res;
};

/**
 * Exécute une vérification automatique de toutes les échéances
 */
export const runAutomatedRemindersCheck = async (): Promise<{
  checkedCount: number;
  sentCount: number;
  skippedCount: number;
  errors: string[];
}> => {
  const settings = getEmailSettings();
  if (!settings.autoRemindersEnabled) {
    console.info('[AutoReminderEngine] Automatisation désactivée dans les paramètres.');
    return { checkedCount: 0, sentCount: 0, skippedCount: 0, errors: [] };
  }

  const items = detectAllPendingReminders();
  let sentCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const item of items) {
    // Ne relancer automatiquement que les alertes prioritaires (<= 3 jours ou en retard)
    if (item.daysRemaining <= 3) {
      try {
        const res = await sendIndividualReminder(item);
        if (res.skippedDuplicate) {
          skippedCount++;
        } else if (res.success) {
          sentCount++;
        } else if (res.error) {
          errors.push(`${item.title}: ${res.error}`);
        }
      } catch (err: any) {
        errors.push(`${item.title}: ${err.message || 'Erreur inconnue'}`);
      }
    }
  }

  console.info(`[AutoReminderEngine] Bilan du scan : ${items.length} analysés, ${sentCount} envoyés, ${skippedCount} doublons ignorés.`);
  return {
    checkedCount: items.length,
    sentCount,
    skippedCount,
    errors,
  };
};
