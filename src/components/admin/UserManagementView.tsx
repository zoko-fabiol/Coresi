import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Search,
  Lock,
  Mail,
  UserCheck,
  UserX,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { AppUser, UserStatus } from '../../types/auth';
import { AuthService } from '../../services/auth/authService';
import { DataService } from '../../services/dataService';
import { UserRole } from '../../types';
import { ROLE_CONFIGS } from '../../services/rolePermissions';
import { DetailSidebar, SidebarSection, SidebarField, SidebarStatusBadge, SidebarDivider } from '../shared/DetailSidebar';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('employe');
  const [newDept, setNewDept] = useState('operations');

  const [notification, setNotification] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await AuthService.getAllUsers();
      setUsers(list);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleStatusToggle = async (user: AppUser) => {
    const nextStatus: UserStatus = user.status === 'actif' ? 'suspendu' : 'actif';
    const nextActive = nextStatus === 'actif';

    await AuthService.updateUserStatus(user.uid, nextStatus, nextActive);
    DataService.logAudit(
      'admin_user_status_changed',
      'user',
      user.uid,
      `Statut de l'utilisateur ${user.displayName} changé à : ${nextStatus.toUpperCase()}`
    );

    setNotification(`Statut de ${user.displayName} mis à jour : ${nextStatus.toUpperCase()}`);
    loadUsers();
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRoleChange = async (user: AppUser, nextRole: UserRole) => {
    await AuthService.updateUserRole(user.uid, nextRole);
    DataService.logAudit(
      'admin_user_role_changed',
      'user',
      user.uid,
      `Rôle de l'utilisateur ${user.displayName} changé de ${user.role} à ${nextRole}`
    );

    setNotification(`Rôle de ${user.displayName} mis à jour : ${nextRole.toUpperCase()}`);
    loadUsers();
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsLoading(true);
    try {
      await AuthService.registerUser(newEmail, newPassword, newName, newRole, newDept);
      DataService.logAudit(
        'admin_user_created',
        'user',
        newEmail,
        `Création de compte collaborateur pour ${newName} (${newEmail}) avec le rôle ${newRole}`
      );
      setShowAddModal(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNotification(`Compte créé avec succès pour ${newName}.`);
      loadUsers();
    } catch (err: any) {
      setModalError(err.message || 'Erreur lors de la création du compte.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Gestion des Comptes &amp; Rôles RBAC</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gérez les accès, affectez les rôles et contrôlez l'activation des collaborateurs dans Firestore.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={loadUsers}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-600/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Collaborateur</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email ou département..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Utilisateur</th>
                <th className="p-4">Département</th>
                <th className="p-4">Rôle Système</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Dernière Connexion</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleConfig = ROLE_CONFIGS[u.role] || ROLE_CONFIGS.invite;
                  const isActive = u.status === 'actif' && u.isActive !== false;

                  return (
                    <tr
                      key={u.uid}
                      onClick={() => setSelectedUser(u)}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="font-semibold text-white group-hover:text-cyan-200 transition-colors">{u.displayName || 'Sans nom'}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="p-4 capitalize">{u.department || 'Non défini'}</td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-semibold focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="dg">Direction Générale (DG)</option>
                          <option value="admin">Administrateur</option>
                          <option value="comptable">Comptable / Finance</option>
                          <option value="rh">Ressources Humaines (RH)</option>
                          <option value="chef_projet">Chef de Projet</option>
                          <option value="magasinier">Magasinier / Stock</option>
                          <option value="employe">Employé Standard</option>
                          <option value="invite">Invité (Lecture)</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isActive
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                              : 'bg-red-950/60 border-red-800 text-red-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                          />
                          {isActive ? 'Actif' : 'Suspendu'}
                        </span>
                      </td>
                      <td className="p-4 text-[11px] text-slate-400">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('fr-FR') : 'Jamais'}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleStatusToggle(u)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            isActive
                              ? 'border-red-800 text-red-400 hover:bg-red-950/40'
                              : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950/40'
                          }`}
                        >
                          {isActive ? 'Suspendre' : 'Réactiver'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h4 className="font-bold text-base text-white">Nouveau Collaborateur</h4>

            {modalError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ex: Paul Obiang"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email professionnel</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="paul.obiang@coresi.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mot de passe provisoire</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rôle</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Département</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="operations">Opérations</option>
                    <option value="finance">Finance</option>
                    <option value="rh">RH</option>
                    <option value="logistique">Logistique</option>
                    <option value="direction">Direction</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/20"
                >
                  {isLoading ? 'Création...' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DetailSidebar: User Profile & Permissions */}
      {selectedUser && (() => {
        const roleConf = ROLE_CONFIGS[selectedUser.role] || ROLE_CONFIGS.invite;
        const isActive = selectedUser.status === 'actif' && selectedUser.isActive !== false;
        return (
          <DetailSidebar
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
            title={selectedUser.displayName || 'Collaborateur'}
            subtitle={selectedUser.email}
            referenceCode={`UID-${selectedUser.uid.slice(0, 8)}`}
            badge={{
              text: roleConf.title,
              color: 'bg-cyan-950 text-cyan-400 border-cyan-800'
            }}
            actions={[
              {
                label: isActive ? 'Suspendre l\'accès' : 'Réactiver l\'accès',
                icon: isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />,
                onClick: () => {
                  handleStatusToggle(selectedUser);
                  setSelectedUser(null);
                },
                variant: isActive ? 'danger' : 'success'
              }
            ]}
          >
            {/* Section: Identité & Compte */}
            <SidebarSection title="Compte Collaborateur" icon={<Users className="w-3.5 h-3.5 text-cyan-400" />}>
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <SidebarField label="Nom Complet" value={selectedUser.displayName || '-'} highlight />
                <SidebarField label="Email Professionnel" value={selectedUser.email} mono />
                <SidebarField label="Département" value={selectedUser.department?.toUpperCase() || 'OPÉRATIONS'} />
                <SidebarField label="Statut du Compte" value={isActive ? 'Actif / Autorisé' : 'Suspendu / Verrouillé'} />
                <SidebarField label="Dernière Connexion" value={selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString('fr-FR') : 'Jamais connecté'} mono />
              </div>
            </SidebarSection>

            <SidebarDivider />

            {/* Section: Rôle et Permissions */}
            <SidebarSection title="Habilitations & Droits d'Accès" icon={<Shield className="w-3.5 h-3.5 text-amber-400" />}>
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Rôle Attribué :</span>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => {
                      const nextRole = e.target.value as UserRole;
                      handleRoleChange(selectedUser, nextRole);
                      setSelectedUser({ ...selectedUser, role: nextRole });
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300 focus:outline-none"
                  >
                    <option value="dg">Direction Générale (DG)</option>
                    <option value="admin">Administrateur</option>
                    <option value="comptable">Comptable / Finance</option>
                    <option value="rh">Ressources Humaines (RH)</option>
                    <option value="chef_projet">Chef de Projet</option>
                    <option value="magasinier">Magasinier / Stock</option>
                    <option value="employe">Employé Standard</option>
                    <option value="invite">Invité (Lecture)</option>
                  </select>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  {roleConf.description}
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">
                    Modules Accessibles :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {roleConf.allowedModules.map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </SidebarSection>
          </DetailSidebar>
        );
      })()}
    </div>
  );
};
