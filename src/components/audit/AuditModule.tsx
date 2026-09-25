import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  History,
  FileText,
  DollarSign,
  FolderKanban,
  User,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { AuditLog } from '../../types';
import { DetailSidebar, SidebarSection, SidebarField, SidebarStatusBadge, SidebarDivider } from '../shared/DetailSidebar';

interface AuditModuleProps {
  auditLogs: AuditLog[];
}

export const AuditModule: React.FC<AuditModuleProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    if (entityFilter !== 'all' && log.entity !== entityFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.details.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Journal d'Audit &amp; Traçabilité Sécurité
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Enregistrement immuable des numérisations, écritures comptables, validations et accès aux documents confidentiels.
          </p>
        </div>

        <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 font-mono">
          {auditLogs.length} événements enregistrés
        </span>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par action, utilisateur ou mot-clé..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
        >
          <option value="all">Toutes les entités</option>
          <option value="document">Documents GED</option>
          <option value="project">Projets &amp; Chantiers</option>
          <option value="expense">Dépenses &amp; Justificatifs</option>
          <option value="invoice">Factures</option>
          <option value="user">Utilisateurs &amp; Rôles</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Horodatage</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entité</th>
                <th className="py-3 px-4">Utilisateur &amp; Rôle</th>
                <th className="py-3 px-4">Détails de l'opération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap group-hover:text-cyan-200">
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 uppercase text-[10px] text-slate-300 font-semibold">
                    {log.entity}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-white group-hover:text-cyan-100">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({log.userRole})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 leading-relaxed group-hover:text-white">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DetailSidebar: Audit Event Detail */}
      {selectedLog && (
        <DetailSidebar
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Action : ${selectedLog.action}`}
          subtitle={`Journalisé le ${new Date(selectedLog.timestamp).toLocaleString('fr-FR')}`}
          referenceCode={`LOG-${selectedLog.id.slice(0, 8)}`}
          badge={{
            text: selectedLog.entity.toUpperCase(),
            color: 'bg-rose-950 text-rose-400 border-rose-800'
          }}
        >
          {/* Section: Traçabilité */}
          <SidebarSection title="Traçabilité Sécurité & Utilisateur" icon={<ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}>
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <SidebarField label="Opérateur / Auteur" value={selectedLog.userName} highlight />
              <SidebarField label="Rôle Système" value={selectedLog.userRole.toUpperCase()} />
              <SidebarField label="Horodatage UTC" value={new Date(selectedLog.timestamp).toISOString()} mono />
              <SidebarField label="Action Système" value={selectedLog.action} mono />
              <SidebarField label="Entité Affectée" value={selectedLog.entity.toUpperCase()} />
              <SidebarField label="ID de l'Entité" value={selectedLog.entityId} mono />
            </div>
          </SidebarSection>

          <SidebarDivider />

          {/* Section: Détails de l'opération */}
          <SidebarSection title="Détails & Empreinte de l'Opération" icon={<FileText className="w-3.5 h-3.5 text-cyan-400" />}>
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {selectedLog.details}
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Intégrité des logs</span>
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Signé &amp; Immuable
                </span>
              </div>
            </div>
          </SidebarSection>
        </DetailSidebar>
      )}
    </div>
  );
};
