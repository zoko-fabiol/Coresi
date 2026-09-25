import { jsPDF } from 'jspdf';
import { PayrollPeriod, Payslip, PayrollSettings } from '../types/advancedModules';
import { DataService } from './dataService';
import { AdminConfigService } from './adminConfigService';

export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  currency: 'FCFA',
  standardWorkingDays: 22,
  standardWorkingHours: 173.33,
  employeeCnssRate: 0.042, // 4.2%
  employerCnssRate: 0.16, // 16%
  cnssCeiling: 1200000, // Plafond mensuel CNSS 1.2M FCFA
  irppBrackets: [
    { min: 0, max: 400000, rate: 0.01 },
    { min: 400001, max: 800000, rate: 0.10 },
    { min: 800001, max: 1500000, rate: 0.15 },
    { min: 1500001, max: 999999999, rate: 0.20 },
  ],
  standardTransportAllowance: 50000,
};

export class PayrollService {
  /**
   * Get configurable payroll settings
   */
  public static getSettings(): PayrollSettings {
    try {
      const saved = localStorage.getItem('coresi_payroll_settings');
      return saved ? JSON.parse(saved) : DEFAULT_PAYROLL_SETTINGS;
    } catch {
      return DEFAULT_PAYROLL_SETTINGS;
    }
  }

  /**
   * Save configurable payroll settings
   */
  public static saveSettings(settings: PayrollSettings): void {
    localStorage.setItem('coresi_payroll_settings', JSON.stringify(settings));
    DataService.logAudit('payroll_settings_updated', 'payrollSettings', 'global', 'Mise à jour des paramètres de paie et cotisations sociales');
  }

  /**
   * Calculates tax (IRPP) based on progressive tax brackets
   */
  public static calculateTax(taxableBase: number, settings: PayrollSettings): number {
    let tax = 0;
    for (const bracket of settings.irppBrackets) {
      if (taxableBase > bracket.min) {
        const taxableAmountInBracket = Math.min(taxableBase, bracket.max) - bracket.min;
        tax += taxableAmountInBracket * bracket.rate;
      }
    }
    return Math.round(tax);
  }

  /**
   * Calculate payslip for an employee given base parameters
   */
  public static calculateEmployeePayslip(params: {
    periodKey: string;
    periodId: string;
    employeeId: string;
    matricule: string;
    employeeName: string;
    department: string;
    role: string;
    contractType: string;
    baseSalary: number;
    workedDays?: number;
    overtimeHours?: number;
    seniorityYears?: number;
    isOffshore?: boolean;
    housingAllowance?: number;
    advanceDeduction?: number;
    paymentMethod?: 'virement' | 'especes' | 'cheque';
  }): Payslip {
    const settings = this.getSettings();
    const reference = AdminConfigService.getNextSequenceNumber('pay');

    // Overtime calculation
    const hourlyRate = params.baseSalary / settings.standardWorkingHours;
    const overtimeHours = params.overtimeHours || 0;
    const overtimeAmount = Math.round(overtimeHours * hourlyRate * 1.35); // 135% standard

    // Bonuses
    const seniorityYears = params.seniorityYears || 2;
    const seniorityBonus = Math.round(params.baseSalary * (seniorityYears * 0.02)); // 2% per year
    const offshoreBonus = params.isOffshore ? 250000 : 0;
    const hazardBonus = 75000;
    const transportAllowance = settings.standardTransportAllowance;
    const housingAllowance = params.housingAllowance || 0;

    const grossSalary =
      params.baseSalary +
      overtimeAmount +
      seniorityBonus +
      offshoreBonus +
      hazardBonus +
      transportAllowance +
      housingAllowance;

    // Social security
    const cnssBase = Math.min(grossSalary, settings.cnssCeiling);
    const employeeCnss = Math.round(cnssBase * settings.employeeCnssRate);
    const employerCnss = Math.round(cnssBase * settings.employerCnssRate);

    // Taxable salary
    const taxableBase = Math.max(0, grossSalary - employeeCnss - transportAllowance);
    const incomeTax = this.calculateTax(taxableBase, settings);

    const advanceDeduction = params.advanceDeduction || 0;
    const otherDeductions = 0;
    const totalDeductions = employeeCnss + incomeTax + advanceDeduction + otherDeductions;
    const netSalary = grossSalary - totalDeductions;
    const totalEmployerCost = grossSalary + employerCnss;

    return {
      id: `ps-${params.employeeId}-${params.periodKey}`,
      reference,
      periodId: params.periodId,
      periodKey: params.periodKey,
      employeeId: params.employeeId,
      matricule: params.matricule,
      employeeName: params.employeeName,
      department: params.department,
      role: params.role,
      contractType: params.contractType,
      baseSalary: params.baseSalary,
      workedDays: params.workedDays || settings.standardWorkingDays,
      overtimeHours,
      overtimeAmount,
      seniorityBonus,
      offshoreBonus,
      hazardBonus,
      transportAllowance,
      housingAllowance,
      grossSalary,
      employeeCnss,
      incomeTax,
      advanceDeduction,
      otherDeductions,
      totalDeductions,
      netSalary,
      employerCnss,
      totalEmployerCost,
      paymentMethod: params.paymentMethod || 'virement',
      paymentStatus: 'en_attente',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Computes a full payroll period for all active employees
   */
  public static async generatePayrollPeriod(periodKey: string): Promise<PayrollPeriod> {
    const existingPeriods = DataService.getPayrollPeriods();
    const existing = existingPeriods.find((p) => p.periodKey === periodKey);
    if (existing && existing.status === 'cloture') {
      throw new Error(`La période de paie ${periodKey} est déjà clôturée et verrouillée administrativement.`);
    }

    const employees = DataService.getEmployees().filter((e) => (e.status as string) !== 'archive' && (e.status as string) !== 'termine');
    const periodId = `pay-${periodKey}`;
    const [yearStr, monthStr] = periodKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const slips: Payslip[] = [];
    let totalGross = 0;
    let totalNet = 0;
    let totalDeductions = 0;
    let totalEmployerContributions = 0;

    for (const emp of employees) {
      const baseSalary = emp.salary || 650000;
      const isOffshore = emp.department === 'chaudronnerie' || emp.department === 'operations';

      const slip = this.calculateEmployeePayslip({
        periodKey,
        periodId,
        employeeId: emp.id,
        matricule: emp.matricule || `MAT-${emp.id.slice(-3)}`,
        employeeName: emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employé',
        department: emp.department,
        role: emp.role || 'Opérateur',
        contractType: emp.contractType || 'cdi',
        baseSalary,
        isOffshore,
      });

      slips.push(slip);
      totalGross += slip.grossSalary;
      totalNet += slip.netSalary;
      totalDeductions += slip.totalDeductions;
      totalEmployerContributions += slip.employerCnss;

      await DataService.savePayslip(slip);
    }

    const period: PayrollPeriod = {
      id: periodId,
      periodKey,
      month,
      year,
      status: 'controle',
      totalGross,
      totalNet,
      totalDeductions,
      totalEmployerContributions,
      employeesCount: slips.length,
      calculatedAt: new Date().toISOString(),
    };

    await DataService.savePayrollPeriod(period);
    return period;
  }

  /**
   * Validate payroll period (DG / Direction)
   */
  public static async validatePeriod(periodId: string, validatorName: string): Promise<void> {
    const periods = DataService.getPayrollPeriods();
    const period = periods.find((p) => p.id === periodId);
    if (!period) return;

    period.status = 'valide_dg';
    period.validatedBy = validatorName;
    period.validatedAt = new Date().toISOString();

    await DataService.savePayrollPeriod(period);
  }

  /**
   * Close and lock payroll period permanently
   */
  public static async closePeriod(periodId: string, closerName: string): Promise<void> {
    const periods = DataService.getPayrollPeriods();
    const period = periods.find((p) => p.id === periodId);
    if (!period) return;

    period.status = 'cloture';
    period.closedBy = closerName;
    period.closedAt = new Date().toISOString();

    await DataService.savePayrollPeriod(period);
  }

  /**
   * Generates a professional bulletin de paie in PDF via jsPDF
   */
  public static generatePayslipPdf(slip: Payslip): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const comp = AdminConfigService.getCompanySettings();

    // 1. Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 34, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(comp.name, 14, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`${comp.legalForm} • ${comp.registrationNumber} • ${comp.taxId}`, 14, 20);
    doc.text(`${comp.address}, ${comp.city} — ${comp.country}`, 14, 25);

    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 32, 210, 2, 'F');

    // 2. Title & Period
    let y = 46;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('BULLETIN DE PAIE INDIVIDUEL', 105, y, { align: 'center' });

    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`PÉRIODE : ${slip.periodKey} • RÉFÉRENCE : ${slip.reference}`, 105, y, { align: 'center' });

    y += 10;
    // Employee Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, 182, 30, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Salarié :', 20, y + 7);
    doc.text('Matricule :', 20, y + 14);
    doc.text('Département :', 20, y + 21);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(slip.employeeName, 55, y + 7);
    doc.text(slip.matricule, 55, y + 14);
    doc.text(slip.department.toUpperCase(), 55, y + 21);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Fonction / Poste :', 110, y + 7);
    doc.text('Type de contrat :', 110, y + 14);
    doc.text('Paiement :', 110, y + 21);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(slip.role, 145, y + 7);
    doc.text(slip.contractType.toUpperCase(), 145, y + 14);
    doc.text(slip.paymentMethod.toUpperCase(), 145, y + 21);

    y += 38;

    // Line items table
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('RUBRIQUES DE SALAIRE', 18, y + 5);
    doc.text('GAINS (FCFA)', 125, y + 5);
    doc.text('RETENUES (FCFA)', 160, y + 5);

    y += 10;
    const addRow = (label: string, gain?: number, deduction?: number, isBold = false) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(label, 18, y);
      if (gain !== undefined) {
        doc.text(gain.toLocaleString('fr-FR'), 145, y, { align: 'right' });
      }
      if (deduction !== undefined) {
        doc.setTextColor(220, 38, 38);
        doc.text(deduction.toLocaleString('fr-FR'), 188, y, { align: 'right' });
      }
      y += 6;
    };

    addRow('Salaire de base conventionnel', slip.baseSalary);
    if (slip.overtimeAmount > 0) {
      addRow(`Heures supplémentaires (${slip.overtimeHours}h)`, slip.overtimeAmount);
    }
    if (slip.seniorityBonus > 0) {
      addRow('Prime d\'ancienneté', slip.seniorityBonus);
    }
    if (slip.offshoreBonus > 0) {
      addRow('Prime de technicité / offshore', slip.offshoreBonus);
    }
    if (slip.hazardBonus > 0) {
      addRow('Prime de panier / risque industriel', slip.hazardBonus);
    }
    if (slip.transportAllowance > 0) {
      addRow('Indemnité forfaitaire de transport', slip.transportAllowance);
    }
    if (slip.housingAllowance > 0) {
      addRow('Indemnité de logement', slip.housingAllowance);
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, 196, y);
    y += 5;
    addRow('SALAIRE BRUT TOTAL', slip.grossSalary, undefined, true);
    y += 2;

    addRow('Cotisation sociale CNSS (Part Salariale 4.2%)', undefined, slip.employeeCnss);
    addRow('Impôt sur le Revenu des Personnes Physiques (IRPP)', undefined, slip.incomeTax);
    if (slip.advanceDeduction > 0) {
      addRow('Remboursement acompte / avance sur salaire', undefined, slip.advanceDeduction);
    }

    y += 4;
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, y, 182, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(22, 101, 52); // emerald-800
    doc.text('NET À PAYER AU SALARIÉ :', 20, y + 10.5);
    doc.text(`${slip.netSalary.toLocaleString('fr-FR')} FCFA`, 188, y + 10.5, { align: 'right' });

    y += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Cotisations patronales CNSS (16%) : ${slip.employerCnss.toLocaleString('fr-FR')} FCFA | Coût total employeur : ${slip.totalEmployerCost.toLocaleString('fr-FR')} FCFA`, 18, y);

    y += 22;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('DIRECTION DES RESSOURCES HUMAINES', 20, y);
    doc.text('DIRECTION GÉNÉRALE / DIRECTION FINANCIÈRE', 110, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Pour valoir ce que de droit selon la réglementation du travail en République du Congo.', 20, y);

    doc.save(`${slip.reference}_${slip.employeeName.replace(/\s+/g, '_')}.pdf`);
  }
}
