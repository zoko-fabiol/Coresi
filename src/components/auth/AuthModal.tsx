import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Shield,
  Phone,
  AlertCircle,
  CheckCircle,
  LogIn,
  KeyRound,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginEmail, loginGoogle, registerUser, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('employe');
  const [department, setDepartment] = useState('operations');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await loginEmail(email, password);
        if (onSuccess) onSuccess();
        onClose();
      } else if (mode === 'register') {
        await registerUser(email, password, name, role, department, phone);
        setSuccessMsg('Compte créé avec succès.');
        if (onSuccess) onSuccess();
        setTimeout(() => onClose(), 1000);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Un lien de réinitialisation a été envoyé à votre adresse email.');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'authentification.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginGoogle();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(26,46,20,0.7)] backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[--coresi-surface-elevated] border border-[--coresi-border] dark:border-[--coresi-border-strong] text-[--coresi-text] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header — CORESI branded */}
        <div className="p-6 border-b border-[--coresi-border] flex items-center justify-between bg-gradient-to-r from-[--coresi-primary-50] via-white to-[--coresi-secondary-50] dark:from-[--coresi-surface] dark:via-[--coresi-surface] dark:to-[rgba(59,122,44,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#121F16] border border-stone-200 dark:border-emerald-800/60 p-1 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/logo.png"
                alt="CORESI Logo"
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>
            <div>
              <h2 className="font-bold text-base text-[--coresi-text]">
                {mode === 'login' && 'Connexion Sécurisée'}
                {mode === 'register' && 'Créer un Compte Collaborateur'}
                {mode === 'forgot' && 'Réinitialiser le Mot de Passe'}
              </h2>
              <p className="text-xs text-[--coresi-text-muted]">CORESI INTERNATIONAL SARL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[--coresi-text-muted] hover:text-[--coresi-text] p-1 rounded-lg hover:bg-[--coresi-surface-hover] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[--coresi-danger-light] dark:bg-[rgba(220,38,38,0.1)] border border-red-200 dark:border-[rgba(220,38,38,0.3)] text-[--coresi-danger-dark] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[--coresi-danger] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-[--coresi-success-light] dark:bg-[rgba(22,163,74,0.1)] border border-green-200 dark:border-[rgba(22,163,74,0.3)] text-[--coresi-success-dark] text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[--coresi-success] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[--coresi-text-secondary] mb-1">Nom complet</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[--coresi-text-muted] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ex: Jean Dupont"
                      className="w-full bg-[--coresi-surface] dark:bg-[--coresi-surface] border border-[--coresi-border] rounded-xl pl-9 pr-3 py-2 text-xs text-[--coresi-text] placeholder-[--coresi-text-muted] focus:border-[--coresi-primary] focus:outline-none focus:ring-2 focus:ring-[rgba(59,122,44,0.2)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[--coresi-text-secondary] mb-1">Rôle</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-[--coresi-surface] dark:bg-[--coresi-surface] border border-[--coresi-border] rounded-xl px-3 py-2 text-xs text-[--coresi-text] focus:border-[--coresi-primary] focus:outline-none focus:ring-2 focus:ring-[rgba(59,122,44,0.2)]"
                    >
                      <option value="employe">Employé</option>
                      <option value="chef_projet">Chef de Projet</option>
                      <option value="comptable">Comptable / Finance</option>
                      <option value="rh">Ressources Humaines</option>
                      <option value="magasinier">Magasinier</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[--coresi-text-secondary] mb-1">Département</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-[--coresi-surface] dark:bg-[--coresi-surface] border border-[--coresi-border] rounded-xl px-3 py-2 text-xs text-[--coresi-text] focus:border-[--coresi-primary] focus:outline-none focus:ring-2 focus:ring-[rgba(59,122,44,0.2)]"
                    >
                      <option value="operations">Opérations / Tuyauterie</option>
                      <option value="finance">Comptabilité & Finance</option>
                      <option value="rh">Ressources Humaines</option>
                      <option value="logistique">Logistique & Matériel</option>
                      <option value="direction">Direction Générale</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[--coresi-text-secondary] mb-1">Téléphone (optionnel)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[--coresi-text-muted] absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+241 ..."
                      className="w-full bg-[--coresi-surface] dark:bg-[--coresi-surface] border border-[--coresi-border] rounded-xl pl-9 pr-3 py-2 text-xs text-[--coresi-text] placeholder-[--coresi-text-muted] focus:border-[--coresi-primary] focus:outline-none focus:ring-2 focus:ring-[rgba(59,122,44,0.2)]"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-[--coresi-text-secondary] mb-1">Adresse email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[--coresi-text-muted] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@coresi.com"
                  className="w-full bg-[--coresi-surface] dark:bg-[--coresi-surface] border border-[--coresi-border] rounded-xl pl-9 pr-3 py-2 text-xs text-[--coresi-text] placeholder-[--coresi-text-muted] focus:border-[--coresi-primary] focus:outline-none focus:ring-2 focus:ring-[rgba(59,122,44,0.2)]"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-semibold text-[--coresi-text-secondary] mb-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[--coresi-text-muted] absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[--coresi-surface] dark:bg-[--coresi-surface] border border-[--coresi-border] rounded-xl pl-9 pr-3 py-2 text-xs text-[--coresi-text] placeholder-[--coresi-text-muted] focus:border-[--coresi-primary] focus:outline-none focus:ring-2 focus:ring-[rgba(59,122,44,0.2)]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[--coresi-primary] to-[--coresi-primary-dark] hover:from-[--coresi-primary-light] hover:to-[--coresi-primary] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[rgba(59,122,44,0.2)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Patientez...</span>
              ) : (
                <>
                  {mode === 'login' && <LogIn className="w-4 h-4" />}
                  {mode === 'register' && <User className="w-4 h-4" />}
                  {mode === 'forgot' && <KeyRound className="w-4 h-4" />}
                  <span>
                    {mode === 'login' && 'Se connecter'}
                    {mode === 'register' && 'Créer le compte'}
                    {mode === 'forgot' && 'Envoyer le lien'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Social Google Login */}
          {mode === 'login' && (
            <>
              <div className="flex items-center my-3 text-[--coresi-text-muted]">
                <div className="flex-1 border-t border-[--coresi-border]" />
                <span className="px-3 text-[11px] uppercase tracking-wider">ou</span>
                <div className="flex-1 border-t border-[--coresi-border]" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2 px-4 bg-[--coresi-surface-alt] hover:bg-[--coresi-surface-hover] text-[--coresi-text] border border-[--coresi-border] rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Connexion avec Google Workspace</span>
              </button>
            </>
          )}

          {/* Mode Switcher Links */}
          <div className="pt-2 border-t border-[--coresi-border] flex items-center justify-between text-[11px] text-[--coresi-text-muted]">
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="hover:text-[--coresi-primary] transition-colors"
                >
                  Mot de passe oublié ?
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-[--coresi-primary] hover:text-[--coresi-primary-light] font-semibold transition-colors"
                >
                  Nouveau compte
                </button>
              </>
            )}

            {mode === 'register' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[--coresi-primary] hover:text-[--coresi-primary-light] font-semibold transition-colors"
              >
                Déjà un compte ? Se connecter
              </button>
            )}

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[--coresi-primary] hover:text-[--coresi-primary-light] font-semibold transition-colors"
              >
                Retour à la connexion
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
