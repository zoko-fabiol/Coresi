/**
 * emailTemplates.ts - CORESI SARL
 * Modèles d'Emails HTML Professionnels & Responsives pour CORESI SARL Cameroun.
 * Spécialiste Construction Métallique, Chaudronnerie & Tuyauterie Industrielle.
 * Palette : #3B7A2C (Vert CORESI), #2D6020 (Vert Sombre), #F8FAFC (Fond épuré), #0F172A (Ardoise).
 */

export const OFFICIAL_PLATFORM_URL = 'http://localhost:3000/';

export const wrapEmailInBrandLayout = ({
  title,
  preheader,
  headerBadge = 'CORESI SARL • Industrie & BTP Cameroun',
  contentHtml,
  callToAction = null,
  recipientEmail = '',
}: {
  title: string;
  preheader?: string;
  headerBadge?: string;
  contentHtml: string;
  callToAction?: { label: string; url: string } | null;
  recipientEmail?: string;
}): string => {
  const ctaUrl = callToAction?.url || OFFICIAL_PLATFORM_URL;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    .email-container { max-width: 600px; margin: 20px auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 25px rgba(0, 0, 0, 0.07); border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #173B14 0%, #2D6020 50%, #3B7A2C 100%); padding: 32px 24px; text-align: center; color: #FFFFFF; }
    .logo-badge { display: inline-block; background-color: #FFFFFF; color: #2D6020; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 21px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.3px; line-height: 1.3; }
    .header p { margin: 6px 0 0 0; font-size: 12px; color: #D1FAE5; font-weight: 500; }
    .body { padding: 32px 28px; line-height: 1.6; font-size: 14px; }
    .card-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
    .alert-box { background-color: #FEF3C7; border-left: 4px solid #D97706; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #92400E; }
    .danger-box { background-color: #FEE2E2; border-left: 4px solid #DC2626; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #991B1B; }
    .table-data { width: 100%; margin-top: 8px; }
    .table-data td { padding: 8px 0; font-size: 13px; border-bottom: 1px solid #F1F5F9; }
    .table-data td.label { color: #64748B; font-weight: 500; }
    .table-data td.value { text-align: right; font-weight: 700; color: #0F172A; }
    .btn { display: inline-block; background-color: #3B7A2C; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 13px; text-align: center; box-shadow: 0 4px 12px rgba(59, 122, 44, 0.3); }
    .footer { background-color: #F8FAFC; padding: 24px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; line-height: 1.6; }
  </style>
</head>
<body>
  ${preheader ? `<span style="display:none;font-size:1px;color:#F8FAFC;line-height:1px;">${preheader}</span>` : ''}
  <div class="email-container">
    <div class="header">
      <div class="logo-badge">${headerBadge}</div>
      <h1>${title}</h1>
      <p>Système Intégré de Gestion & GED Industrielle</p>
    </div>
    <div class="body">
      ${contentHtml}
      ${
        callToAction
          ? `
        <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
          <a href="${ctaUrl}" class="btn" target="_blank">${callToAction.label} &rarr;</a>
        </div>
      `
          : ''
      }
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0; font-weight: 700; color: #334155;">CORESI SARL — Construction Métallique & Maintenance Industrielle</p>
      <p style="margin: 0 0 4px 0;">Zone Industrielle Bassa, Douala — B.P. 12818 Douala, Cameroun</p>
      <p style="margin: 0 0 4px 0;">Tél : (+237) 677 88 99 00 / 699 11 22 33 | E-mail : contact@coresi-cm.com</p>
      ${recipientEmail ? `<p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 10px;">Ce message automatique est destiné à ${recipientEmail}.</p>` : ''}
    </div>
  </div>
</body>
</html>`;
};

/**
 * 1. Modèle : Rappel d'échéance de tâche / livrable de chantier
 */
export const generateTaskDeadlineEmail = ({
  toName,
  toEmail,
  projectName,
  taskTitle,
  dueDate,
  daysRemaining,
  priority = 'Haute',
}: {
  toName: string;
  toEmail: string;
  projectName: string;
  taskTitle: string;
  dueDate: string;
  daysRemaining: number;
  priority?: string;
}) => {
  const isOverdue = daysRemaining < 0;
  const isToday = daysRemaining === 0;

  let alertBoxHtml = '';
  if (isOverdue) {
    alertBoxHtml = `
      <div class="danger-box">
        <strong>⚠️ ATTENTION - DÉPASSEMENT D'ÉCHÉANCE :</strong><br/>
        Cette tâche a dépassé sa date limite contractuelle de <strong>${Math.abs(daysRemaining)} jour(s)</strong>. Merci de régulariser la situation immédiatement.
      </div>
    `;
  } else if (isToday) {
    alertBoxHtml = `
      <div class="alert-box">
        <strong>⏰ ÉCHÉANCE AUJOURD'HUI :</strong><br/>
        La livraison ou validation de cette étape doit impérativement intervenir avant la fin de la journée.
      </div>
    `;
  } else {
    alertBoxHtml = `
      <div class="alert-box">
        <strong>📅 RAPPEL PRÉVENTIF (J-${daysRemaining}) :</strong><br/>
        Il reste <strong>${daysRemaining} jour(s)</strong> avant l'échéance fixée au <strong>${dueDate}</strong>.
      </div>
    `;
  }

  const contentHtml = `
    <p>Bonjour <strong>${toName}</strong>,</p>
    <p>Le système de pilotage de production CORESI vous notifie un rappel d'échéance sur le chantier ou projet suivant :</p>
    
    ${alertBoxHtml}

    <div class="card-box">
      <table class="table-data">
        <tr>
          <td class="label">Projet / Chantier :</td>
          <td class="value">${projectName}</td>
        </tr>
        <tr>
          <td class="label">Intitulé de la tâche :</td>
          <td class="value">${taskTitle}</td>
        </tr>
        <tr>
          <td class="label">Date d'échéance :</td>
          <td class="value">${dueDate}</td>
        </tr>
        <tr>
          <td class="label">Niveau de priorité :</td>
          <td class="value" style="color: ${priority === 'Urgente' || priority === 'Haute' ? '#DC2626' : '#2D6020'};">${priority}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #64748B;">
      Assurez-vous de mettre à jour l'avancement ou de joindre les livrables techniques (plans GED, PV de réception ou notes de calcul) sur la plateforme.
    </p>
  `;

  return {
    subject: `${isOverdue ? '🚨 [URGENT DÉPASSÉ]' : '⏰ [RAPPEL]'} Échéance Tâche : ${taskTitle} (${projectName})`,
    htmlContent: wrapEmailInBrandLayout({
      title: "Rappel d'Échéance de Projet",
      preheader: `Échéance pour ${taskTitle} sur le projet ${projectName}`,
      contentHtml,
      callToAction: {
        label: 'Consulter le Projet sur CORESI',
        url: `${OFFICIAL_PLATFORM_URL}#projects`,
      },
      recipientEmail: toEmail,
    }),
  };
};

/**
 * 2. Modèle : Alerte expiration d'habilitation ou certificat employé (CACES, SST, Licence soudeur)
 */
export const generateCertificationExpiryEmail = ({
  toName,
  toEmail,
  employeeName,
  matricule,
  certificationName,
  expiryDate,
  daysRemaining,
}: {
  toName: string;
  toEmail: string;
  employeeName: string;
  matricule: string;
  certificationName: string;
  expiryDate: string;
  daysRemaining: number;
}) => {
  const isExpired = daysRemaining <= 0;

  const contentHtml = `
    <p>Bonjour <strong>${toName}</strong>,</p>
    <p>Le module de conformité HSE & RH CORESI a détecté une échéance critique concernant les qualifications du personnel technique :</p>

    <div class="${isExpired ? 'danger-box' : 'alert-box'}">
      <strong>${isExpired ? '🛑 HABILITATION EXPIRÉE :' : '⚠️ RENOUVELLEMENT REQUIS :'}</strong><br/>
      L'habilitation <strong>${certificationName}</strong> du collaborateur <strong>${employeeName}</strong> ${
    isExpired
      ? `a expiré le ${expiryDate}. Le travail sur chantier sous cette qualification est suspendu.`
      : `arrive à expiration dans <strong>${daysRemaining} jour(s)</strong> (${expiryDate}).`
  }
    </div>

    <div class="card-box">
      <table class="table-data">
        <tr>
          <td class="label">Collaborateur :</td>
          <td class="value">${employeeName}</td>
        </tr>
        <tr>
          <td class="label">Matricule :</td>
          <td class="value">${matricule}</td>
        </tr>
        <tr>
          <td class="label">Qualification / Habilitation :</td>
          <td class="value">${certificationName}</td>
        </tr>
        <tr>
          <td class="label">Date de fin de validité :</td>
          <td class="value" style="color: #DC2626;">${expiryDate}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #64748B;">
      Merci d'organiser sans délai le recyclage de la certification ou la visite médicale d'aptitude auprès du centre agréé.
    </p>
  `;

  return {
    subject: `🛡️ [CONFORMITÉ HSE] Expiration Habilitation : ${certificationName} - ${employeeName}`,
    htmlContent: wrapEmailInBrandLayout({
      title: 'Alerte Habilitation & Sécurité HSE',
      headerBadge: 'CORESI SARL • Bureau HSE & Ressources Humaines',
      preheader: `Expiration certificat ${certificationName} pour ${employeeName}`,
      contentHtml,
      callToAction: {
        label: 'Gérer les Employés & Habilitations',
        url: `${OFFICIAL_PLATFORM_URL}#hr`,
      },
      recipientEmail: toEmail,
    }),
  };
};

/**
 * 3. Modèle : Relance de Facture / Situation de travaux client
 */
export const generateInvoiceReminderEmail = ({
  toName,
  toEmail,
  clientName,
  invoiceNumber,
  amountFcfa,
  dueDate,
  projectName,
}: {
  toName: string;
  toEmail: string;
  clientName: string;
  invoiceNumber: string;
  amountFcfa: number;
  dueDate: string;
  projectName?: string;
}) => {
  const formattedAmount = new Intl.NumberFormat('fr-FR').format(amountFcfa) + ' FCFA';

  const contentHtml = `
    <p>Bonjour <strong>${toName}</strong>,</p>
    <p>Nous vous adressons un rappel amical concernant la situation de règlement de la facture relative aux travaux exécutés par CORESI SARL :</p>

    <div class="alert-box">
      <strong>📄 SITUATION DE PAIEMENT EN ATTENTE :</strong><br/>
      Facture n° <strong>${invoiceNumber}</strong> d'un montant de <strong>${formattedAmount}</strong> parvenue à son terme contractuel le <strong>${dueDate}</strong>.
    </div>

    <div class="card-box">
      <table class="table-data">
        <tr>
          <td class="label">Client :</td>
          <td class="value">${clientName}</td>
        </tr>
        <tr>
          <td class="label">Numéro de pièce :</td>
          <td class="value">${invoiceNumber}</td>
        </tr>
        ${
          projectName
            ? `
        <tr>
          <td class="label">Chantier / Affaire :</td>
          <td class="value">${projectName}</td>
        </tr>`
            : ''
        }
        <tr>
          <td class="label">Montant Total TTC :</td>
          <td class="value" style="color: #2D6020; font-size: 15px;">${formattedAmount}</td>
        </tr>
        <tr>
          <td class="label">Date d'échéance :</td>
          <td class="value">${dueDate}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #64748B;">
      Si le virement a déjà été émis, nous vous remercions de bien vouloir nous transmettre le bordereau de transfert afin que notre service comptable puisse lettrer votre compte.
    </p>
  `;

  return {
    subject: `💳 [SUIVI FACTURATION] Relance Facture N° ${invoiceNumber} - CORESI SARL`,
    htmlContent: wrapEmailInBrandLayout({
      title: 'Suivi de Facturation & Règlements',
      headerBadge: 'CORESI SARL • Direction Administrative & Financière',
      preheader: `Rappel de règlement facture ${invoiceNumber} (${formattedAmount})`,
      contentHtml,
      callToAction: {
        label: 'Consulter la GED Facturation',
        url: `${OFFICIAL_PLATFORM_URL}#ged`,
      },
      recipientEmail: toEmail,
    }),
  };
};

/**
 * 4. Modèle : Notification de nouveau message collaborateur direct
 */
export const generateDirectMessageEmail = ({
  toName,
  toEmail,
  senderName,
  senderRole,
  messagePreview,
}: {
  toName: string;
  toEmail: string;
  senderName: string;
  senderRole: string;
  messagePreview: string;
}) => {
  const contentHtml = `
    <p>Bonjour <strong>${toName}</strong>,</p>
    <p>Vous avez reçu un nouveau message direct de <strong>${senderName}</strong> (${senderRole}) sur l'espace collaborateur CORESI :</p>

    <div class="card-box" style="border-left: 4px solid #3B7A2C; background-color: #F8FAFC;">
      <p style="margin: 0; font-style: italic; color: #334155; font-size: 14px;">
        « ${messagePreview} »
      </p>
    </div>

    <p style="font-size: 13px; color: #64748B;">
      Connectez-vous à la plateforme pour poursuivre la discussion, écouter la note vocale ou télécharger les pièces jointes.
    </p>
  `;

  return {
    subject: `💬 Nouveau message de ${senderName} sur CORESI`,
    htmlContent: wrapEmailInBrandLayout({
      title: 'Messagerie Instantanée CORESI',
      headerBadge: 'CORESI SARL • Communication Interne',
      contentHtml,
      callToAction: {
        label: 'Ouvrir le Chat Collaborateurs',
        url: `${OFFICIAL_PLATFORM_URL}#chat`,
      },
      recipientEmail: toEmail,
    }),
  };
};
