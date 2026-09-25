import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Shield,
  Cloud,
  Database,
  Layers,
  Key,
  Clock,
} from 'lucide-react';
import { SystemHealthService, SystemHealthReport } from '../../services/system/healthService';

export const SystemHealthView: React.FC = () => {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const runCheck = async () => {
    setIsLoading(true);
    try {
      const res = await SystemHealthService.runDiagnostics();
      setReport(res);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const renderStatusBadge = (status: 'ok' | 'warning' | 'error') => {
    if (status === 'ok') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/60 border border-emerald-800 text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Opérationnel</span>
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/60 border border-amber-800 text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Avertissement</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-950/60 border border-red-800 text-red-300">
        <XCircle className="w-3.5 h-3.5 text-red-400" />
        <span>Erreur</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Contrôle de Santé &amp; Télémétrie Système</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Vérification en direct de la connectivité Firebase, Cloud Firestore, Cloudinary et des politiques de sécurité.
          </p>
        </div>

        <button
          onClick={runCheck}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Test en cours...' : 'Exécuter le diagnostic'}</span>
        </button>
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Firestore Check */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Base Firestore</span>
              </div>
              {renderStatusBadge(report.firestore.status)}
            </div>
            <p className="text-xs text-slate-300">{report.firestore.message}</p>
            {report.firestore.latencyMs >= 0 && (
              <p className="text-[11px] text-slate-500">
                Temps d'aller-retour : <span className="font-mono text-cyan-300">{report.firestore.latencyMs} ms</span>
              </p>
            )}
          </div>

          {/* Firebase Auth Check */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Authentication</span>
              </div>
              {renderStatusBadge(report.firebaseAuth.status)}
            </div>
            <p className="text-xs text-slate-300">{report.firebaseAuth.message}</p>
            <p className="text-[11px] text-slate-500">
              Contrôle des sessions et jetons d'accès JWT
            </p>
          </div>

          {/* Cloudinary Check */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Cloud className="w-4 h-4 text-blue-400" />
                <span>Stockage Cloudinary</span>
              </div>
              {renderStatusBadge(report.cloudinary.status)}
            </div>
            <p className="text-xs text-slate-300">{report.cloudinary.message}</p>
            <p className="text-[11px] text-slate-500">
              Hébergement des scans GED et justificatifs
            </p>
          </div>

          {/* Modules Check */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Architecture Modules</span>
              </div>
              {renderStatusBadge(report.modules.status)}
            </div>
            <p className="text-xs text-slate-300">{report.modules.message}</p>
            <p className="text-[11px] text-slate-500">
              Contrôle de dépendances inter-modules actif
            </p>
          </div>

          {/* Security & Sessions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Politique de Sécurité</span>
              </div>
              {renderStatusBadge(report.security.status)}
            </div>
            <p className="text-xs text-slate-300">{report.security.message}</p>
            <p className="text-[11px] text-slate-500">
              Règles Firestore et journal d'audit immuable
            </p>
          </div>

          {/* Diagnostics Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Horodatage Télémétrie</span>
              </div>
              {renderStatusBadge(report.overallStatus)}
            </div>
            <p className="text-xs text-slate-300">
              Dernière exécution : {new Date(report.timestamp).toLocaleTimeString('fr-FR')}
            </p>
            <p className="text-[11px] text-slate-500">
              Application prête pour utilisation collaborative
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
