import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { CloudinaryService } from '../cloudinaryService';
import { AdminConfigService } from '../adminConfigService';

export interface SystemHealthReport {
  timestamp: string;
  firebaseAuth: {
    status: 'ok' | 'warning' | 'error';
    currentUser: string | null;
    message: string;
  };
  firestore: {
    status: 'ok' | 'warning' | 'error';
    latencyMs: number;
    message: string;
  };
  cloudinary: {
    status: 'ok' | 'warning' | 'error';
    cloudName: string;
    message: string;
  };
  modules: {
    status: 'ok' | 'warning' | 'error';
    activeCount: number;
    totalCount: number;
    message: string;
  };
  security: {
    status: 'ok' | 'warning' | 'error';
    lockedSectionsCount: number;
    sessionDurationMinutes: number;
    message: string;
  };
  overallStatus: 'ok' | 'warning' | 'error';
}

export class SystemHealthService {
  public static async runDiagnostics(): Promise<SystemHealthReport> {
    const report: SystemHealthReport = {
      timestamp: new Date().toISOString(),
      firebaseAuth: { status: 'ok', currentUser: null, message: '' },
      firestore: { status: 'ok', latencyMs: 0, message: '' },
      cloudinary: { status: 'ok', cloudName: '', message: '' },
      modules: { status: 'ok', activeCount: 0, totalCount: 0, message: '' },
      security: { status: 'ok', lockedSectionsCount: 0, sessionDurationMinutes: 60, message: '' },
      overallStatus: 'ok',
    };

    // 1. Check Firebase Auth
    if (auth.currentUser) {
      report.firebaseAuth = {
        status: 'ok',
        currentUser: auth.currentUser.email || auth.currentUser.uid,
        message: `Authentifié : ${auth.currentUser.email || auth.currentUser.uid}`,
      };
    } else {
      report.firebaseAuth = {
        status: 'warning',
        currentUser: null,
        message: 'Non connecté (mode local / invité)',
      };
    }

    // 2. Check Firestore Read / Write
    const start = performance.now();
    try {
      const testDocRef = doc(db, 'test', 'health-check');
      await setDoc(testDocRef, { checkAt: new Date().toISOString() });
      await getDoc(testDocRef);
      const elapsed = Math.round(performance.now() - start);
      report.firestore = {
        status: 'ok',
        latencyMs: elapsed,
        message: `Connecté à Firestore (latence : ${elapsed}ms)`,
      };
    } catch (err: any) {
      report.firestore = {
        status: 'error',
        latencyMs: -1,
        message: `Erreur Firestore : ${err.message || 'Échec de connexion'}`,
      };
      report.overallStatus = 'error';
    }

    // 3. Check Cloudinary
    const cloudConfig = CloudinaryService.getConfig();
    if (cloudConfig.cloudName && cloudConfig.cloudName !== 'coresi-industrial') {
      report.cloudinary = {
        status: 'ok',
        cloudName: cloudConfig.cloudName,
        message: `Environnement configuré (${cloudConfig.cloudName})`,
      };
    } else {
      report.cloudinary = {
        status: 'warning',
        cloudName: cloudConfig.cloudName,
        message: 'Utilisation du cloud de démonstration local',
      };
    }

    // 4. Check Modules
    const modules = AdminConfigService.getModules();
    const active = modules.filter((m) => m.enabled).length;
    report.modules = {
      status: active > 0 ? 'ok' : 'warning',
      activeCount: active,
      totalCount: modules.length,
      message: `${active} / ${modules.length} modules opérationnels`,
    };

    // 5. Check Security
    const sec = AdminConfigService.getSecuritySettings();
    report.security = {
      status: 'ok',
      lockedSectionsCount: sec.lockedSections.length,
      sessionDurationMinutes: sec.sessionDurationMinutes,
      message: `Sessions ${sec.sessionDurationMinutes} min • ${sec.lockedSections.length} sections verrouillées`,
    };

    return report;
  }
}
