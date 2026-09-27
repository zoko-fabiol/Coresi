/**
 * iswHrService.ts - CORESI SARL
 * Service de persistance et de synchronisation temps réel pour le Système de Pointage,
 * Gestion des Employés et Fiches de Paie / Salaires (adapté de l'architecture ISW Technosys).
 */

export interface ISWEmployee {
  id: string; // Matricule ex: COR-01 ou ISW01
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  jobType: string; // 'Temps plein' | 'Temps partiel'
  baseSalary: number;
  startDate: string;
  contractType: string; // 'CDI' | 'CDD' | 'Stage' | 'Freelance'
  gender: string; // 'Homme' | 'Femme'
  city: string;
  phone: string;
  email: string;
  status: 'Actif' | 'Inactif' | 'Suspendu' | 'Archivé';
  cnpsNumber?: string;
  indice?: string;
  niveau?: string;
  coefficient?: string;
  qualification?: string;
  conventionCollective?: string;
  avatarUrl?: string;
  firestoreId?: string;
}

export interface ISWAttendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: 'Présent' | 'Retard' | 'Absence justifiée' | 'Absence injustifiée' | 'Congé' | 'Maladie';
  reason?: string;
  arrivalTime?: string; // HH:MM
  expectedTime?: string; // HH:MM
  delayMinutes?: number;
  delayStatus?: 'Justifié' | 'Non justifié';
  presentDays?: number;
  workableDays?: number;
}

export interface ISWDelay {
  id: string;
  employeeId: string;
  date: string;
  arrivalTime: string;
  expectedTime: string;
  delayMinutes: number;
  reason?: string;
  status: 'Justifié' | 'Non justifié';
}

export interface ISWLeave {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason?: string;
  status: 'Approuvé' | 'En attente' | 'Refusé';
  daysCount?: number;
}

export interface ISWOvertime {
  id: string;
  employeeId: string;
  monthYear: string; // YYYY-MM
  hours: number;
  rate?: number;
  amount?: number;
}

export interface ISWPayroll {
  id: string;
  employeeId: string;
  monthYear: string; // YYYY-MM
  baseSalary: number;
  bonus: number;
  overtimePay: number;
  transportAllowance?: number;
  grossSalary?: number;
  delayDeduction: number;
  socialContribution: number; // CNPS
  irppTax?: number;
  fraisPro?: number;
  netSalary: number;
  paymentStatus: 'Payé' | 'En attente' | 'Annulé';
  paymentDate: string | null;
  paymentMethod?: string;
  notes?: string;
}

export interface ISWSettings {
  departments: string[];
  contractTypes: string[];
  standardHours: number;
  expectedTime: string;
  socialContributionRate: number; // 12%
  overtimeRate: number; // 1.25
  irppFraisProRate: number;
  irppAbattementAnnuel: number;
  pensionSalarialeRate: number;
  pensionPatronaleRate: number;
  creditFoncierSalarialRate: number;
  creditFoncierPatronalRate: number;
  fnePatronalRate: number;
  accidentTravailRate: number;
  allocationFamilialeRate: number;
  deplacementExonereMaxRate: number;
  cnpsPlafondMensuel: number;
  cacIrppRate: number;
  companyName?: string;
  companyAddress?: string;
  companyTaxId?: string;
}

const DEFAULT_SETTINGS: ISWSettings = {
  departments: [
    'Direction Générale',
    'Bureau d\'Études & Ingénierie',
    'Travaux & Chantiers',
    'Génie Civil & Structure',
    'Comptabilité & Fiscalité',
    'Ressources Humaines',
    'HSE & Contrôle Qualité',
    'Logistique & Matériel',
    'Technico-commercial'
  ],
  contractTypes: ['CDI', 'CDD', 'Stage', 'Freelance', 'Prestation', 'Intérim'],
  standardHours: 173,
  expectedTime: '08:00',
  socialContributionRate: 12,
  overtimeRate: 1.25,
  irppFraisProRate: 30,
  irppAbattementAnnuel: 500000,
  pensionSalarialeRate: 4.2,
  pensionPatronaleRate: 4.2,
  creditFoncierSalarialRate: 1.0,
  creditFoncierPatronalRate: 1.5,
  fnePatronalRate: 1.0,
  accidentTravailRate: 1.75,
  allocationFamilialeRate: 7.0,
  deplacementExonereMaxRate: 30,
  cnpsPlafondMensuel: 750000,
  cacIrppRate: 10,
  companyName: 'CORESI SARL',
  companyAddress: 'Zone Industrielle de Bassa, Douala — Cameroun',
  companyTaxId: 'M051812739482P',
};

const DEFAULT_EMPLOYEES: ISWEmployee[] = [
  {
    id: 'COR-01',
    firstName: 'Fabrice',
    lastName: 'NGUEGANG TCHINDA',
    role: 'Directeur Général & Ingénieur Principal',
    department: 'Direction Générale',
    jobType: 'Temps plein',
    baseSalary: 1600000,
    startDate: '2020-02-01',
    contractType: 'CDI',
    gender: 'Homme',
    city: 'Douala',
    phone: '+237 690 12 34 56',
    email: 'fabrice.nguegang@coresi.cm',
    status: 'Actif',
    cnpsNumber: '112-98432-88',
    indice: 'A',
    niveau: '10',
    coefficient: '450',
    qualification: 'Ingénieur Polytech Génie Civil',
    conventionCollective: 'CONVENTION COLLECTIVE NATIONALE DU BÂTIMENT ET DES TRAVAUX PUBLICS'
  },
  {
    id: 'COR-02',
    firstName: 'Albertine',
    lastName: 'BIYIHA MAINA',
    role: 'Chef de Projet BTP & Ouvrages d\'Art',
    department: 'Travaux & Chantiers',
    jobType: 'Temps plein',
    baseSalary: 950000,
    startDate: '2021-04-15',
    contractType: 'CDI',
    gender: 'Femme',
    city: 'Kribi',
    phone: '+237 671 22 33 44',
    email: 'albertine.biyiha@coresi.cm',
    status: 'Actif',
    cnpsNumber: '221-55410-12',
    indice: 'B',
    niveau: '8',
    coefficient: '380',
    qualification: 'Conductrice Principale de Travaux',
    conventionCollective: 'CONVENTION COLLECTIVE NATIONALE DU BTP'
  },
  {
    id: 'COR-03',
    firstName: 'Willy Landry',
    lastName: 'DJOPNANG',
    role: 'Responsable Bureau d\'Études & Calculs',
    department: 'Bureau d\'Études & Ingénierie',
    jobType: 'Temps plein',
    baseSalary: 1100000,
    startDate: '2021-09-01',
    contractType: 'CDI',
    gender: 'Homme',
    city: 'Douala',
    phone: '+237 699 45 67 89',
    email: 'willy.djopnang@coresi.cm',
    status: 'Actif',
    cnpsNumber: '334-88912-70',
    indice: 'A',
    niveau: '9',
    coefficient: '410',
    qualification: 'Calculateur Senior Structures Béton/Métal',
    conventionCollective: 'CONVENTION COLLECTIVE NATIONALE DU BTP'
  },
  {
    id: 'COR-04',
    firstName: 'Diane Heliane',
    lastName: 'NGOUFFO',
    role: 'Responsable Administrative & Financière',
    department: 'Comptabilité & Fiscalité',
    jobType: 'Temps plein',
    baseSalary: 750000,
    startDate: '2022-03-01',
    contractType: 'CDI',
    gender: 'Femme',
    city: 'Douala',
    phone: '+237 655 78 90 12',
    email: 'diane.ngouffo@coresi.cm',
    status: 'Actif',
    cnpsNumber: '445-66712-44',
    indice: 'B',
    niveau: '7',
    coefficient: '350',
    qualification: 'Master Audit & Contrôle de Gestion',
    conventionCollective: 'CONVENTION COLLECTIVE NATIONALE DU COMMERCE & SERVICES'
  },
  {
    id: 'COR-05',
    firstName: 'Martine Letitia',
    lastName: 'TEUKAM',
    role: 'Coordinatrice RH & Paie',
    department: 'Ressources Humaines',
    jobType: 'Temps plein',
    baseSalary: 550000,
    startDate: '2023-01-10',
    contractType: 'CDI',
    gender: 'Femme',
    city: 'Douala',
    phone: '+237 677 34 56 78',
    email: 'martine.teukam@coresi.cm',
    status: 'Actif',
    cnpsNumber: '556-99123-66',
    indice: 'C',
    niveau: '7',
    coefficient: '300',
    qualification: 'Licence Gestion RH & Droit Social',
    conventionCollective: 'CONVENTION COLLECTIVE NATIONALE DU COMMERCE & SERVICES'
  },
  {
    id: 'COR-06',
    firstName: 'Cédric',
    lastName: 'BOUTCHOUANG NOUMBI',
    role: 'Technicien Supérieur Topographe & Métreur',
    department: 'Bureau d\'Études & Ingénierie',
    jobType: 'Temps plein',
    baseSalary: 500000,
    startDate: '2023-06-01',
    contractType: 'CDD',
    gender: 'Homme',
    city: 'Yaoundé',
    phone: '+237 691 67 89 01',
    email: 'cedric.boutchouang@coresi.cm',
    status: 'Actif',
    cnpsNumber: '667-11234-99',
    indice: 'C',
    niveau: '6',
    coefficient: '280',
    qualification: 'BTS Géomètre Topographe',
    conventionCollective: 'CONVENTION COLLECTIVE NATIONALE DU BTP'
  },
  {
    id: 'COR-07',
    firstName: 'Paul Éric',
    lastName: 'FOTSO KAMGA',
    role: 'Chef d\'Équipe Soudeur Tuyauterie Haute Pression',
    department: 'Travaux & Chantiers',
    jobType: 'Temps plein',
    baseSalary: 520000,
    startDate: '2022-08-15',
    contractType: 'CDI',
    gender: 'Homme',
    city: 'Kribi',
    phone: '+237 678 90 12 34',
    email: 'paul.fotso@coresi.cm',
    status: 'Actif',
    cnpsNumber: '778-33456-11',
    indice: 'D',
    niveau: '5',
    coefficient: '260',
    qualification: 'Soudeur Qualifié ASME IX / 6G',
    conventionCollective: 'CONVENTION COLLECTIVE NATIONALE DE LA MÉTALLURGIE'
  },
  {
    id: 'COR-08',
    firstName: 'Clarisse',
    lastName: 'MANGA EPOSSI',
    role: 'Ingénieure HSE & Sécurité Chantiers',
    department: 'HSE & Contrôle Qualité',
    jobType: 'Temps plein',
    baseSalary: 680000,
    startDate: '2023-02-01',
    contractType: 'CDI',
    gender: 'Femme',
    city: 'Douala',
    phone: '+237 694 56 78 90',
    email: 'clarisse.manga@coresi.cm',
    status: 'Actif',
    cnpsNumber: '889-44567-22',
    indice: 'B',
    niveau: '7',
    coefficient: '340',
    qualification: 'Master Qualité Sécurité Environnement',
    conventionCollective: 'CONVENTION COLLECTIVE NATIONALE DU BTP'
  }
];

// Helper pour initialiser les présences d'exemple
const generateInitialAttendance = (): ISWAttendance[] => {
  const records: ISWAttendance[] = [];
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const daysInMonth = 22; // Jours ouvrés
  
  DEFAULT_EMPLOYEES.forEach((emp, empIdx) => {
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const dateStr = `${currentMonth}-${dayStr}`;
      
      let status: ISWAttendance['status'] = 'Présent';
      let reason = '';
      let arrivalTime = '07:55';
      let delayMinutes = 0;
      let delayStatus: 'Justifié' | 'Non justifié' | undefined = undefined;

      // Varier quelques cas réalistes
      if (empIdx === 1 && day === 4) {
        status = 'Retard';
        arrivalTime = '08:35';
        delayMinutes = 35;
        delayStatus = 'Justifié';
        reason = 'Embouteillage axe lourd Kribi';
      } else if (empIdx === 5 && day === 11) {
        status = 'Retard';
        arrivalTime = '08:45';
        delayMinutes = 45;
        delayStatus = 'Non justifié';
        reason = 'Panne de réveil';
      } else if (empIdx === 6 && day === 15) {
        status = 'Absence justifiée';
        reason = 'Consultation médicale';
      } else if (empIdx === 3 && day === 18) {
        status = 'Congé';
        reason = 'Congé annuel payé';
      }

      records.push({
        id: `att_${emp.id}_${dateStr}`,
        employeeId: emp.id,
        date: dateStr,
        status,
        reason,
        arrivalTime,
        expectedTime: '08:00',
        delayMinutes,
        delayStatus,
        presentDays: status === 'Présent' || status === 'Retard' ? 1 : 0,
        workableDays: 1
      });
    }
  });

  return records;
};

const DEFAULT_ATTENDANCE: ISWAttendance[] = generateInitialAttendance();

const DEFAULT_DELAYS: ISWDelay[] = [
  {
    id: 'del_COR-02_04',
    employeeId: 'COR-02',
    date: `${new Date().toISOString().slice(0, 7)}-04`,
    arrivalTime: '08:35',
    expectedTime: '08:00',
    delayMinutes: 35,
    reason: 'Embouteillage axe lourd Kribi',
    status: 'Justifié'
  },
  {
    id: 'del_COR-06_11',
    employeeId: 'COR-06',
    date: `${new Date().toISOString().slice(0, 7)}-11`,
    arrivalTime: '08:45',
    expectedTime: '08:00',
    delayMinutes: 45,
    reason: 'Panne de réveil',
    status: 'Non justifié'
  }
];

const DEFAULT_PAYROLLS: ISWPayroll[] = DEFAULT_EMPLOYEES.map((emp) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const baseSalary = emp.baseSalary;
  const bonus = emp.id === 'COR-01' ? 150000 : emp.id === 'COR-07' ? 50000 : 0;
  const overtimePay = emp.id === 'COR-07' ? 45000 : 0;
  const grossSalary = baseSalary + bonus + overtimePay;
  const socialContribution = Math.round(grossSalary * 0.12);
  const delayDeduction = emp.id === 'COR-06' ? Math.round((baseSalary / 173) * (45 / 60)) : 0;
  const netSalary = grossSalary - socialContribution - delayDeduction;

  return {
    id: `pay_${emp.id}_${currentMonth}`,
    employeeId: emp.id,
    monthYear: currentMonth,
    baseSalary,
    bonus,
    overtimePay,
    grossSalary,
    delayDeduction,
    socialContribution,
    netSalary,
    paymentStatus: emp.id === 'COR-01' || emp.id === 'COR-04' ? 'Payé' : 'En attente',
    paymentDate: emp.id === 'COR-01' || emp.id === 'COR-04' ? `${currentMonth}-28` : null
  };
});

// Initialisation du stockage local
const initStorage = () => {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem('sirh_settings')) {
    localStorage.setItem('sirh_settings', JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem('sirh_employees')) {
    localStorage.setItem('sirh_employees', JSON.stringify(DEFAULT_EMPLOYEES));
  }
  if (!localStorage.getItem('sirh_attendance')) {
    localStorage.setItem('sirh_attendance', JSON.stringify(DEFAULT_ATTENDANCE));
  }
  if (!localStorage.getItem('sirh_delays')) {
    localStorage.setItem('sirh_delays', JSON.stringify(DEFAULT_DELAYS));
  }
  if (!localStorage.getItem('sirh_leaves')) {
    localStorage.setItem('sirh_leaves', JSON.stringify([]));
  }
  if (!localStorage.getItem('sirh_overtime')) {
    localStorage.setItem('sirh_overtime', JSON.stringify([]));
  }
  if (!localStorage.getItem('sirh_payrolls')) {
    localStorage.setItem('sirh_payrolls', JSON.stringify(DEFAULT_PAYROLLS));
  }
};

initStorage();

// Système d'abonnés temps réel
type ListenerCallback = (data: any) => void;
const listeners: Record<string, ListenerCallback[]> = {};

const subscribeKey = (key: string, callback: ListenerCallback) => {
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(callback);

  try {
    const raw = localStorage.getItem(`sirh_${key}`);
    if (raw) callback(JSON.parse(raw));
  } catch (e) {
    console.error(e);
  }

  return () => {
    listeners[key] = (listeners[key] || []).filter(cb => cb !== callback);
  };
};

const notifyListeners = (key: string) => {
  if (listeners[key]) {
    try {
      const raw = localStorage.getItem(`sirh_${key}`);
      const data = raw ? JSON.parse(raw) : null;
      listeners[key].forEach(cb => cb(data));
    } catch (e) {
      console.error(e);
    }
  }
};

export const iswHrService = {
  // Paramètres
  getSettings: async (): Promise<ISWSettings> => {
    initStorage();
    const raw = localStorage.getItem('sirh_settings');
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  },

  saveSettings: async (settings: ISWSettings): Promise<ISWSettings> => {
    localStorage.setItem('sirh_settings', JSON.stringify(settings));
    notifyListeners('settings');
    return settings;
  },

  // Employés
  getEmployees: async (): Promise<ISWEmployee[]> => {
    initStorage();
    const raw = localStorage.getItem('sirh_employees');
    return raw ? JSON.parse(raw) : DEFAULT_EMPLOYEES;
  },

  saveEmployee: async (employee: ISWEmployee): Promise<ISWEmployee> => {
    initStorage();
    const list: ISWEmployee[] = JSON.parse(localStorage.getItem('sirh_employees') || '[]');
    const idx = list.findIndex(e => e.id === employee.id);
    if (idx > -1) {
      list[idx] = employee;
    } else {
      list.push(employee);
    }
    localStorage.setItem('sirh_employees', JSON.stringify(list));
    notifyListeners('employees');
    return employee;
  },

  deleteEmployee: async (employeeId: string): Promise<string> => {
    initStorage();
    const list: ISWEmployee[] = JSON.parse(localStorage.getItem('sirh_employees') || '[]');
    const updated = list.filter(e => e.id !== employeeId);
    localStorage.setItem('sirh_employees', JSON.stringify(updated));
    notifyListeners('employees');

    // Cascade delete
    const collections = ['attendance', 'delays', 'leaves', 'overtime', 'payrolls'];
    collections.forEach(col => {
      const raw = localStorage.getItem(`sirh_${col}`);
      if (raw) {
        const items = JSON.parse(raw);
        const filtered = items.filter((it: any) => it.employeeId !== employeeId);
        localStorage.setItem(`sirh_${col}`, JSON.stringify(filtered));
        notifyListeners(col);
      }
    });

    return employeeId;
  },

  subscribeEmployees: (callback: (employees: ISWEmployee[]) => void) => {
    return subscribeKey('employees', callback);
  },

  // Pointage & Présences
  getAttendance: async (): Promise<ISWAttendance[]> => {
    initStorage();
    const raw = localStorage.getItem('sirh_attendance');
    return raw ? JSON.parse(raw) : [];
  },

  saveAttendance: async (att: Partial<ISWAttendance> & { employeeId: string; date: string }): Promise<ISWAttendance> => {
    initStorage();
    const list: ISWAttendance[] = JSON.parse(localStorage.getItem('sirh_attendance') || '[]');
    const id = att.id || `att_${att.employeeId}_${att.date}`;
    const fullRecord: ISWAttendance = {
      expectedTime: '08:00',
      reason: '',
      delayMinutes: 0,
      presentDays: att.status === 'Présent' || att.status === 'Retard' ? 1 : 0,
      workableDays: 1,
      ...att,
      id,
      employeeId: att.employeeId,
      date: att.date,
      status: att.status || 'Présent',
    };

    const idx = list.findIndex(a => a.id === id || (a.employeeId === att.employeeId && a.date === att.date));
    if (idx > -1) {
      list[idx] = { ...list[idx], ...fullRecord };
    } else {
      list.push(fullRecord);
    }

    localStorage.setItem('sirh_attendance', JSON.stringify(list));
    notifyListeners('attendance');

    // Mettre à jour automatiquement la table des retards si applicable
    if (fullRecord.status === 'Retard' || (fullRecord.delayMinutes && fullRecord.delayMinutes > 0)) {
      await iswHrService.saveDelay({
        id: `del_${fullRecord.employeeId}_${fullRecord.date}`,
        employeeId: fullRecord.employeeId,
        date: fullRecord.date,
        arrivalTime: fullRecord.arrivalTime || '08:15',
        expectedTime: fullRecord.expectedTime || '08:00',
        delayMinutes: fullRecord.delayMinutes || 15,
        reason: fullRecord.reason || '',
        status: fullRecord.delayStatus || 'Non justifié'
      });
    }

    return fullRecord;
  },

  deleteAttendance: async (attendanceId: string): Promise<string> => {
    initStorage();
    const list: ISWAttendance[] = JSON.parse(localStorage.getItem('sirh_attendance') || '[]');
    const updated = list.filter(a => a.id !== attendanceId);
    localStorage.setItem('sirh_attendance', JSON.stringify(updated));
    notifyListeners('attendance');
    return attendanceId;
  },

  subscribeAttendance: (callback: (attendance: ISWAttendance[]) => void) => {
    return subscribeKey('attendance', callback);
  },

  // Retards
  getDelays: async (): Promise<ISWDelay[]> => {
    initStorage();
    const raw = localStorage.getItem('sirh_delays');
    return raw ? JSON.parse(raw) : [];
  },

  saveDelay: async (delay: ISWDelay): Promise<ISWDelay> => {
    initStorage();
    const list: ISWDelay[] = JSON.parse(localStorage.getItem('sirh_delays') || '[]');
    const id = delay.id || `del_${delay.employeeId}_${delay.date}`;
    const delayWithId = { ...delay, id };
    const idx = list.findIndex(d => d.id === id);
    if (idx > -1) {
      list[idx] = delayWithId;
    } else {
      list.push(delayWithId);
    }
    localStorage.setItem('sirh_delays', JSON.stringify(list));
    notifyListeners('delays');
    return delayWithId;
  },

  deleteDelay: async (delayId: string): Promise<string> => {
    initStorage();
    const list: ISWDelay[] = JSON.parse(localStorage.getItem('sirh_delays') || '[]');
    const updated = list.filter(d => d.id !== delayId);
    localStorage.setItem('sirh_delays', JSON.stringify(updated));
    notifyListeners('delays');
    return delayId;
  },

  subscribeDelays: (callback: (delays: ISWDelay[]) => void) => {
    return subscribeKey('delays', callback);
  },

  // Heures supplémentaires
  getOvertime: async (): Promise<ISWOvertime[]> => {
    initStorage();
    const raw = localStorage.getItem('sirh_overtime');
    return raw ? JSON.parse(raw) : [];
  },

  saveOvertime: async (ot: ISWOvertime): Promise<ISWOvertime> => {
    initStorage();
    const list: ISWOvertime[] = JSON.parse(localStorage.getItem('sirh_overtime') || '[]');
    const id = ot.id || `${ot.employeeId}_${ot.monthYear}`;
    const item = { ...ot, id };
    const idx = list.findIndex(o => o.id === id);
    if (idx > -1) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    localStorage.setItem('sirh_overtime', JSON.stringify(list));
    notifyListeners('overtime');
    return item;
  },

  subscribeOvertime: (callback: (overtime: ISWOvertime[]) => void) => {
    return subscribeKey('overtime', callback);
  },

  // Congés
  getLeaves: async (): Promise<ISWLeave[]> => {
    initStorage();
    const raw = localStorage.getItem('sirh_leaves');
    return raw ? JSON.parse(raw) : [];
  },

  saveLeave: async (leave: ISWLeave): Promise<ISWLeave> => {
    initStorage();
    const list: ISWLeave[] = JSON.parse(localStorage.getItem('sirh_leaves') || '[]');
    const id = leave.id || `lv_${Date.now()}`;
    const item = { ...leave, id };
    const idx = list.findIndex(l => l.id === id);
    if (idx > -1) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    localStorage.setItem('sirh_leaves', JSON.stringify(list));
    notifyListeners('leaves');
    return item;
  },

  deleteLeave: async (leaveId: string): Promise<string> => {
    initStorage();
    const list: ISWLeave[] = JSON.parse(localStorage.getItem('sirh_leaves') || '[]');
    const updated = list.filter(l => l.id !== leaveId);
    localStorage.setItem('sirh_leaves', JSON.stringify(updated));
    notifyListeners('leaves');
    return leaveId;
  },

  subscribeLeaves: (callback: (leaves: ISWLeave[]) => void) => {
    return subscribeKey('leaves', callback);
  },

  // Paies & Salaires
  getPayrolls: async (): Promise<ISWPayroll[]> => {
    initStorage();
    const raw = localStorage.getItem('sirh_payrolls');
    return raw ? JSON.parse(raw) : [];
  },

  savePayroll: async (payroll: ISWPayroll): Promise<ISWPayroll> => {
    initStorage();
    const list: ISWPayroll[] = JSON.parse(localStorage.getItem('sirh_payrolls') || '[]');
    const id = payroll.id || `pay_${payroll.employeeId}_${payroll.monthYear}`;
    const item = { ...payroll, id };
    const idx = list.findIndex(p => p.id === id);
    if (idx > -1) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    localStorage.setItem('sirh_payrolls', JSON.stringify(list));
    notifyListeners('payrolls');
    return item;
  },

  subscribePayrolls: (callback: (payrolls: ISWPayroll[]) => void) => {
    return subscribeKey('payrolls', callback);
  },

  // Réinitialisation
  resetDatabase: async () => {
    localStorage.removeItem('sirh_settings');
    localStorage.removeItem('sirh_employees');
    localStorage.removeItem('sirh_attendance');
    localStorage.removeItem('sirh_delays');
    localStorage.removeItem('sirh_leaves');
    localStorage.removeItem('sirh_overtime');
    localStorage.removeItem('sirh_payrolls');
    initStorage();
    notifyListeners('settings');
    notifyListeners('employees');
    notifyListeners('attendance');
    notifyListeners('delays');
    notifyListeners('leaves');
    notifyListeners('overtime');
    notifyListeners('payrolls');
  }
};
