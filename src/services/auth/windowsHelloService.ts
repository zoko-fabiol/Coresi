/**
 * windowsHelloService.ts - CORESI ERP
 * Authentification biométrique via l'API standard WebAuthn
 * Supporte Windows Hello (reconnaissance faciale, empreinte digitale, PIN Windows)
 */

const WINDOWS_HELLO_KEY = 'coresi_windows_hello_';

const normalizeEmail = (email: string) => (email || '').trim().toLowerCase();
const storageKey = (email: string) => `${WINDOWS_HELLO_KEY}${normalizeEmail(email)}`;

const randomBytes = (size = 32): Uint8Array => {
  const bytes = new Uint8Array(size);
  window.crypto.getRandomValues(bytes);
  return bytes;
};

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const fromBase64Url = (value: string): Uint8Array => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

interface HelloRecord {
  credentialId: string;
  createdAt: number;
  displayName: string;
}

const readRecord = (email: string): HelloRecord | null => {
  try {
    const raw = localStorage.getItem(storageKey(email));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const isWebAuthnAvailable = () =>
  typeof window !== 'undefined' &&
  !!window.PublicKeyCredential &&
  !!navigator.credentials &&
  typeof navigator.credentials.create === 'function' &&
  typeof navigator.credentials.get === 'function';

export const WindowsHelloService = {
  isAvailable(): boolean {
    return isWebAuthnAvailable();
  },

  hasCredential(email: string): boolean {
    return !!readRecord(email);
  },

  async enroll(email: string, displayName = ''): Promise<HelloRecord> {
    if (!isWebAuthnAvailable()) {
      throw new Error("Windows Hello / WebAuthn n'est pas disponible sur cet appareil.");
    }

    const challenge = randomBytes(32);
    const userId = randomBytes(16);
    const normalized = normalizeEmail(email);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'CORESI ERP & GED', id: window.location.hostname },
        user: {
          id: userId,
          name: normalized,
          displayName: displayName || normalized,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('Enrôlement Windows Hello annulé.');
    }

    const record: HelloRecord = {
      credentialId: toBase64Url(new Uint8Array(credential.rawId)),
      createdAt: Date.now(),
      displayName: displayName || normalized,
    };

    localStorage.setItem(storageKey(normalized), JSON.stringify(record));
    return record;
  },

  async authenticate(email: string): Promise<boolean> {
    const normalized = normalizeEmail(email);
    const record = readRecord(normalized);
    if (!record || !record.credentialId) return false;
    if (!isWebAuthnAvailable()) {
      throw new Error("Windows Hello / WebAuthn n'est pas disponible sur cet appareil.");
    }

    const challenge = randomBytes(32);
    const credentialId = fromBase64Url(record.credentialId);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: credentialId as unknown as ArrayBuffer, type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    return !!assertion;
  },

  clear(email: string): void {
    localStorage.removeItem(storageKey(email));
  },
};
