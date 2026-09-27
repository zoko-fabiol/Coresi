/**
 * emailService.ts - CORESI SARL
 * Service Universel d'Envoi d'E-mails & Passerelle Multi-Fournisseurs.
 * Supporte :
 * 1. Mode Bac à Sable / Simulation Réaliste (Sandbox persistant)
 * 2. EmailJS REST API (Envoi direct depuis le navigateur sans backend)
 * 3. Resend REST API (Haute délivrabilité via clé API)
 * 4. Brevo (Sendinblue) REST API
 * 5. Webhook Cloud Function personnalisé
 * Avec contrôle anti-doublon strict (1 envoi par jour/dossier max via emailRateLimiter).
 */

import { isDailyEmailAlreadySent, recordDailyEmailSent } from './emailRateLimiter';

export interface EmailSettings {
  provider: 'SANDBOX' | 'EMAILJS' | 'RESEND' | 'BREVO' | 'WEBHOOK';
  senderName: string;
  senderEmail: string;
  replyTo: string;
  autoRemindersEnabled: boolean;
  notificationCopyDG: boolean;
  dgNotificationEmail: string;
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
  resendApiKey?: string;
  brevoApiKey?: string;
  webhookUrl?: string;
}

const SETTINGS_KEY = 'coresi_email_settings_v1';

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  provider: 'SANDBOX',
  senderName: 'CORESI SARL — Notifications Métier',
  senderEmail: 'notifications@coresi-cm.com',
  replyTo: 'contact@coresi-cm.com',
  autoRemindersEnabled: true,
  notificationCopyDG: true,
  dgNotificationEmail: 'direction@coresi-cm.com',
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',
  resendApiKey: '',
  brevoApiKey: '',
  webhookUrl: '',
};

export const getEmailSettings = (): EmailSettings => {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_EMAIL_SETTINGS;
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_EMAIL_SETTINGS;
    return { ...DEFAULT_EMAIL_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('[EmailService] Erreur lecture des paramètres email :', err);
    return DEFAULT_EMAIL_SETTINGS;
  }
};

export const saveEmailSettings = (settings: EmailSettings): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch (err) {
    console.warn('[EmailService] Erreur sauvegarde paramètres email :', err);
  }
};

export interface DispatchEmailParams {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  entityKey?: string;
  forceResend?: boolean;
}

export interface DispatchEmailResult {
  success: boolean;
  provider: string;
  messageId?: string;
  skippedDuplicate?: boolean;
  fingerprint?: string;
  error?: string;
}

/**
 * Envoie un courriel réel avec contrôle anti-doublon
 */
export const dispatchRealEmail = async (params: DispatchEmailParams): Promise<DispatchEmailResult> => {
  const { toEmail, toName = 'Collaborateur / Client', subject, htmlContent, textContent, entityKey = '', forceResend = false } = params;

  if (!toEmail || !subject || !htmlContent) {
    return {
      success: false,
      provider: 'NONE',
      error: 'Paramètres incomplets (toEmail, subject ou htmlContent manquant).',
    };
  }

  // 1. Contrôle Anti-Doublon quotidien (Rate Limiter)
  if (!forceResend) {
    const rateCheck = isDailyEmailAlreadySent({ toEmail, subject, entityKey });
    if (rateCheck.alreadySent) {
      console.info(`[EmailService] Doublon ignoré : "${subject}" a déjà été envoyé aujourd'hui à ${toEmail}.`);
      return {
        success: true,
        provider: 'SKIPPED_DUPLICATE',
        skippedDuplicate: true,
        fingerprint: rateCheck.fingerprint,
        messageId: rateCheck.previousEntry?.messageId,
      };
    }
  }

  const settings = getEmailSettings();
  let providerUsed = settings.provider || 'SANDBOX';
  let messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  try {
    // 2. Traitement selon le fournisseur sélectionné
    if (settings.provider === 'EMAILJS' && settings.emailjsServiceId && settings.emailjsPublicKey) {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: settings.emailjsServiceId,
          template_id: settings.emailjsTemplateId,
          user_id: settings.emailjsPublicKey,
          template_params: {
            to_email: toEmail,
            to_name: toName,
            subject,
            message_html: htmlContent,
            from_name: settings.senderName,
            reply_to: settings.replyTo,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`EmailJS HTTP Error: ${response.status} ${response.statusText}`);
      }
      providerUsed = 'EMAILJS';
    } else if (settings.provider === 'RESEND' && settings.resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.resendApiKey}`,
        },
        body: JSON.stringify({
          from: `${settings.senderName} <${settings.senderEmail}>`,
          to: [toEmail],
          reply_to: settings.replyTo,
          subject,
          html: htmlContent,
          text: textContent || subject,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(`Resend API Error: ${resData.message || response.statusText}`);
      }
      messageId = resData.id || messageId;
      providerUsed = 'RESEND';
    } else if (settings.provider === 'BREVO' && settings.brevoApiKey) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': settings.brevoApiKey,
        },
        body: JSON.stringify({
          sender: { name: settings.senderName, email: settings.senderEmail },
          to: [{ email: toEmail, name: toName }],
          replyTo: { email: settings.replyTo },
          subject,
          htmlContent,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(`Brevo API Error: ${resData.message || response.statusText}`);
      }
      messageId = resData.messageId || messageId;
      providerUsed = 'BREVO';
    } else if (settings.provider === 'WEBHOOK' && settings.webhookUrl) {
      const response = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail,
          toName,
          subject,
          htmlContent,
          senderName: settings.senderName,
          senderEmail: settings.senderEmail,
          entityKey,
        }),
      });
      if (!response.ok) {
        throw new Error(`Webhook Error: ${response.status}`);
      }
      providerUsed = 'WEBHOOK';
    } else {
      // Mode SANDBOX : simulation instantanée réussie
      providerUsed = 'SANDBOX';
      console.log(`[CORESI Email Sandbox] 📧 Simulation d'envoi réussi vers ${toEmail} | Sujet: "${subject}"`);
    }

    // 3. Enregistrement dans le Registre Anti-Doublon
    const fp = recordDailyEmailSent({
      toEmail,
      toName,
      subject,
      entityKey,
      provider: providerUsed,
      messageId,
    });

    return {
      success: true,
      provider: providerUsed,
      messageId,
      fingerprint: fp,
    };
  } catch (error: any) {
    console.error(`[EmailService] Erreur lors de l'envoi via ${settings.provider} :`, error);
    return {
      success: false,
      provider: providerUsed,
      error: error?.message || 'Erreur inconnue de transmission',
    };
  }
};
