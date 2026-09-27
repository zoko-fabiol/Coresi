/**
 * emailRateLimiter.ts - CORESI SARL
 * Service de Limitation de Débit & Registre Anti-Doublon d'E-mails.
 * 
 * Règle Métier :
 * - Maximum 1 seul e-mail identique par destinataire et par jour (date civile YYYY-MM-DD).
 * - Les e-mails portant sur des sujets ou dossiers différents envoyés le même jour restent autorisés.
 * - Registre persistant synchronisé dans le localStorage avec nettoyage automatique.
 */

const STORAGE_KEY = 'coresi_email_daily_sent_registry_v1';

export const normalizeText = (text: string = ''): string => {
  return String(text || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
};

export const normalizeEmail = (email: string = ''): string => {
  return String(email || '').trim().toLowerCase();
};

export const getTodayDateString = (date: Date = new Date()): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const generateEmailFingerprint = (
  toEmail: string,
  subject: string,
  entityKey: string = '',
  dateStr: string = getTodayDateString()
): string => {
  const cleanEmail = normalizeEmail(toEmail);
  const cleanSubject = normalizeText(subject);
  const cleanKey = normalizeText(entityKey);
  const identifier = cleanKey ? `${cleanKey}_${cleanSubject.slice(0, 40)}` : cleanSubject;
  return `${cleanEmail}__${identifier}__${dateStr}`;
};

export interface SentEmailEntry {
  fingerprint: string;
  toEmail: string;
  toName?: string;
  subject: string;
  entityKey?: string;
  provider: string;
  messageId?: string;
  dateStr: string;
  sentAt: string;
}

export const getDailySentRegistry = (): Record<string, SentEmailEntry> => {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (err) {
    console.warn('[EmailRateLimiter] Erreur lors de la lecture du registre quotidien :', err);
    return {};
  }
};

const saveDailySentRegistry = (registry: Record<string, SentEmailEntry>): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
    }
  } catch (err) {
    console.warn('[EmailRateLimiter] Erreur de sauvegarde du registre :', err);
  }
};

export const pruneExpiredRegistryEntries = (): Record<string, SentEmailEntry> => {
  const registry = getDailySentRegistry();
  const now = Date.now();
  const maxAgeMs = 72 * 60 * 60 * 1000; // 72 heures de conservation
  let hasChanged = false;

  const cleaned: Record<string, SentEmailEntry> = {};
  for (const [key, entry] of Object.entries(registry)) {
    const entryTime = entry?.sentAt ? new Date(entry.sentAt).getTime() : 0;
    if (now - entryTime < maxAgeMs) {
      cleaned[key] = entry;
    } else {
      hasChanged = true;
    }
  }

  if (hasChanged) {
    saveDailySentRegistry(cleaned);
  }
  return cleaned;
};

export const isDailyEmailAlreadySent = (params: {
  toEmail: string;
  subject: string;
  entityKey?: string;
  dateStr?: string;
}): { alreadySent: boolean; previousEntry: SentEmailEntry | null; fingerprint: string } => {
  const { toEmail, subject, entityKey = '', dateStr = getTodayDateString() } = params;
  if (!toEmail || !subject) return { alreadySent: false, previousEntry: null, fingerprint: '' };

  const fingerprint = generateEmailFingerprint(toEmail, subject, entityKey, dateStr);
  const registry = getDailySentRegistry();

  if (registry[fingerprint]) {
    return {
      alreadySent: true,
      previousEntry: registry[fingerprint],
      fingerprint,
    };
  }

  // Vérification de secours : même destinataire avec le même sujet sur la même journée
  const cleanEmail = normalizeEmail(toEmail);
  const cleanSubject = normalizeText(subject);

  for (const [fp, entry] of Object.entries(registry)) {
    if (
      normalizeEmail(entry.toEmail) === cleanEmail &&
      normalizeText(entry.subject) === cleanSubject &&
      entry.dateStr === dateStr
    ) {
      return {
        alreadySent: true,
        previousEntry: entry,
        fingerprint: fp,
      };
    }
  }

  return {
    alreadySent: false,
    previousEntry: null,
    fingerprint,
  };
};

export const recordDailyEmailSent = (params: {
  toEmail: string;
  toName?: string;
  subject: string;
  entityKey?: string;
  provider?: string;
  messageId?: string;
  dateStr?: string;
}): string => {
  const {
    toEmail,
    toName,
    subject,
    entityKey = '',
    provider = 'SANDBOX',
    messageId = '',
    dateStr = getTodayDateString(),
  } = params;

  if (!toEmail || !subject) return '';

  pruneExpiredRegistryEntries();
  const fingerprint = generateEmailFingerprint(toEmail, subject, entityKey, dateStr);
  const registry = getDailySentRegistry();

  registry[fingerprint] = {
    fingerprint,
    toEmail: normalizeEmail(toEmail),
    toName,
    subject,
    entityKey,
    provider,
    messageId,
    dateStr,
    sentAt: new Date().toISOString(),
  };

  saveDailySentRegistry(registry);
  console.info(`[Anti-Doublon CORESI] E-mail consigné dans le registre : "${subject}" -> ${toEmail}`);
  return fingerprint;
};
