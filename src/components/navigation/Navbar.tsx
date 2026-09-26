import React, { useState, useEffect } from "react";
import {
  Camera,
  Settings,
  ChevronDown,
  Check,
  UserCheck,
  Sun,
  Moon,
  Cloud,
  LogOut,
  LogIn,
  Menu,
  X,
  Bell,
} from "lucide-react";
import { UserProfile, UserRole } from "../../types";
import { ROLE_CONFIGS } from "../../services/rolePermissions";
import { DataService } from "../../services/dataService";
import { useTheme } from "../../context/ThemeContext";
import { auth, signOutUser, subscribeToAuth } from "../../firebase";
import { User as FirebaseUser } from "firebase/auth";
import { useAuth } from "../../contexts/AuthContext";

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
    const unsub = subscribeToAuth((usr) => { setFirebaseUser(usr); });
    return () => unsub();
  }, []);

  const handleGoogleLogout = async () => {
    await authLogout();
    await signOutUser();
  };

  const currentRoleConfig = ROLE_CONFIGS[currentUser.role] || ROLE_CONFIGS.invite;
  const availableRoles: UserRole[] = ["dg", "comptable", "rh", "chef_projet", "magasinier", "admin"];

  const handleSelectRole = (r: UserRole) => {
    const config = ROLE_CONFIGS[r];
    const updatedUser: UserProfile = {
      uid: `user-${r}`,
      email: "clausephwandji2020@gmail.com",
      displayName: config.defaultUserName,
      role: r,
      department: config.department,
    };
    DataService.setCurrentUser(updatedUser);
    onUserRoleChange(updatedUser);
    setRoleDropdownOpen(false);
  };

  return (
    <header className="navbar-glass h-14 sm:h-16 px-3 sm:px-5 flex items-center justify-between gap-2 sticky top-0 z-30">

      {/* LEFT: Hamburger + Logo */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 -ml-1 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-900/80 transition-all active:scale-95 md:hidden cursor-pointer"
            aria-label="Menu de navigation"
          >
            {isMobileMenuOpen
              ? <X className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              : <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            }
          </button>
        )}

        <div className="logo-badge-glow w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 p-[2px] flex items-center justify-center shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-amber-300 to-orange-400 text-[10px] sm:text-xs tracking-wider">
              COR
            </span>
          </div>
        </div>

        <div className="hidden xs:block sm:block">
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-wide leading-none">
              CORESI
              <span className="text-cyan-600 dark:text-cyan-400 font-bold hidden sm:inline"> INTERNATIONAL</span>
            </h1>
            <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80 px-1.5 py-0.5 rounded font-mono font-bold hidden sm:inline">
              SARL
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 hidden lg:block leading-none mt-0.5 font-medium">
            Chaudronnerie · Tuyauterie · GED Industrielle
          </p>
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">

        {firebaseUser ? (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs backdrop-blur-sm">
            <span className="badge-live w-2 h-2 rounded-full bg-emerald-500 text-emerald-500 shrink-0" />
            <Cloud className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="font-mono font-semibold text-[11px] truncate max-w-[110px]">
              {authUser?.displayName || firebaseUser.email?.split("@")[0]}
            </span>
            <button onClick={handleGoogleLogout} className="ml-0.5 p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors rounded" title="Se deconnecter">
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-800/60 bg-cyan-50/70 hover:bg-cyan-100/80 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300 text-xs font-semibold cursor-pointer transition-all active:scale-95"
            title="Connexion securisee"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden lg:inline text-[11px]">Connexion</span>
          </button>
        )}

        {/* Role Switcher md+ only */}
        <div className="relative hidden md:block">
          <button onClick={() => setRoleDropdownOpen(!roleDropdownOpen)} className="nav-action-btn" title="Changer de role">
            <div className="w-5 h-5 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
              <UserCheck className="w-3 h-3" />
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-none">{currentRoleConfig.shortLabel}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[90px] leading-none mt-0.5">{currentUser.displayName}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {roleDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setRoleDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-md animate-slide-up">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Selecteur de Role &amp; Droits</p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">Tester l&apos;affichage par metier</p>
                </div>
                <div className="space-y-0.5">
                  {availableRoles.map((roleKey) => {
                    const cfg = ROLE_CONFIGS[roleKey];
                    const isSelected = currentUser.role === roleKey;
                    return (
                      <button
                        key={roleKey}
                        onClick={() => handleSelectRole(roleKey)}
                        className={`w-full p-2.5 rounded-xl text-left flex items-start justify-between gap-2 transition-all cursor-pointer ${isSelected ? "bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent"}`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">{cfg.title}</span>
                            {roleKey === "dg" && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-1 py-px rounded border border-emerald-200 dark:border-emerald-800 font-bold">100%</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{cfg.defaultUserName} · {cfg.department.toUpperCase()}</p>
                        </div>
                        {isSelected && (
                          <span className="p-1 bg-cyan-600 text-white rounded-full mt-0.5 shrink-0"><Check className="w-3 h-3 stroke-[3]" /></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle hidden on mobile */}
        <button onClick={toggleTheme} className="hidden sm:flex nav-action-btn p-2 sm:px-3 sm:py-1.5" title={theme === "dark" ? "Mode Clair" : "Mode Sombre"} aria-label="Basculer le mode">
          {theme === "dark" ? (
            <><Sun className="w-4 h-4 text-amber-400" /><span className="hidden lg:inline text-amber-500 font-semibold">Clair</span></>
          ) : (
            <><Moon className="w-4 h-4 text-indigo-500" /><span className="hidden lg:inline text-slate-700 font-semibold">Sombre</span></>
          )}
        </button>

        {/* Scanner CTA always visible */}
        <button
          onClick={onOpenScanner}
          className="scanner-btn-glow flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition-all active:scale-95 shrink-0"
          title="Numeriser un document"
        >
          <Camera className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline font-bold">Scanner</span>
        </button>

        {/* Notifications */}
        {onOpenNotifications && (
          <button onClick={onOpenNotifications} className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/80 transition-all cursor-pointer active:scale-95 shrink-0" title="Notifications">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center shadow-sm shadow-rose-500/50">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </button>
        )}

        {/* Settings desktop only */}
        <button onClick={onOpenSettings} className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/80 transition-all cursor-pointer active:scale-95 shrink-0" title="Parametres">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
