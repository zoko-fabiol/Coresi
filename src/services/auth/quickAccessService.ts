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

  getPreferredMethod(email: string): 'pin' | 'windows-hello' | 'hello' {
    try {
      const val = localStorage.getItem(preferenceKey(email));
      if (val === 'windows-hello' || val === 'hello') return 'windows-hello';
      return 'pin';
    } catch {
      return 'pin';
    }
  },

  setPreferredMethod(email: string, method: 'pin' | 'windows-hello' | 'hello' | string): void {
    const normalized = method === 'windows-hello' || method === 'hello' ? 'windows-hello' : 'pin';
    localStorage.setItem(preferenceKey(email), normalized);
  },

  getLockTimeoutMinutes(email = 'global'): number {
    try {
      const raw = localStorage.getItem(timeoutKey(email)) || localStorage.getItem(timeoutKey('global'));
      if (raw === '0') return 0;
      const value = Number(raw);
      return Number.isFinite(value) && value >= 0 ? value : 15; // default 15 min
    } catch {
      return 15;
    }
  },

  setLockTimeoutMinutes(email: string | number, minutes?: number): number {
    let targetEmail = 'global';
    let targetMinutes = 15;
    if (typeof email === 'number') {
      targetMinutes = email;
    } else {
      targetEmail = email || 'global';
      targetMinutes = typeof minutes === 'number' ? minutes : 15;
    }

    const normalized = Number(targetMinutes);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      localStorage.setItem(timeoutKey(targetEmail), '0');
      localStorage.setItem(timeoutKey('global'), '0');
      return 0;
    }
    const val = String(Math.floor(normalized));
    localStorage.setItem(timeoutKey(targetEmail), val);
    localStorage.setItem(timeoutKey('global'), val);
    return Math.floor(normalized);
  },

  // Alias for getLockTimeoutMinutes
  getIdleTimeout(email = 'global'): number {
    return this.getLockTimeoutMinutes(email);
  },

  // Alias for setLockTimeoutMinutes
  setIdleTimeout(minutes: number, email = 'global'): number {
    return this.setLockTimeoutMinutes(email, minutes);
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

  // Alias for clearPin
  removePin(email: string): void {
    this.clearPin(email);
  },

  clearPreference(email: string): void {
    localStorage.removeItem(preferenceKey(email));
  },

  clearLockTimeout(email = 'global'): void {
    localStorage.removeItem(timeoutKey(email));
    localStorage.removeItem(timeoutKey('global'));
  },
};
