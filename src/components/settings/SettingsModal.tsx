import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Cloud,
  Database,
  UserCheck,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Save,
  Sun,
  Moon,
  Lock,
  KeyRound,
  Fingerprint,
  ShieldCheck,
  Trash2,
  Clock,
} from 'lucide-react';
import { CloudinaryConfig, UserProfile, UserRole } from '../../types';
import { CloudinaryService } from '../../services/cloudinaryService';
import { DataService } from '../../services/dataService';
import { useTheme } from '../../context/ThemeContext';
import { firebaseConfig } from '../../firebase';
import { QuickAccessService } from '../../services/auth/quickAccessService';
import { WindowsHelloService } from '../../services/auth/windowsHelloService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUserChanged: (user: UserProfile) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  onResetData,
}) => {
  const { theme, setTheme } = useTheme();
  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig>(CloudinaryService.getConfig());
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const userEmail = currentUser?.email || 'direction@coresi-congo.com';
  const [pinInput, setPinInput] = useState<string>('');
  const [pinConfirm, setPinConfirm] = useState<string>('');
  const [pinStatusMsg, setPinStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [hasPin, setHasPin] = useState<boolean>(false);
  const [hasHello, setHasHello] = useState<boolean>(false);
  const [helloLoading, setHelloLoading] = useState<boolean>(false);
  const [idleTimeout, setIdleTimeoutState] = useState<number>(15);
  const [preferredMethod, setPreferredMethodState] = useState<'pin' | 'hello' | 'password'>('pin');

  useEffect(() => {
    if (isOpen) {
      setHasPin(QuickAccessService.hasPin(userEmail));
      setHasHello(WindowsHelloService.hasCredential(userEmail));
      setIdleTimeoutState(QuickAccessService.getIdleTimeout());
      setPreferredMethodState(QuickAccessService.getPreferredMethod(userEmail));
      setPinInput('');
      setPinConfirm('');
      setPinStatusMsg(null);
    }
  }, [isOpen, userEmail]);

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pinInput)) {
      setPinStatusMsg({ text: 'Le code PIN doit comporter 4 à 6 chiffres.', isError: true });
      return;
    }
    if (pinInput !== pinConfirm) {
      setPinStatusMsg({ text: 'Les deux saisies du code PIN ne correspondent pas.', isError: true });
      return;
    }
    const ok = await QuickAccessService.setPin(userEmail, pinInput);
    if (ok) {
      setHasPin(true);
      setPinInput('');
      setPinConfirm('');
      setPinStatusMsg({ text: 'Code PIN configuré avec succès.' });
      setTimeout(() => setPinStatusMsg(null), 3000);
    } else {
      setPinStatusMsg({ text: 'Erreur lors de la sauvegarde du PIN.', isError: true });
    }
  };

  const handleRemovePin = () => {
    QuickAccessService.removePin(userEmail);
    setHasPin(false);
    setPinStatusMsg({ text: 'Code PIN révoqué.' });
    setTimeout(() => setPinStatusMsg(null), 2500);
  };

  const handleRegisterHello = async () => {
    setHelloLoading(true);
    try {
      const ok = await WindowsHelloService.registerCredential(userEmail, currentUser.displayName);
      if (ok) {
        setHasHello(true);
        QuickAccessService.setPreferredMethod(userEmail, 'hello');
        setPreferredMethodState('hello');
        setPinStatusMsg({ text: 'Biométrie Windows Hello activée avec succès.' });
        setTimeout(() => setPinStatusMsg(null), 3000);
      } else {
        setPinStatusMsg({ text: 'Échec de l\'activation Windows Hello.', isError: true });
      }
    } catch {
      setPinStatusMsg({ text: 'Erreur d\'authentification biométrique.', isError: true });
    } finally {
      setHelloLoading(false);
    }
  };

  const handleRemoveHello = () => {
    WindowsHelloService.removeCredential(userEmail);
    setHasHello(false);
    QuickAccessService.setPreferredMethod(userEmail, 'pin');
    setPreferredMethodState('pin');
    setPinStatusMsg({ text: 'Biométrie Windows Hello désactivée.' });
    setTimeout(() => setPinStatusMsg(null), 2500);
  };

  const handleTimeoutChange = (minutes: number) => {
    QuickAccessService.setIdleTimeout(minutes);
    setIdleTimeoutState(minutes);
  };

  if (!isOpen) return null;

  const handleSaveCloudinary = (e: React.FormEvent) => {
    e.preventDefault();
    CloudinaryService.saveConfig(cloudinaryConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const demoRoles: { role: UserRole; name: string; dept: string; label: string }[] = [
    { role: 'dg', name: 'Dr. Joseph Ndoundo', dept: 'direction', label: 'Directeur Général (DG) - Accès Tous Modules' },
    { role: 'comptable', name: 'Clarisse Bantsimba', dept: 'comptabilite', label: 'Responsable Financier (RAF) - Factures & Dépenses' },
    { role: 'chef_projet', name: 'Ing. Paul Kimbembe', dept: 'ingenierie', label: 'Chef de Projet Tuyauterie - Chantiers & Scans' },
    { role: 'rh', name: 'Awa Diallo', dept: 'rh', label: 'Responsable RH - Gestion Personnel' },
    { role: 'magasinier', name: 'Alexandre Makosso', dept: 'chaudronnerie', label: 'Chef Atelier & Magasinier - Matériel' },
    { role: 'admin', name: 'Administrateur Système', dept: 'direction', label: 'Admin - Droits Complets' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-green-600/20 text-green-400 rounded-lg">
              <Settings className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-base text-white">Paramètres &amp; Configuration Système</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] text-xs">
          {/* Role switcher for commercial demo */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold">
              <UserCheck className="w-4 h-4 text-green-400" />
              <span>Simulateur de Rôle Utilisateur (Présentation Commerciale)</span>
            </div>
            <p className="text-slate-400">
              Changez de profil instantanément pour tester les vues métier et les permissions associées :
            </p>
            <div className="grid grid-cols-1 gap-2">
              {demoRoles.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => {
                    const updatedUser: UserProfile = {
                      uid: `user-${r.role}`,
                      email: 'clausephwandji2020@gmail.com',
                      displayName: r.name,
                      role: r.role,
                      department: r.dept,
                    };
                    DataService.setCurrentUser(updatedUser);
                    onUserChanged(updatedUser);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                    currentUser.role === r.role
                      ? 'bg-green-700/20 border-green-600 text-green-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-white">{r.label}</p>
                    <p className="text-[11px] text-slate-400">{r.name} • {r.dept.toUpperCase()}</p>
                  </div>
                  {currentUser.role === r.role && (
                    <span className="text-xs bg-green-700 text-white font-bold px-2 py-0.5 rounded-full">
                      Actif
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selector: Dark vs Light */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
                <span>Apparence de l'Application (Mode Clair / Sombre)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-900 border border-slate-700 text-slate-300 capitalize">
                Actif : {theme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}
              </span>
            </div>
            <p className="text-slate-400">
              Adaptez le contraste de l'ERP pour vos bureaux ou le travail sur le terrain :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-green-700/20 border-green-600 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">Mode Sombre (Par défaut)</p>
                  <p className="text-[10px] text-slate-400">Ambiance industrielle de nuit / usine</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'bg-green-700/20 border-green-600 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-950 border border-amber-800 text-amber-300">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">Mode Clair</p>
                  <p className="text-[10px] text-slate-400">Contraste élevé pour les bureaux</p>
                </div>
              </button>
            </div>
          </div>

          {/* Security & Quick Unlock (PIN & Windows Hello) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Sécurité d'Accès &amp; Verrouillage Rapide (Multi-Utilisateurs)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${hasPin ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-amber-950/60 text-amber-300 border-amber-800'}`}>
                  PIN {hasPin ? 'Actif' : 'Inactif'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${hasHello ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
                  Hello {hasHello ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>

            <p className="text-slate-400">
              Permet à chaque opérateur ou chef de chantier de verrouiller instantanément son écran et de le déverrouiller sans ressaisir son mot de passe complet.
            </p>

            {pinStatusMsg && (
              <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${pinStatusMsg.isError ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'}`}>
                {pinStatusMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                <span>{pinStatusMsg.text}</span>
              </div>
            )}

            {/* PIN Configuration Form */}
            <form onSubmit={handleSavePin} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Code PIN personnel (4 à 6 chiffres)
                </span>
                {hasPin && (
                  <button
                    type="button"
                    onClick={handleRemovePin}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Supprimer le PIN
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nouveau Code PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 1234"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-center tracking-widest text-sm focus:border-green-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Confirmer le PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 1234"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-center tracking-widest text-sm focus:border-green-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!pinInput || pinInput.length < 4}
                  className="px-3.5 py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{hasPin ? 'Mettre à jour le PIN' : 'Enregistrer le PIN'}</span>
                </button>
              </div>
            </form>

            {/* Windows Hello / Biometric Enrolment */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-300 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">Biométrie Windows Hello / Empreinte</p>
                  <p className="text-[11px] text-slate-400">
                    {hasHello
                      ? 'Clé biométrique WebAuthn liée à cette machine.'
                      : 'Authentification sans mot de passe via le lecteur d\'empreinte ou la caméra Windows.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasHello ? (
                  <button
                    type="button"
                    onClick={handleRemoveHello}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Désactiver
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRegisterHello}
                    disabled={helloLoading}
                    className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>{helloLoading ? 'Activation...' : 'Activer Windows Hello'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Idle Timeout Auto-lock */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Verrouillage automatique en cas d'inactivité
                </span>
                <span className="text-[11px] font-mono text-green-400 font-bold">
                  {idleTimeout === 0 ? 'Désactivé' : `${idleTimeout} min`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { value: 0, label: 'Désactivé' },
                  { value: 5, label: '5 minutes' },
                  { value: 15, label: '15 minutes' },
                  { value: 30, label: '30 minutes' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleTimeoutChange(item.value)}
                    className={`p-2 rounded-lg text-center text-xs font-medium border transition-colors cursor-pointer ${
                      idleTimeout === item.value
                        ? 'bg-green-700/20 border-green-600 text-green-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cloudinary Configuration */}
          <form onSubmit={handleSaveCloudinary} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Cloud className="w-4 h-4 text-green-400" />
              <span>Configuration du Stockage Cloudinary (GED &amp; Scans)</span>
            </div>
            <p className="text-slate-400">
              Conformément à la spécification, les fichiers sont stockés sur Cloudinary (et non Firebase Storage).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Cloud Name</label>
                <input
                  type="text"
                  value={cloudinaryConfig.cloudName}
                  onChange={(e) => setCloudinaryConfig({ ...cloudinaryConfig, cloudName: e.target.value })}
                  placeholder="ex: coresi-industrial"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-green-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Upload Preset (Non signé)</label>
                <input
                  type="text"
                  value={cloudinaryConfig.uploadPreset}
                  onChange={(e) => setCloudinaryConfig({ ...cloudinaryConfig, uploadPreset: e.target.value })}
                  placeholder="ex: coresi_ged_unsigned"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-green-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-300 block mb-1 font-medium">Dossier Racine Cloudinary</label>
                <input
                  type="text"
                  value={cloudinaryConfig.folder}
                  onChange={(e) => setCloudinaryConfig({ ...cloudinaryConfig, folder: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-green-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Mode démonstration : génération automatique de métadonnées conformes Cloudinary.
              </span>
              <button
                type="submit"
                className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer</span>
              </button>
            </div>
            {savedSuccess && (
              <p className="text-emerald-400 text-xs flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Paramètres Cloudinary enregistrés avec succès.
              </p>
            )}
          </form>

          {/* Firebase Database Connection Status */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Base de Données Cloud Firestore</span>
            </div>
            <p className="text-slate-400">
              Projet Firebase lié : <span className="font-mono text-green-400">{firebaseConfig.projectId}</span>
            </p>
            <p className="text-slate-400">
              Règles Firestore : <span className="text-emerald-400 font-semibold">Déployées &amp; Sécurisées</span>
            </p>
          </div>

          {/* Reset Demo Data */}
          <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-semibold text-red-300">Réinitialiser les données de test</p>
              <p className="text-slate-400 text-[11px]">
                Recharge les chantiers, documents GED, factures et matériels industriels d'origine.
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Voulez-vous réinitialiser toutes les données à l\'état de démonstration initial ?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
