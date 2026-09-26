import React, { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  Fingerprint,
  LogOut,
  ShieldCheck,
  Delete,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { QuickAccessService } from '../../services/auth/quickAccessService';
import { WindowsHelloService } from '../../services/auth/windowsHelloService';
import { UserProfile } from '../../types';

interface QuickUnlockModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onUnlock: () => void;
  onSignOut: () => void;
  showToast?: (msg: string) => void;
}

export const QuickUnlockModal: React.FC<QuickUnlockModalProps> = ({
  isOpen,
  currentUser,
  onUnlock,
  onSignOut,
  showToast,
}) => {
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isSetupMode, setIsSetupMode] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [helloBusy, setHelloBusy] = useState<boolean>(false);

  const email = currentUser.email || 'direction@coresi-congo.com';
  const hasPin = QuickAccessService.hasPin(email);
  const hasHello = WindowsHelloService.hasCredential(email);
  const helloAvailable = WindowsHelloService.isAvailable();
  const preferredMethod = QuickAccessService.getPreferredMethod(email);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setError('');
      // If user has no PIN and no Hello set up, go to setup mode
      if (!hasPin && !hasHello) {
        setIsSetupMode(true);
      } else {
        setIsSetupMode(false);
      }
    }
  }, [isOpen, hasPin, hasHello]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    setError('');
    if (pin.length < 6) {
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError('');
    setPin('');
  };

  const handleWindowsHello = async () => {
    setError('');
    setHelloBusy(true);
    try {
      if (!WindowsHelloService.isAvailable()) {
        setError("Windows Hello n'est pas disponible sur cet appareil.");
        return;
      }

      if (!hasHello) {
        // Enrolling
        await WindowsHelloService.enroll(email, currentUser.name);
        QuickAccessService.setPreferredMethod(email, 'windows-hello');
        showToast?.('Windows Hello activé avec succès !');
        onUnlock();
        return;
      }

      const ok = await WindowsHelloService.authenticate(email);
      if (ok) {
        showToast?.('Session déverrouillée via Windows Hello.');
        onUnlock();
      } else {
        setError('Identification Windows Hello échouée.');
      }
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'authentification biométrique.");
    } finally {
      setHelloBusy(false);
    }
  };

  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (pin.length < 4) {
      setError('Le code PIN doit comporter au moins 4 chiffres.');
      return;
    }

    setLoading(true);
    try {
      if (isSetupMode) {
        if (!confirmPin) {
          // Move to confirm stage or prompt
          setError('Veuillez confirmer votre nouveau code PIN.');
          setLoading(false);
          return;
        }
        if (pin !== confirmPin) {
          setError('Les deux codes PIN ne correspondent pas.');
          setLoading(false);
          return;
        }
        await QuickAccessService.setPin(email, pin);
        QuickAccessService.setPreferredMethod(email, 'pin');
        showToast?.('Code PIN enregistré avec succès.');
        onUnlock();
      } else {
        const ok = await QuickAccessService.verifyPin(email, pin);
        if (ok) {
          showToast?.('Session déverrouillée.');
          onUnlock();
        } else {
          setError('Code PIN incorrect.');
          setPin('');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur de vérification du code PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-6 text-center transition-colors">
        {/* Header / Logo */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 p-2 flex items-center justify-center shadow-sm mb-3">
            <img src="/logo.png" alt="CORESI" className="w-full h-full object-contain" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Session Sécurisée</span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-2">
            {isSetupMode ? 'Créer un Code PIN de Sécurité' : 'Déverrouiller CORESI'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentUser.name} ({currentUser.role.toUpperCase()})
          </p>
        </div>

        {/* Windows Hello Biometrics Button if Available */}
        {helloAvailable && !isSetupMode && (
          <button
            type="button"
            onClick={handleWindowsHello}
            disabled={helloBusy}
            className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-center justify-center gap-2.5 text-emerald-900 dark:text-emerald-300 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-98"
          >
            {helloBusy ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <Fingerprint className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{hasHello ? 'Déverrouiller avec Windows Hello' : 'Activer Windows Hello (Visage / Empreinte)'}</span>
          </button>
        )}

        {/* PIN Indicators */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 py-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  pin.length > idx
                    ? 'bg-green-700 dark:bg-green-500 scale-110 shadow-xs'
                    : 'bg-stone-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-xl border border-rose-200 dark:border-rose-900/50">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Setup confirmation input if in setup mode */}
          {isSetupMode && (
            <div className="space-y-2 text-left">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Confirmez le code PIN :
              </label>
              <input
                type="password"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Retapez le code PIN..."
                className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-center font-mono tracking-widest text-slate-900 dark:text-white text-sm"
              />
            </div>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-base text-slate-800 dark:text-white transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-3 rounded-2xl bg-stone-100/60 hover:bg-stone-200 dark:bg-slate-800/60 dark:hover:bg-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 transition-all cursor-pointer active:scale-95"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-base text-slate-800 dark:text-white transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 rounded-2xl bg-stone-100/60 hover:bg-stone-200 dark:bg-slate-800/60 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all cursor-pointer active:scale-95"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Button */}
        <button
          type="button"
          onClick={() => handlePinSubmit()}
          disabled={loading || pin.length < 4}
          className="w-full py-3 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-green-700/20 cursor-pointer"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          <span>{isSetupMode ? 'Valider et Activer le PIN' : 'Déverrouiller'}</span>
        </button>

        {/* Footer actions: Switch to setup / Sign out */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-slate-800/80 text-[11px]">
          <button
            type="button"
            onClick={() => {
              setIsSetupMode((prev) => !prev);
              setPin('');
              setConfirmPin('');
              setError('');
            }}
            className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
          >
            {isSetupMode ? 'Annuler la création' : 'Changer / Définir PIN'}
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
};
