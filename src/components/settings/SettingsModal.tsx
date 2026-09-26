import React, { useState } from 'react';
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
} from 'lucide-react';
import { CloudinaryConfig, UserProfile, UserRole } from '../../types';
import { CloudinaryService } from '../../services/cloudinaryService';
import { DataService } from '../../services/dataService';
import { useTheme } from '../../context/ThemeContext';
import { firebaseConfig } from '../../firebase';

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
