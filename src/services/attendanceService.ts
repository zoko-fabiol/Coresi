/**
 * attendanceService.ts - CORESI ERP
 * Service de gestion des pointages, présences, retards et heures supplémentaires
 */

import { AttendanceRecord, OvertimeRecord, Employee } from '../types';

const ATTENDANCE_KEY = 'coresi_attendance_records_v1';
const OVERTIME_KEY = 'coresi_overtime_records_v1';

export class AttendanceService {
  /**
   * Initialise les données de démonstration réalistes pour les chantiers CORESI
   */
  private static getSeedAttendance(employees: Employee[]): AttendanceRecord[] {
    const today = new Date().toISOString().split('T')[0];
    const records: AttendanceRecord[] = [];

    const baseTimes = [
      { checkIn: '06:55', checkOut: '16:30', status: 'present' as const, delay: 0 },
      { checkIn: '07:00', checkOut: '17:00', status: 'present' as const, delay: 0 },
      { checkIn: '07:25', checkOut: '16:45', status: 'retard' as const, delay: 25 },
      { checkIn: '06:50', checkOut: '18:15', status: 'present' as const, delay: 0 },
    ];

    employees.slice(0, 8).forEach((emp, idx) => {
      const t = baseTimes[idx % baseTimes.length];
      records.push({
        id: `att-${Date.now()}-${idx}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        matricule: emp.matricule || `COR-00${idx + 1}`,
        date: today,
        checkInTime: t.checkIn,
        checkOutTime: t.checkOut,
        status: t.status,
        delayMinutes: t.delay,
        overtimeMinutes: idx % 3 === 0 ? 90 : 0,
        siteName: emp.location || 'Base Djeno',
        comment: t.delay > 0 ? 'Retard transport navette' : undefined,
      });
    });

    return records;
  }

  public static getRecords(employees: Employee[] = []): AttendanceRecord[] {
    try {
      const raw = localStorage.getItem(ATTENDANCE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    const seed = this.getSeedAttendance(employees);
    this.saveRecords(seed);
    return seed;
  }

  public static saveRecords(records: AttendanceRecord[]): void {
    try {
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error(e);
    }
  }

  public static recordCheckIn(
    employee: Employee,
    checkInTime: string,
    siteName = 'Base Djeno'
  ): AttendanceRecord {
    const records = this.getRecords();
    const today = new Date().toISOString().split('T')[0];

    // Standard work start is 07:00
    const [h, m] = checkInTime.split(':').map(Number);
    const checkInMins = h * 60 + m;
    const standardStart = 7 * 60; // 07:00
    const delay = Math.max(0, checkInMins - standardStart);
    const status = delay > 10 ? 'retard' : 'present';

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      matricule: employee.matricule,
      date: today,
      checkInTime,
      status,
      delayMinutes: delay,
      overtimeMinutes: 0,
      siteName,
    };

    // Replace if already exists for today
    const filtered = records.filter(
      (r) => !(r.employeeId === employee.id && r.date === today)
    );
    const updated = [newRecord, ...filtered];
    this.saveRecords(updated);
    return newRecord;
  }

  public static recordCheckOut(recordId: string, checkOutTime: string): void {
    const records = this.getRecords();
    const target = records.find((r) => r.id === recordId);
    if (!target) return;

    target.checkOutTime = checkOutTime;
    // Overtime past 16:30 (standard shift: 07:00 - 16:30)
    const [h, m] = checkOutTime.split(':').map(Number);
    const checkOutMins = h * 60 + m;
    const standardEnd = 16 * 60 + 30;
    target.overtimeMinutes = Math.max(0, checkOutMins - standardEnd);

    this.saveRecords(records);
  }

  // --- OVERTIME RECORDS ---
  public static getOvertimeRecords(): OvertimeRecord[] {
    try {
      const raw = localStorage.getItem(OVERTIME_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'ot-1',
        employeeId: 'emp-1',
        employeeName: 'Moussa Traoré',
        matricule: 'COR-001',
        date: new Date().toISOString().split('T')[0],
        hoursCount: 3.5,
        rate: '50%',
        taskDescription: 'Soudure d’urgence ligne haute pression Djeno',
        status: 'valide',
        validatedBy: 'Ing. Paul Kimbembe (Chef Chantier)',
      },
      {
        id: 'ot-2',
        employeeId: 'emp-2',
        employeeName: 'Benoît Mavoungou',
        matricule: 'COR-002',
        date: new Date().toISOString().split('T')[0],
        hoursCount: 2,
        rate: '25%',
        taskDescription: 'Épreuve hydrostatique collecteur 6 pouces',
        status: 'soumis',
      },
    ];
  }

  public static saveOvertimeRecords(records: OvertimeRecord[]): void {
    try {
      localStorage.setItem(OVERTIME_KEY, JSON.stringify(records));
    } catch (e) {
      console.error(e);
    }
  }

  public static addOvertimeRecord(ot: Omit<OvertimeRecord, 'id' | 'status'>): OvertimeRecord {
    const records = this.getOvertimeRecords();
    const newRecord: OvertimeRecord = {
      ...ot,
      id: `ot-${Date.now()}`,
      status: 'soumis',
    };
    records.unshift(newRecord);
    this.saveOvertimeRecords(records);
    return newRecord;
  }

  public static validateOvertime(recordId: string, validatorName: string): void {
    const records = this.getOvertimeRecords();
    const target = records.find((r) => r.id === recordId);
    if (!target) return;
    target.status = 'valide';
    target.validatedBy = validatorName;
    this.saveOvertimeRecords(records);
  }
}
