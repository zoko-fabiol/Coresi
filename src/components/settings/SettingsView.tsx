import React, { useState } from 'react';
import {
  Settings,
  Cloud,
  Database,
  UserCheck,
  RotateCcw,
  CheckCircle,
  Save,
  ArrowRight,
  Shield,
  FolderKanban,
  DollarSign,
  Users,
  Wrench,
  LayoutDashboard,
} from 'lucide-react';
import { CloudinaryConfig, UserProfile, UserRole } from '../../types';
import { CloudinaryService } from '../../services/cloudinaryService';
import { DataService } from '../../services/dataService';
import { firebaseConfig } from '../../firebase';

interface SettingsViewProps {
  currentUser: UserProfile;
  onUserChanged: (user: UserProfile, targetModule?: string) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onUserChanged,
  onResetData,
}) => {
  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig>(CloudinaryService.getConfig());
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveCloudinary = (e: React.FormEvent) => {
    e.preventDefault();
    CloudinaryService.saveConfig(cloudinaryConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const demoRoles: {
    role: UserRole;
    name: string;
    dept: string;
    label: string;
    targetModule: string;
    icon: any;
    description: string;
  }[] = [
    {
      role: 'dg',
      name: 'Dr. Joseph Ndoundo',
      dept: 'direction',
      label: 'Directeur Général (DG) - Accès Tous Modules',
      targetModule: 'dashboard',
      icon: LayoutDashboard,
      description: 'Accès 360° en temps réel, KPIs consolidés, finances, chantiers et rapports.',
    },
    {
      role: 'comptable',
      name: 'Clarisse Bantsimba',
      dept: 'comptabilite',
      label: 'Responsable Financier (RAF) - Factures & Dépenses',
      targetModule: 'finances',
      icon: DollarSign,
      description: 'Facturation clients/fournisseurs, caisse, mouvements bancaires et justificatifs.',
    },
    {
      role: 'chef_projet',
      name: 'Ing. Paul Kimbembe',
      dept: 'ingenierie',
      label: 'Chef de Projet Tuyauterie - Chantiers & Scans',
      targetModule: 'projects',
      icon: FolderKanban,
      description: 'Suivi avancement chantiers, plans techniques, PV épreuves et scans de terrain.',
    },
    {
      role: 'rh',
      name: 'Awa Diallo',
      dept: 'rh',
      label: 'Responsable RH - Gestion Personnel',
      targetModule: 'hr',
      icon: Users,
      description: 'Dossiers employés, certifications soudeurs ASME/CACES, congés et avances.',
    },
    {
      role: 'magasinier',
      name: 'Alexandre Makosso',
      dept: 'chaudronnerie',
      label: 'Chef Atelier & Magasinier - Matériel & Stocks',
      targetModule: 'materials',
      icon: Wrench,
      description: 'Bons de sortie/entrée de stock, suivi outillage lourd et carnet de révision.',
    },
    {
      role: 'admin',
      name: 'Administrateur Système',
      dept: 'direction',
      label: 'Admin - Droits Complets',
      targetModule: 'dashboard',
      icon: Shield,
      description: 'Administration globale, traçabilité des journaux d\'audit et configuration.',
    },
  ];

  const handleSelectRole = (r: typeof demoRoles[0]) => {
    const updatedUser: UserProfile = {
      uid: `user-${r.role}`,
      email: 'clausephwandji2020@gmail.com',
      displayName: r.name,
      role: r.role,
      department: r.dept,
    };
    DataService.setCurrentUser(updatedUser);
    onUserChanged(updatedUser, r.targetModule);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Paramètres &amp; Configuration Système
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Profil actif, simulateur de rôles pour la présentation commerciale et services connectés.
          </p>
        </div>
      </div>

      {/* Role switcher for commercial presentation */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <span>Simulateur de Rôle Utilisateur (Présentation Commerciale)</span>
          </div>
          <span className="text-xs text-cyan-400 bg-cyan-950 px-3 py-1 rounded-lg border border-cyan-800">
            Bascule instantanée
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Cliquez sur un rôle pour accéder immédiatement à l'espace de travail correspondant :
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {demoRoles.map((r) => {
            const Icon = r.icon;
            const isSelected = currentUser.role === r.role;

            return (
              <button
                key={r.role}
                type="button"
                onClick={() => handleSelectRole(r)}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-gradient-to-br from-cyan-950/80 to-blue-950/60 border-cyan-500 text-cyan-100 shadow-lg ring-1 ring-cyan-500/50'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 group-hover:text-cyan-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-bold text-white text-xs">{r.label}</p>
                      <p className="text-[10px] text-slate-400">{r.name} • {r.dept.toUpperCase()}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] bg-cyan-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full">
                      Actif
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mb-3">{r.description}</p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 font-semibold">
                  <span>Accéder à l'espace {r.targetModule.toUpperCase()}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cloudinary Configuration */}
      <form onSubmit={handleSaveCloudinary} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Cloud className="w-5 h-5 text-cyan-400" />
          <span>Configuration du Stockage Cloudinary (GED &amp; Scans)</span>
        </div>
        <p className="text-xs text-slate-400">
          Les fichiers numérisés et les documents PDF sont hébergés sur Cloudinary et indexés dans Firestore.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-medium">Cloud Name</label>
            <input
              type="text"
              value={cloudinaryConfig.cloudName}
              onChange={(e) => setCloudinaryConfig({ ...cloudinaryConfig, cloudName: e.target.value })}
              placeholder="ex: coresi-industrial"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-medium">Upload Preset (Non signé)</label>
            <input
              type="text"
              value={cloudinaryConfig.uploadPreset}
              onChange={(e) => setCloudinaryConfig({ ...cloudinaryConfig, uploadPreset: e.target.value })}
              placeholder="ex: coresi_ged_unsigned"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-slate-300 block mb-1 font-medium">Dossier Racine Cloudinary</label>
            <input
              type="text"
              value={cloudinaryConfig.folder}
              onChange={(e) => setCloudinaryConfig({ ...cloudinaryConfig, folder: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-500">
            Mode démonstration : génération automatique de métadonnées conformes Cloudinary.
          </span>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Enregistrer la Configuration</span>
          </button>
        </div>
        {savedSuccess && (
          <p className="text-emerald-400 text-xs flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Configuration Cloudinary enregistrée avec succès.
          </p>
        )}
      </form>

      {/* Cloud Firestore & Reset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-white font-bold">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Base Cloud Firestore</span>
          </div>
          <p className="text-slate-400">
            Projet Firebase lié : <span className="font-mono text-cyan-300">{firebaseConfig.projectId}</span>
          </p>
          <p className="text-slate-400">
            Règles de sécurité : <span className="text-emerald-400 font-semibold">Déployées &amp; Conformes</span>
          </p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-red-300">Réinitialiser les données de démo</p>
            <p className="text-slate-400 text-[11px]">
              Recharge les projets, GED, factures et stocks d'origine.
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Voulez-vous réinitialiser toutes les données à l\'état de démonstration initial ?')) {
                onResetData();
              }
            }}
            className="px-3 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>
    </div>
  );
};
