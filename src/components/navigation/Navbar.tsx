import React, { useState, useEffect } from 'react';
import {
  Camera,
  Settings,
  Shield,
  User,
  ChevronDown,
  Check,
  UserCheck,
  Building2,
  Sun,
  Moon,
  Cloud,
  LogOut,
  LogIn,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { ROLE_CONFIGS } from '../../services/rolePermissions';
import { DataService } from '../../services/dataService';
import { useTheme } from '../../context/ThemeContext';
import { auth, signInWithGoogle, signOutUser, subscribeToAuth } from '../../firebase';
import { User as FirebaseUser } from 'firebase/auth';

import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  currentUser: UserProfile;
  onOpenScanner: () => void;
  onOpenSettings: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  onOpenAuthModal?: () => void;
  onUserRoleChange: (newUser: UserProfile) => void;
  onGlobalSearch: (q: string) => void;
  pendingScansCount?: number;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenScanner,
  onOpenSettings,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onOpenAuthModal,
  onUserRoleChange,
  pendingScansCount = 0,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser: authUser, logout: authLogout } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);

  useEffect(() => {
    const unsub = subscribeToAuth((usr) => {
      setFirebaseUser(usr);
    });
    return () => unsub();
  }, []);

  const handleGoogleLogout = async () => {
    await authLogout();
    await signOutUser();
  };

  const currentRoleConfig = ROLE_CONFIGS[currentUser.role] || ROLE_CONFIGS.invite;

  const availableRoles: UserRole[] = ['dg', 'comptable', 'rh', 'chef_projet', 'magasinier', 'admin'];

  const handleSelectRole = (r: UserRole) => {
    const config = ROLE_CONFIGS[r];
    const updatedUser: UserProfile = {
      uid: `user-${r}`,
      email: 'clausephwandji2020@gmail.com',
      displayName: config.defaultUserName,
      role: r,
      department: config.department,
    };
    DataService.setCurrentUser(updatedUser);
    onUserRoleChange(updatedUser);
    setRoleDropdownOpen(false);
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 transition-colors">
      {/* Brand Logo & Name + Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 -ml-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden cursor-pointer transition-colors"
            title="Menu des modules"
            aria-label="Ouvrir le menu de navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 p-0.5 shadow-md flex items-center justify-center shrink-0">
          <div className="w-full h-full bg-[#0b111e] rounded-[10px] flex items-center justify-center">
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-amber-300 text-xs sm:text-sm tracking-wider">
              COR
            </span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-white tracking-wide truncate max-w-[130px] sm:max-w-none">
              CORESI <span className="text-cyan-700 dark:text-cyan-400 font-bold hidden xs:inline">INTERNATIONAL</span>
            </h1>
            <span className="text-[9px] bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded font-mono border hidden sm:inline">
              SARL
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden lg:block">
            Chaudronnerie • Tuyauterie • Ingénierie • GED Intégrée
          </p>
        </div>
      </div>

      {/* Global Quick Actions & Role Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Firebase Cloud Connection Status (Desktop Only) */}
        {firebaseUser ? (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-mono font-medium text-[11px] truncate max-w-[120px]">
              {authUser?.displayName || firebaseUser.email?.split('@')[0]}
            </span>
            <button
              onClick={handleGoogleLogout}
              className="ml-1 text-slate-500 hover:text-red-500 cursor-pointer"
              title="Se déconnecter"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            title="Connexion Sécurisée (Email / Mot de passe ou Google)"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden lg:inline text-[11px]">Connexion</span>
          </button>
        )}

        {/* Quick Role Switcher Dropdown (Desktop & Tablet) */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:hover:border-slate-700 border px-2.5 sm:px-3 py-1.5 rounded-xl cursor-pointer transition-all shadow-xs"
            title="Changer de rôle pour tester les accès"
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-[11px] font-bold shrink-0">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                <span>{currentRoleConfig.shortLabel}</span>
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[130px]">{currentUser.displayName}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0 ml-0.5" />
          </button>

          {/* Dropdown Menu */}
          {roleDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setRoleDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 mb-1">
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    Sélecteur de Rôle &amp; Droits d'Accès
                  </p>
                  <p className="text-slate-900 dark:text-white text-xs font-semibold mt-0.5">
                    Tester l'affichage des onglets par métier
                  </p>
                </div>

                <div className="space-y-1">
                  {availableRoles.map((roleKey) => {
                    const cfg = ROLE_CONFIGS[roleKey];
                    const isSelected = currentUser.role === roleKey;

                    return (
                      <button
                        key={roleKey}
                        onClick={() => handleSelectRole(roleKey)}
                        className={`w-full p-2.5 rounded-xl text-left flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-50 dark:bg-cyan-600/20 border border-cyan-300 dark:border-cyan-500/50 text-cyan-900 dark:text-cyan-200'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">{cfg.title}</span>
                            {roleKey === 'dg' && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1 py-0.2 rounded border border-emerald-300 dark:border-emerald-800 font-semibold">
                                100% Onglets
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {cfg.defaultUserName} ({cfg.department.toUpperCase()})
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                            {cfg.description}
                          </p>
                        </div>

                        {isSelected && (
                          <span className="p-1 bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 rounded-full mt-0.5 shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dark/Light Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer bg-white hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-300 shadow-xs flex items-center gap-1.5"
          title={theme === 'dark' ? 'Basculer en Mode Clair' : 'Basculer en Mode Sombre'}
          aria-label="Basculer le mode sombre ou clair"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline text-amber-300">Clair</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline text-slate-800 font-medium">Sombre</span>
            </>
          )}
        </button>

        {/* Prominent Smart Scanner button */}
        <button
          onClick={onOpenScanner}
          className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 sm:gap-2 shadow-md shadow-amber-500/20 transition-transform active:scale-95 cursor-pointer shrink-0"
          title="Numériser un document"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Scanner</span>
        </button>

        {/* Notifications button */}
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900 rounded-xl transition-colors cursor-pointer relative shrink-0"
            title="Centre de Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>
        )}

        {/* Settings button (Desktop only, accessible in menu on mobile) */}
        <button
          onClick={onOpenSettings}
          className="hidden sm:flex p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900 rounded-xl transition-colors cursor-pointer shrink-0"
          title="Paramètres Cloudinary &amp; Rôles"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
