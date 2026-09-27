import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Printer,
  Sparkles,
  CheckCircle,
  FileText,
  X,
  Banknote,
  Wallet,
  Building2,
  TrendingDown,
  Calendar,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  User,
  Check,
} from 'lucide-react';
import {
  iswHrService,
  ISWEmployee,
  ISWAttendance,
  ISWDelay,
  ISWOvertime,
  ISWPayroll,
  ISWLeave,
  ISWSettings,
} from '../../services/iswHrService';
import { exportToPDF, exportToExcel, formatFCFA } from '../../services/exportService';

interface PayrollModuleProps {
  periods?: any[];
  payslips?: any[];
  employees?: any[];
  onRefresh?: () => void;
  showToast?: (msg: string) => void;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({ showToast }) => {
  const [employees, setEmployees] = useState<ISWEmployee[]>([]);
  const [attendance, setAttendance] = useState<ISWAttendance[]>([]);
  const [delays, setDelays] = useState<ISWDelay[]>([]);
  const [overtime, setOvertime] = useState<ISWOvertime[]>([]);
  const [payrolls, setPayrolls] = useState<ISWPayroll[]>([]);
  const [leavesList, setLeavesList] = useState<ISWLeave[]>([]);
  const [settings, setSettings] = useState<ISWSettings>({
    departments: [],
    contractTypes: [],
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
  });

  const getCurrentMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());
  const [selectedPayroll, setSelectedPayroll] = useState<ISWPayroll | null>(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [bonuses, setBonuses] = useState<Record<string, number | string>>({});

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const notify = (msg: string, isErr = false) => {
    if (showToast) showToast(msg);
    else console.log(`[CORESI Paie] ${isErr ? 'ERR' : 'OK'}: ${msg}`);
  };

  useEffect(() => {
    iswHrService.getEmployees().then(setEmployees);
    iswHrService.getSettings().then(setSettings);

    const unsubPay = iswHrService.subscribePayrolls(setPayrolls);
    const unsubAtt = iswHrService.subscribeAttendance(setAttendance);
    const unsubDel = iswHrService.subscribeDelays(setDelays);
    const unsubOvt = iswHrService.subscribeOvertime(setOvertime);
    const unsubLeaves = iswHrService.subscribeLeaves(setLeavesList);

    return () => {
      unsubPay();
      unsubAtt();
      unsubDel();
      unsubOvt();
      unsubLeaves();
    };
  }, []);

  const filteredPayrolls = payrolls.filter((p) => p.monthYear === selectedMonth);

  // Décomposition fiscale & sociale complète (Cameroun / OHADA)
  const getPayslipBreakdown = (payroll: Partial<ISWPayroll>, employee?: ISWEmployee) => {
    const grossSalary =
      Number(payroll.baseSalary || 0) + Number(payroll.bonus || 0) + Number(payroll.overtimePay || 0);

    let baseLine = Number(payroll.baseSalary) || Math.round(grossSalary * 0.6605);
    let seniorityLine = 0;
    let transportLine = 0;
    let deplacementLine = 0;
    let assiduiteLine = 0;

    if (grossSalary > 0) {
      seniorityLine = Math.round(grossSalary * 0.0472);
      transportLine = Math.round(grossSalary * 0.1421);
      deplacementLine = Math.round(grossSalary * 0.1096);
      assiduiteLine = Math.max(0, grossSalary - (baseLine + seniorityLine + transportLine + deplacementLine));
      if (assiduiteLine === 0 && (baseLine + seniorityLine + transportLine + deplacementLine) > grossSalary) {
        baseLine = grossSalary - (seniorityLine + transportLine + deplacementLine);
      }
    }

    const maxExoRate = (settings.deplacementExonereMaxRate ?? 30) / 100;
    const deplacementExonere = Math.min(deplacementLine, baseLine * maxExoRate);
    const deplacementTaxableCotisable = Math.max(0, deplacementLine - deplacementExonere);

    const brutTaxableMensuel =
      baseLine + seniorityLine + transportLine + assiduiteLine + deplacementTaxableCotisable;

    const plafondCNPS = settings.cnpsPlafondMensuel ?? 750000;
    const brutCotisableTotal = baseLine + seniorityLine + assiduiteLine + deplacementTaxableCotisable;
    const brutCotisableMensuel = Math.min(brutCotisableTotal, plafondCNPS);

    // 1. Charges Salariales
    const pvidSalRate = (settings.pensionSalarialeRate ?? 4.2) / 100;
    const pensionSalarial = Math.round(brutCotisableMensuel * pvidSalRate);

    const cfcSalRate = (settings.creditFoncierSalarialRate ?? 1.0) / 100;
    const creditFoncierSalarial = Math.round(brutTaxableMensuel * cfcSalRate);

    let ravSalarial = 0;
    if (brutTaxableMensuel > 50000) {
      if (brutTaxableMensuel <= 100000) ravSalarial = 750;
      else if (brutTaxableMensuel <= 200000) ravSalarial = 1950;
      else if (brutTaxableMensuel <= 300000) ravSalarial = 3250;
      else if (brutTaxableMensuel <= 400000) ravSalarial = 4550;
      else if (brutTaxableMensuel <= 500000) ravSalarial = 5850;
      else ravSalarial = 13000;
    }

    let tdlSalarial = 0;
    if (baseLine > 60000) {
      if (baseLine <= 100000) tdlSalarial = 500;
      else if (baseLine <= 200000) tdlSalarial = 1250;
      else if (baseLine <= 300000) tdlSalarial = 2000;
      else if (baseLine <= 400000) tdlSalarial = 2500;
      else tdlSalarial = 3000;
    }

    const brutTaxableAnnuel = brutTaxableMensuel * 12;
    const brutCotisableAnnuel = brutCotisableMensuel * 12;
    const fraisProRate = (settings.irppFraisProRate ?? 30) / 100;
    const fraisProfessionnels = brutTaxableAnnuel * fraisProRate;
    const pvidAnnuel = brutCotisableAnnuel * pvidSalRate;
    const abattementForfaitaire = settings.irppAbattementAnnuel ?? 500000;

    const deductionsAnnuelles = fraisProfessionnels + pvidAnnuel + abattementForfaitaire;
    const baseImposableAnnuelle = Math.max(0, brutTaxableAnnuel - deductionsAnnuelles);

    let irppAnnuel = 0;
    if (baseImposableAnnuelle > 0) {
      if (baseImposableAnnuelle <= 2000000) {
        irppAnnuel = baseImposableAnnuelle * 0.10;
      } else if (baseImposableAnnuelle <= 3000000) {
        irppAnnuel = 2000000 * 0.10 + (baseImposableAnnuelle - 2000000) * 0.15;
      } else if (baseImposableAnnuelle <= 5000000) {
        irppAnnuel = 2000000 * 0.10 + 1000000 * 0.15 + (baseImposableAnnuelle - 3000000) * 0.25;
      } else {
        irppAnnuel = 2000000 * 0.10 + 1000000 * 0.15 + 2000000 * 0.25 + (baseImposableAnnuelle - 5000000) * 0.35;
      }
    }

    const irppSalarial = Math.round(irppAnnuel / 12);
    const cacRate = (settings.cacIrppRate ?? 10) / 100;
    const cacSalarial = Math.round(irppSalarial * cacRate);

    const totSalarial =
      pensionSalarial + creditFoncierSalarial + ravSalarial + tdlSalarial + irppSalarial + cacSalarial;

    // 2. Cotisations Patronales
    const atRate = (settings.accidentTravailRate ?? 1.75) / 100;
    const afRate = (settings.allocationFamilialeRate ?? 7.0) / 100;
    const pvPatRate = (settings.pensionPatronaleRate ?? 4.2) / 100;
    const cfpPatRate = (settings.creditFoncierPatronalRate ?? 1.5) / 100;
    const fnePatRate = (settings.fnePatronalRate ?? 1.0) / 100;

    const atPatronal = Math.round(brutCotisableMensuel * atRate);
    const afPatronal = Math.round(brutCotisableMensuel * afRate);
    const pvPatronal = Math.round(brutCotisableMensuel * pvPatRate);
    const cfpPatronal = Math.round(grossSalary * cfpPatRate);
    const fnePatronal = Math.round(grossSalary * fnePatRate);

    const totPatronal = atPatronal + afPatronal + pvPatronal + cfpPatronal + fnePatronal;

    return {
      grossSalary,
      totSalarial,
      totPatronal,
      brutTaxableMensuel,
      brutCotisableMensuel,
      gains: {
        base: baseLine,
        seniority: seniorityLine,
        transport: transportLine,
        deplacement: deplacementLine,
        assiduite: assiduiteLine,
      },
      salariale: {
        pension: pensionSalarial,
        creditFoncier: creditFoncierSalarial,
        rav: ravSalarial,
        tdl: tdlSalarial,
        irpp: irppSalarial,
        cac: cacSalarial,
      },
      patronale: {
        at: atPatronal,
        af: afPatronal,
        pv: pvPatronal,
        cfp: cfpPatronal,
        fne: fnePatronal,
      },
    };
  };

  // Calcul & génération de masse des bulletins du mois
  const handleGeneratePayrolls = async () => {
    const activeEmployees = employees.filter((emp) => emp.status === 'Actif');
    if (activeEmployees.length === 0) {
      notify('Aucun collaborateur actif à traiter.', true);
      return;
    }

    try {
      const standardHours = settings.standardHours || 173;

      for (const emp of activeEmployees) {
        const baseSalary = Number(emp.baseSalary) || 0;
        const hourlyRate = baseSalary / standardHours;

        const empOt = overtime.find(
          (ot) => ot.employeeId === emp.id && ot.monthYear === selectedMonth
        );
        const overtimePay = empOt ? Number(empOt.amount || (empOt.hours * hourlyRate * (settings.overtimeRate || 1.25))) : 0;

        const empDelays = delays.filter(
          (d) =>
            d.employeeId === emp.id &&
            d.date &&
            d.date.startsWith(selectedMonth) &&
            d.status === 'Non justifié'
        );
        const delayMinutes = empDelays.reduce((sum, d) => sum + (Number(d.delayMinutes) || 0), 0);
        const delayDeduction = delayMinutes * (hourlyRate / 60);

        const bonus = Number(bonuses[emp.id]) || 0;
        const grossSalary = baseSalary + bonus + overtimePay;

        const tempPayroll = { baseSalary, bonus, overtimePay, delayDeduction };
        const breakdown = getPayslipBreakdown(tempPayroll, emp);
        const socialContribution = breakdown.totSalarial;
        const netSalary = Math.max(0, grossSalary - (socialContribution + delayDeduction));

        const payrollData: ISWPayroll = {
          id: `${emp.id}_${selectedMonth}`,
          employeeId: emp.id,
          monthYear: selectedMonth,
          baseSalary,
          bonus,
          delayDeduction: Number(delayDeduction.toFixed(2)),
          socialContribution: Number(socialContribution.toFixed(2)),
          overtimePay: Number(overtimePay.toFixed(2)),
          grossSalary: Number(grossSalary.toFixed(2)),
          netSalary: Number(netSalary.toFixed(2)),
          paymentStatus: 'En attente',
          paymentDate: null,
        };

        await iswHrService.savePayroll(payrollData);
      }
      notify(`Bulletins de paie du mois ${selectedMonth} calculés avec succès !`);
    } catch (err) {
      console.error(err);
      notify('Erreur lors du calcul des bulletins de paie.', true);
    }
  };

  // Marquer un bulletin comme payé
  const handleMarkAsPaid = async (payroll: ISWPayroll) => {
    try {
      const updated: ISWPayroll = {
        ...payroll,
        paymentStatus: 'Payé',
        paymentDate: new Date().toISOString().split('T')[0],
      };
      await iswHrService.savePayroll(updated);
      if (selectedPayroll && selectedPayroll.id === payroll.id) {
        setSelectedPayroll(updated);
      }
      notify(`Bulletin de ${payroll.employeeId} marqué comme réglé.`);
    } catch (err) {
      notify('Erreur lors du règlement du bulletin.', true);
    }
  };

  // Tout régler en masse
  const handlePayAll = async () => {
    const pending = filteredPayrolls.filter((p) => p.paymentStatus !== 'Payé');
    if (pending.length === 0) {
      notify('Aucun bulletin en attente pour ce mois.');
      return;
    }

    if (
      window.confirm(
        `Confirmez-vous le règlement groupé de ${pending.length} bulletins de salaire pour le mois ${selectedMonth} ?`
      )
    ) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        for (const pay of pending) {
          await iswHrService.savePayroll({
            ...pay,
            paymentStatus: 'Payé',
            paymentDate: todayStr,
          });
        }
        notify(`Les ${pending.length} bulletins ont été marqués comme réglés.`);
      } catch (err) {
        notify('Erreur lors du règlement groupé.', true);
      }
    }
  };

  const handleBonusChange = (empId: string, val: string) => {
    setBonuses((prev) => ({
      ...prev,
      [empId]: val,
    }));
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : id;
  };

  const getEmployeeDept = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.department : '-';
  };

  const getEmployeeRole = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.role : '-';
  };

  const getInitials = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    if (!emp) return '??';
    return `${(emp.firstName || '')[0] || ''}${(emp.lastName || '')[0] || ''}`.toUpperCase();
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Export PDF Bilan de Paie
  const handlePaiePDF = async () => {
    setExportingPDF(true);
    try {
      const cols = [
        'Matricule',
        'Nom & Prénom',
        'Poste',
        'Salaire Base',
        'Prime',
        'H.Sup',
        'Brut',
        'Cotisations',
        'Retard',
        'Net à Payer',
        'Statut',
      ];
      const rows = filteredPayrolls.map((pay) => {
        const emp = employees.find((e) => e.id === pay.employeeId);
        const gross = pay.baseSalary + pay.bonus + pay.overtimePay;
        return [
          pay.employeeId,
          emp ? `${emp.firstName} ${emp.lastName}` : pay.employeeId,
          emp ? emp.role : '-',
          formatFCFA(pay.baseSalary),
          pay.bonus > 0 ? formatFCFA(pay.bonus) : '-',
          pay.overtimePay > 0 ? formatFCFA(pay.overtimePay) : '-',
          formatFCFA(gross),
          formatFCFA(pay.socialContribution),
          pay.delayDeduction > 0 ? formatFCFA(pay.delayDeduction) : '-',
          formatFCFA(pay.netSalary),
          pay.paymentStatus,
        ];
      });

      const totalBrut = filteredPayrolls.reduce((s, p) => s + p.baseSalary + p.bonus + p.overtimePay, 0);
      const totalNet = filteredPayrolls.reduce((s, p) => s + p.netSalary, 0);
      const totalCot = filteredPayrolls.reduce((s, p) => s + p.socialContribution, 0);
      const totalRetard = filteredPayrolls.reduce((s, p) => s + p.delayDeduction, 0);
      const paysCount = filteredPayrolls.filter((p) => p.paymentStatus === 'Payé').length;

      const summary: [string, string][] = [
        ['Bulletins générés :', `${filteredPayrolls.length}`],
        ['Bulletins réglés :', `${paysCount} / ${filteredPayrolls.length}`],
        ['Masse salariale brute :', formatFCFA(totalBrut)],
        ['Total cotisations sociales :', formatFCFA(totalCot)],
        ['Total retenues retards :', formatFCFA(totalRetard)],
        ['Masse salariale nette à virer :', formatFCFA(totalNet)],
      ];

      const periodLabel = new Date(selectedMonth + '-01').toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
      await exportToPDF(
        'LIVRE DE PAIE & MASSE SALARIALE',
        periodLabel,
        cols,
        rows,
        `bilan-paie-${selectedMonth}`,
        summary
      );
      notify('Bilan de paie exporté en PDF.');
    } catch (err) {
      console.error(err);
      notify("Erreur lors de l'exportation du bilan de paie.", true);
    } finally {
      setExportingPDF(false);
    }
  };

  // Export Excel Bilan de Paie
  const handlePaieExcel = async () => {
    setExportingExcel(true);
    try {
      const cols = [
        'Matricule',
        'Nom & Prénom',
        'Poste',
        'Salaire Base',
        'Prime',
        'H.Sup',
        'Brut Total',
        'Cotisations Soc.',
        'Retenue Retard',
        'Net à Payer',
        'Statut',
      ];
      const rows = filteredPayrolls.map((pay) => {
        const emp = employees.find((e) => e.id === pay.employeeId);
        const gross = pay.baseSalary + pay.bonus + pay.overtimePay;
        return [
          pay.employeeId,
          emp ? `${emp.firstName} ${emp.lastName}` : pay.employeeId,
          emp ? emp.role : '-',
          pay.baseSalary,
          pay.bonus,
          pay.overtimePay,
          gross,
          pay.socialContribution,
          pay.delayDeduction,
          pay.netSalary,
          pay.paymentStatus,
        ];
      });

      const periodLabel = new Date(selectedMonth + '-01').toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
      await exportToExcel('Paie ' + periodLabel, cols, rows, `bilan-paie-${selectedMonth}`);
      notify('Livre de paie exporté en Excel.');
    } catch (err) {
      console.error(err);
      notify("Erreur lors de l'exportation Excel.", true);
    } finally {
      setExportingExcel(false);
    }
  };

  // Impression / Téléchargement du Bulletin individuel
  const handlePrintSlip = async () => {
    if (!selectedPayroll) return;
    const emp = employees.find((e) => e.id === selectedPayroll.employeeId);
    const element = document.getElementById('payslip-sheet');
    if (!element) return;

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 8,
        filename: `BULLETIN_PAIE_${emp ? emp.lastName.toUpperCase() : selectedPayroll.employeeId}_${selectedPayroll.monthYear}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      await html2pdf().set(opt).from(element).save();
      notify('Bulletin de paie téléchargé.');
    } catch (e) {
      console.error(e);
      window.print();
    }
  };

  // KPIs
  const totalGross = filteredPayrolls.reduce(
    (sum, p) => sum + (Number(p.baseSalary) || 0) + (Number(p.bonus) || 0) + (Number(p.overtimePay) || 0),
    0
  );
  const totalNet = filteredPayrolls.reduce((sum, p) => sum + (Number(p.netSalary) || 0), 0);
  const totalCotisations = filteredPayrolls.reduce((sum, p) => sum + (Number(p.socialContribution) || 0), 0);
  const totalRetenues = filteredPayrolls.reduce((sum, p) => sum + (Number(p.delayDeduction) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Sélecteur de période */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-emerald-400 rounded-lg border border-[#3B7A2C]/20">
              <Banknote className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Gestion de la Paie &amp; Rémunérations
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Génération automatisée des salaires, déductions pour retards injustifiés, retenues fiscales &amp; sociales (CNPS, IRPP) et bulletins conformes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-[#3B7A2C] dark:text-emerald-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handlePaiePDF}
            disabled={exportingPDF || filteredPayrolls.length === 0}
            className="px-3.5 py-2 bg-[#3B7A2C] hover:bg-[#2D6020] disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-[#3B7A2C]/20 transition-transform active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Livre de Paie (PDF)
          </button>
          <button
            onClick={handlePaieExcel}
            disabled={exportingExcel || filteredPayrolls.length === 0}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Livre de Paie (Excel)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Masse Brute</p>
            <h3 className="text-base font-black text-slate-800 dark:text-white truncate">{formatFCFA(totalGross)}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-green-500/10 text-[#3B7A2C] dark:text-emerald-400 border border-green-500/20 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Net à Virer</p>
            <h3 className="text-base font-black text-[#3B7A2C] dark:text-emerald-400 truncate">{formatFCFA(totalNet)}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cotisations Sociales</p>
            <h3 className="text-base font-black text-purple-600 dark:text-purple-400 truncate">{formatFCFA(totalCotisations)}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Retenues Retards</p>
            <h3 className="text-base font-black text-rose-600 dark:text-rose-400 truncate">{formatFCFA(totalRetenues)}</h3>
          </div>
        </div>
      </div>

      {/* Disposition principale : Formulaire de calcul & Cartes des bulletins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panneau de Génération & Ajustement des Primes */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs h-fit space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3B7A2C] dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Générer les Bulletins du Mois
            </h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Le moteur de calcul applique les formules conformes : assiettes fiscales &amp; sociales, déductions pour frais professionnels (30%), abattement annuel (500 000 FCFA), IRPP progressif, PVID (4,2%), Crédit Foncier, et déduction horaire exacte des retards constatés au pointage.
          </p>

          {/* Ajustement primes optionnelles */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Primes Exceptionnelles &amp; Bonus
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {employees.filter((e) => e.status === 'Actif').map((emp) => (
                <div key={emp.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate w-32">
                    {emp.firstName} {emp.lastName}
                  </span>
                  <input
                    type="number"
                    placeholder="Prime (FCFA)"
                    value={bonuses[emp.id] || ''}
                    onChange={(e) => handleBonusChange(emp.id, e.target.value)}
                    className="w-28 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#3B7A2C]"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleGeneratePayrolls}
            className="w-full py-3 bg-[#3B7A2C] hover:bg-[#2D6020] text-white font-bold rounded-xl text-xs shadow-md shadow-[#3B7A2C]/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Générer &amp; Calculer la Paie</span>
          </button>
        </div>

        {/* Liste des Bulletins calculés */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Bulletins de Paie ({filteredPayrolls.length})
              </h3>
              <span className="text-[10px] font-bold bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-emerald-400 px-2 py-0.5 rounded-full">
                {selectedMonth}
              </span>
            </div>

            {filteredPayrolls.some((p) => p.paymentStatus !== 'Payé') && (
              <button
                onClick={handlePayAll}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 text-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Tout Régler</span>
              </button>
            )}
          </div>

          {filteredPayrolls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <p className="font-semibold text-xs text-slate-500">Aucun bulletin généré pour {selectedMonth}</p>
              <p className="text-[11px] text-slate-400">Cliquez sur « Générer &amp; Calculer la Paie » dans le panneau de gauche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredPayrolls.map((pay) => {
                const gross = pay.baseSalary + pay.bonus + pay.overtimePay;
                const deductions = pay.socialContribution + pay.delayDeduction;
                const isPaid = pay.paymentStatus === 'Payé';
                const initials = getInitials(pay.employeeId);
                const name = getEmployeeName(pay.employeeId);
                const role = getEmployeeRole(pay.employeeId);
                const dept = getEmployeeDept(pay.employeeId);

                return (
                  <div
                    key={pay.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col bg-white dark:bg-slate-900"
                  >
                    {/* Header de la carte */}
                    <div
                      className="px-4 py-3 flex items-center gap-3"
                      style={{ background: 'linear-gradient(135deg, #1E3F15 0%, #3B7A2C 100%)' }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shrink-0">
                        <span className="text-white font-black text-xs tracking-wide">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-extrabold text-xs leading-tight truncate">{name}</p>
                        <p className="text-emerald-100 text-[10px] font-semibold truncate">{role}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold bg-white/20 text-white px-1.5 py-0.2 rounded-full">
                            {pay.employeeId}
                          </span>
                          <span className="text-[9px] text-emerald-100 font-medium truncate">
                            {dept}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Détails financiers */}
                    <div className="p-4 space-y-2.5 flex-1 text-xs">
                      {/* Salaire Brut */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 shrink-0">
                            <Banknote className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Salaire Brut</p>
                            <p className="text-[9px] text-slate-500">
                              Base: {formatFCFA(pay.baseSalary)}
                              {pay.bonus > 0 ? ` + Prime: ${formatFCFA(pay.bonus)}` : ''}
                              {pay.overtimePay > 0 ? ` + H.Sup: ${formatFCFA(pay.overtimePay)}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {formatFCFA(gross)}
                        </span>
                      </div>

                      {/* Retenues */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 shrink-0">
                            <TrendingDown className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Retenues</p>
                            <p className="text-[9px] text-rose-500">
                              Cotis: {formatFCFA(pay.socialContribution)}
                              {pay.delayDeduction > 0 ? ` | Retard: -${formatFCFA(pay.delayDeduction)}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="font-extrabold text-rose-600">
                          -{formatFCFA(deductions)}
                        </span>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#3B7A2C]/10 flex items-center justify-center text-[#3B7A2C] shrink-0">
                            <Wallet className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Net à Payer</span>
                        </div>
                        <span className="text-sm font-black text-[#3B7A2C] dark:text-emerald-400">
                          {formatFCFA(pay.netSalary)}
                        </span>
                      </div>
                    </div>

                    {/* Footer de la carte */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {pay.paymentStatus}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {!isPaid && (
                          <button
                            onClick={() => handleMarkAsPaid(pay)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg transition-colors cursor-pointer"
                            title="Régler le salaire"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPayroll(pay);
                            setIsSlipOpen(true);
                          }}
                          className="px-2.5 py-1 bg-[#3B7A2C] hover:bg-[#2D6020] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Consulter le bulletin"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Bulletin</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL BULLETIN DE PAIE INTERACTIF (CONFORME CAMEROUN / OHADA) */}
      {isSlipOpen && selectedPayroll && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[95vh]">
            {/* Header modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#3B7A2C]" />
                <h3 className="text-base font-extrabold text-slate-800">
                  Bulletin Officiel de Rémunération
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedPayroll.paymentStatus === 'En attente' && (
                  <button
                    onClick={() => handleMarkAsPaid(selectedPayroll)}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Régler le bulletin
                  </button>
                )}
                <button
                  onClick={handlePrintSlip}
                  className="px-3.5 py-1.5 bg-[#3B7A2C] hover:bg-[#2D6020] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Télécharger (PDF)
                </button>
                <button
                  onClick={() => setIsSlipOpen(false)}
                  className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corps du Bulletin Imprimable */}
            <div
              id="payslip-sheet"
              className="p-8 text-black bg-white select-none max-w-[210mm] w-full mx-auto overflow-y-auto flex-1 text-[9px] leading-tight"
              style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
            >
              {(() => {
                const emp = employees.find((e) => e.id === selectedPayroll.employeeId);
                const breakdown = getPayslipBreakdown(selectedPayroll, emp);
                const periodLabel = new Date(selectedPayroll.monthYear + '-01').toLocaleDateString('fr-FR', {
                  month: 'long',
                  year: 'numeric',
                });

                return (
                  <div className="space-y-4 border border-black p-4">
                    {/* EN-TÊTE BULLETIN CORESI */}
                    <div className="flex justify-between items-start border-b border-black pb-3">
                      <div>
                        <h1 className="text-base font-black tracking-tight text-[#3B7A2C]">
                          CORESI SARL
                        </h1>
                        <p className="text-[8px] font-bold text-slate-700">
                          Bureau d'Études &amp; Travaux Publics — Ingénierie &amp; GED
                        </p>
                        <p className="text-[7.5px] text-slate-600">
                          Zone Industrielle de Bassa, Douala — BP 4032 Cameroun
                        </p>
                        <p className="text-[7.5px] text-slate-600">
                          N° Contribuable: M051812739482P &bull; N° CNPS: 672-00192-K
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-block border border-black px-3 py-1 font-black text-[10px] bg-slate-100 uppercase">
                          BULLETIN DE PAIE
                        </span>
                        <p className="text-[8.5px] font-bold mt-1">Période : {periodLabel.toUpperCase()}</p>
                        <p className="text-[7.5px] text-slate-600">Paiement : {selectedPayroll.paymentStatus}</p>
                      </div>
                    </div>

                    {/* INFORMATIONS SALARIÉ */}
                    <div className="grid grid-cols-2 gap-4 border border-black p-2.5 bg-slate-50/50 text-[8.5px]">
                      <div>
                        <p><strong>Matricule :</strong> {selectedPayroll.employeeId}</p>
                        <p><strong>Collaborateur :</strong> {emp ? `${emp.firstName} ${emp.lastName}` : selectedPayroll.employeeId}</p>
                        <p><strong>Poste / Rôle :</strong> {emp?.role || '-'}</p>
                        <p><strong>Département :</strong> {emp?.department || '-'}</p>
                      </div>
                      <div>
                        <p><strong>N° CNPS Salarié :</strong> {emp?.cnpsNumber || 'En cours'}</p>
                        <p><strong>Qualification :</strong> {emp?.qualification || '-'}</p>
                        <p><strong>Catégorie / Niveau :</strong> {emp?.niveau || '7'} (Indice {emp?.indice || 'B'})</p>
                        <p><strong>Convention :</strong> {emp?.conventionCollective || 'Convention Collective BTP'}</p>
                      </div>
                    </div>

                    {/* TABLEAU DES GAINS & RETENUES */}
                    <table className="w-full border-collapse border border-black text-[8px] text-center">
                      <thead>
                        <tr className="bg-slate-100 font-bold border-b border-black">
                          <th className="border-r border-black p-1 text-left">Rubrique</th>
                          <th className="border-r border-black p-1">Base (FCFA)</th>
                          <th className="border-r border-black p-1">Taux Sal.</th>
                          <th className="border-r border-black p-1">Part Salariale</th>
                          <th className="border-r border-black p-1">Taux Pat.</th>
                          <th className="p-1">Part Patronale</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-black text-left">
                          <td className="p-1 border-r border-black font-bold">Salaire de base (173h)</td>
                          <td className="p-1 border-r border-black text-right">{formatNumber(breakdown.gains.base)}</td>
                          <td className="p-1 border-r border-black text-center">-</td>
                          <td className="p-1 border-r border-black text-right font-bold text-emerald-800">
                            +{formatNumber(breakdown.gains.base)}
                          </td>
                          <td className="p-1 border-r border-black text-center">-</td>
                          <td className="p-1 text-right">-</td>
                        </tr>

                        {selectedPayroll.bonus > 0 && (
                          <tr className="border-b border-black text-left">
                            <td className="p-1 border-r border-black font-bold">Primes Exceptionnelles &amp; Bonus</td>
                            <td className="p-1 border-r border-black text-right">{formatNumber(selectedPayroll.bonus)}</td>
                            <td className="p-1 border-r border-black text-center">-</td>
                            <td className="p-1 border-r border-black text-right font-bold text-emerald-800">
                              +{formatNumber(selectedPayroll.bonus)}
                            </td>
                            <td className="p-1 border-r border-black text-center">-</td>
                            <td className="p-1 text-right">-</td>
                          </tr>
                        )}

                        {selectedPayroll.overtimePay > 0 && (
                          <tr className="border-b border-black text-left">
                            <td className="p-1 border-r border-black font-bold">Heures Supplémentaires</td>
                            <td className="p-1 border-r border-black text-right">{formatNumber(selectedPayroll.overtimePay)}</td>
                            <td className="p-1 border-r border-black text-center">-</td>
                            <td className="p-1 border-r border-black text-right font-bold text-emerald-800">
                              +{formatNumber(selectedPayroll.overtimePay)}
                            </td>
                            <td className="p-1 border-r border-black text-center">-</td>
                            <td className="p-1 text-right">-</td>
                          </tr>
                        )}

                        {/* Charges Sociales */}
                        <tr className="border-b border-black text-left">
                          <td className="p-1 border-r border-black">Pension Vieillesse (PVID / CNPS)</td>
                          <td className="p-1 border-r border-black text-right">{formatNumber(breakdown.brutCotisableMensuel)}</td>
                          <td className="p-1 border-r border-black text-center">4.20%</td>
                          <td className="p-1 border-r border-black text-right text-rose-700">
                            -{formatNumber(breakdown.salariale.pension)}
                          </td>
                          <td className="p-1 border-r border-black text-center">4.20%</td>
                          <td className="p-1 text-right">{formatNumber(breakdown.patronale.pv)}</td>
                        </tr>

                        <tr className="border-b border-black text-left">
                          <td className="p-1 border-r border-black">Crédit Foncier du Cameroun (CFC)</td>
                          <td className="p-1 border-r border-black text-right">{formatNumber(breakdown.brutTaxableMensuel)}</td>
                          <td className="p-1 border-r border-black text-center">1.00%</td>
                          <td className="p-1 border-r border-black text-right text-rose-700">
                            -{formatNumber(breakdown.salariale.creditFoncier)}
                          </td>
                          <td className="p-1 border-r border-black text-center">1.50%</td>
                          <td className="p-1 text-right">{formatNumber(breakdown.patronale.cfp)}</td>
                        </tr>

                        <tr className="border-b border-black text-left">
                          <td className="p-1 border-r border-black">Accident du Travail (AT / CNPS)</td>
                          <td className="p-1 border-r border-black text-right">{formatNumber(breakdown.brutCotisableMensuel)}</td>
                          <td className="p-1 border-r border-black text-center">-</td>
                          <td className="p-1 border-r border-black text-right">-</td>
                          <td className="p-1 border-r border-black text-center">1.75%</td>
                          <td className="p-1 text-right">{formatNumber(breakdown.patronale.at)}</td>
                        </tr>

                        <tr className="border-b border-black text-left">
                          <td className="p-1 border-r border-black">Allocations Familiales (AF / CNPS)</td>
                          <td className="p-1 border-r border-black text-right">{formatNumber(breakdown.brutCotisableMensuel)}</td>
                          <td className="p-1 border-r border-black text-center">-</td>
                          <td className="p-1 border-r border-black text-right">-</td>
                          <td className="p-1 border-r border-black text-center">7.00%</td>
                          <td className="p-1 text-right">{formatNumber(breakdown.patronale.af)}</td>
                        </tr>

                        <tr className="border-b border-black text-left">
                          <td className="p-1 border-r border-black">FNE (Fonds National de l'Emploi)</td>
                          <td className="p-1 border-r border-black text-right">{formatNumber(breakdown.grossSalary)}</td>
                          <td className="p-1 border-r border-black text-center">-</td>
                          <td className="p-1 border-r border-black text-right">-</td>
                          <td className="p-1 border-r border-black text-center">1.00%</td>
                          <td className="p-1 text-right">{formatNumber(breakdown.patronale.fne)}</td>
                        </tr>

                        {/* Fiscalité IRPP / CAC */}
                        <tr className="border-b border-black text-left">
                          <td className="p-1 border-r border-black">Impôt sur le Revenu (IRPP)</td>
                          <td className="p-1 border-r border-black text-right">{formatNumber(breakdown.brutTaxableMensuel)}</td>
                          <td className="p-1 border-r border-black text-center">Barème</td>
                          <td className="p-1 border-r border-black text-right text-rose-700">
                            -{formatNumber(breakdown.salariale.irpp)}
                          </td>
                          <td className="p-1 border-r border-black text-center">-</td>
                          <td className="p-1 text-right">-</td>
                        </tr>

                        <tr className="border-b border-black text-left">
                          <td className="p-1 border-r border-black">Centimes Add. Communaux (CAC 10%)</td>
                          <td className="p-1 border-r border-black text-right">{formatNumber(breakdown.salariale.irpp)}</td>
                          <td className="p-1 border-r border-black text-center">10%</td>
                          <td className="p-1 border-r border-black text-right text-rose-700">
                            -{formatNumber(breakdown.salariale.cac)}
                          </td>
                          <td className="p-1 border-r border-black text-center">-</td>
                          <td className="p-1 text-right">-</td>
                        </tr>

                        {/* Déduction pour retards non justifiés */}
                        {selectedPayroll.delayDeduction > 0 && (
                          <tr className="border-b border-black text-left bg-rose-50">
                            <td className="p-1 border-r border-black font-bold text-rose-700">
                              Retenue Retards Injustifiés (Pointage)
                            </td>
                            <td className="p-1 border-r border-black text-right">{formatNumber(selectedPayroll.baseSalary)}</td>
                            <td className="p-1 border-r border-black text-center">Pénalité</td>
                            <td className="p-1 border-r border-black text-right font-black text-rose-700">
                              -{formatNumber(selectedPayroll.delayDeduction)}
                            </td>
                            <td className="p-1 border-r border-black text-center">-</td>
                            <td className="p-1 text-right">-</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-black border-t-2 border-black">
                          <td className="p-1 text-left border-r border-black" colSpan={3}>
                            TOTAUX MENSUELS
                          </td>
                          <td className="p-1 border-r border-black text-right text-black">
                            {formatNumber(selectedPayroll.netSalary)}
                          </td>
                          <td className="p-1 border-r border-black text-center">-</td>
                          <td className="p-1 text-right">{formatNumber(breakdown.totPatronal)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* NET À PAYER ENCADRÉ */}
                    <div className="flex justify-between items-center border-2 border-black p-3 bg-emerald-50">
                      <div>
                        <p className="text-[8px] font-bold text-slate-700 uppercase">Net à Payer (FCFA)</p>
                        <p className="text-xs font-black text-slate-900">
                          {formatFCFA(selectedPayroll.netSalary)}
                        </p>
                      </div>
                      <div className="text-right text-[8px] font-bold text-slate-600">
                        Date de règlement : {selectedPayroll.paymentDate || 'En attente de virement'}
                      </div>
                    </div>

                    {/* SIGNATURES */}
                    <div className="grid grid-cols-2 gap-8 pt-4 text-center font-bold text-[8px]">
                      <div className="border border-black p-4 h-20 flex flex-col justify-between">
                        <span>ÉMARGEMENT DU SALARIÉ</span>
                        <span className="text-[7px] text-slate-400">« Lu et approuvé »</span>
                      </div>
                      <div className="border border-black p-4 h-20 flex flex-col justify-between">
                        <span>LE DIRECTEUR GÉNÉRAL — CORESI SARL</span>
                        <span className="text-[7px] text-slate-400">Signature et Cachet Officiel</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
