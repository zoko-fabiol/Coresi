/**
 * quickAccessService.ts - CORESI ERP
 * Gestion du code PIN rapide salé SHA-256 et préférences de verrouillage
 */

const PIN_PREFIX = 'coresi_quick_pin_';
const PREF_PREFIX = 'coresi_quick_pref_';
const TIMEOUT_PREFIX = 'coresi_quick_timeout_';

const normalizeEmail = (email: string) => (email || '').trim().toLowerCase();

const storageKey = (email: string) => `${PIN_PREFIX}${normalizeEmail(email)}`;
const preferenceKey = (email: string) => `${PREF_PREFIX}${normalizeEmail(email)}`;
const timeoutKey = (email: string) => `${TIMEOUT_PREFIX}${normalizeEmail(email)}`;

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const randomHex = (size = 16): string => {
  const bytes = new Uint8Array(size);
  window.crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
};

const sha256 = async (value: string): Promise<string> => {
  const encoded = new TextEncoder().encode(value);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  return bytesToHex(new Uint8Array(hashBuffer));
};

interface PinRecord {
  salt: string;
  hash: string;
  updatedAt: number;
}

const readRecord = (email: string): PinRecord | null => {
  try {
    const raw = localStorage.getItem(storageKey(email));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const QuickAccessService = {
  hasPin(email: string): boolean {
    return !!readRecord(email);
  },

  getPreferredMethod(email: string): 'pin' | 'windows-hello' {
    try {
      const val = localStorage.getItem(preferenceKey(email));
      return val === 'windows-hello' ? 'windows-hello' : 'pin';
    } catch {
      return 'pin';
    }
  },

  setPreferredMethod(email: string, method: 'pin' | 'windows-hello'): void {
    localStorage.setItem(preferenceKey(email), method === 'windows-hello' ? 'windows-hello' : 'pin');
  },

  getLockTimeoutMinutes(email: string): number {
    try {
      const raw = localStorage.getItem(timeoutKey(email));
      const value = Number(raw);
      return Number.isFinite(value) && value > 0 ? value : 15; // default 15 min
    } catch {
      return 15;
    }
  },

  setLockTimeoutMinutes(email: string, minutes: number): number {
    const normalized = Number(minutes);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      localStorage.setItem(timeoutKey(email), '0');
      return 0;
    }
    localStorage.setItem(timeoutKey(email), String(Math.floor(normalized)));
    return Math.floor(normalized);
  },

  async setPin(email: string, pin: string): Promise<PinRecord> {
    const normalized = normalizeEmail(email);
    const salt = randomHex(16);
    const hash = await sha256(`${salt}:${pin}`);
    const record: PinRecord = { salt, hash, updatedAt: Date.now() };
    localStorage.setItem(storageKey(normalized), JSON.stringify(record));
    return record;
  },

  async verifyPin(email: string, pin: string): Promise<boolean> {
    const normalized = normalizeEmail(email);
    const record = readRecord(normalized);
    if (!record || !record.salt || !record.hash) return false;
    const hash = await sha256(`${record.salt}:${pin}`);
    return hash === record.hash;
  },

  clearPin(email: string): void {
    localStorage.removeItem(storageKey(email));
  },

  clearPreference(email: string): void {
    localStorage.removeItem(preferenceKey(email));
  },

  clearLockTimeout(email: string): void {
    localStorage.removeItem(timeoutKey(email));
  },
};
