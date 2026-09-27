import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  Scale,
  Calendar,
  FileText,
  FileSpreadsheet,
  Download,
  Filter,
} from 'lucide-react';
import { iswHrService, ISWEmployee, ISWAttendance, ISWDelay, ISWSettings } from '../../../services/iswHrService';
import { exportToPDF, exportToExcel, formatFCFA } from '../../../services/exportService';

interface AttendanceTabProps {
  employees?: any[];
  showToast?: (msg: string) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ showToast }) => {
  const [employees, setEmployees] = useState<ISWEmployee[]>([]);
  const [attendanceList, setAttendanceList] = useState<ISWAttendance[]>([]);
  const [delaysList, setDelaysList] = useState<ISWDelay[]>([]);
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
  });

  const getCurrentMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid'); // 'grid' (Remplissage en groupe) ou 'cards' (Fiches individuelles)
  const [searchFilter, setSearchFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Formulaire Pointage Ponctuel
  const [empId, setEmpId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<ISWAttendance['status']>('Présent');
  const [reason, setReason] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [delayStatus, setDelayStatus] = useState<'Justifié' | 'Non justifié'>('Non justifié');
  const [expectedTime, setExpectedTime] = useState('08:00');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedEmployee, setSelectedEmployee] = useState<ISWEmployee | null>(null);

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Édition d'une cellule par clic direct
  const [editingCell, setEditingCell] = useState<{
    employee: ISWEmployee;
    dateStr: string;
    status: string;
    reason: string;
    arrivalTime: string;
    delayStatus: 'Justifié' | 'Non justifié';
  } | null>(null);

  // Modals d'export
  const [isWeeklyExportOpen, setIsWeeklyExportOpen] = useState(false);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [isDailyExportOpen, setIsDailyExportOpen] = useState(false);
  const [dailyExportDate, setDailyExportDate] = useState('');

  const notify = (msg: string, isError = false) => {
    if (showToast) {
      showToast(msg);
    } else {
      console.log(`[CORESI Pointage] ${isError ? 'ERR' : 'OK'}: ${msg}`);
    }
  };

  useEffect(() => {
    iswHrService.getEmployees().then(setEmployees);
    iswHrService.getSettings().then((s) => {
      setSettings(s);
      setExpectedTime(s.expectedTime || '08:00');
    });

    const unsubEmp = iswHrService.subscribeEmployees(setEmployees);
    const unsubAtt = iswHrService.subscribeAttendance(setAttendanceList);
    const unsubDel = iswHrService.subscribeDelays(setDelaysList);

    return () => {
      unsubEmp();
      unsubAtt();
      unsubDel();
    };
  }, []);

  // Centrer automatiquement sur la date du jour en vue grille
  useEffect(() => {
    if (viewMode === 'grid') {
      const timer = setTimeout(() => {
        const todayHeader = document.getElementById('today-column-header');
        if (todayHeader) {
          todayHeader.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [viewMode, selectedMonth, employees, attendanceList]);

  useEffect(() => {
    if (empId) {
      const emp = employees.find((e) => e.id === empId);
      setSelectedEmployee(emp || null);
    } else {
      setSelectedEmployee(null);
    }
    setErrors((prev) => ({ ...prev, empId: '' }));
  }, [empId, employees]);

  // Filtrage du mois
  const filteredAttendance = useMemo(() => {
    return attendanceList.filter((att) => att.date && att.date.startsWith(selectedMonth));
  }, [attendanceList, selectedMonth]);

  const filteredDelays = useMemo(() => {
    return delaysList.filter((d) => d.date && d.date.startsWith(selectedMonth));
  }, [delaysList, selectedMonth]);

  // Filtrage des employés actifs & recherche
  const displayEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (emp.status !== 'Actif') return false;
      if (deptFilter !== 'all' && emp.department !== deptFilter) return false;
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        emp.firstName.toLowerCase().includes(q) ||
        emp.lastName.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q)
      );
    });
  }, [employees, deptFilter, searchFilter]);

  // Calculs statistiques
  const totalWorkable = filteredAttendance.reduce((sum, att) => sum + (Number(att.workableDays) || 1), 0);
  const totalPresent = filteredAttendance.reduce((sum, att) => sum + (Number(att.presentDays) || 0), 0);
  const presenceRate = totalWorkable > 0 ? ((totalPresent / totalWorkable) * 100).toFixed(1) : '0.0';

  const totalMinutes = filteredDelays.reduce((sum, d) => sum + (Number(d.delayMinutes) || 0), 0);

  const totalPenalty = useMemo(() => {
    return filteredDelays
      .filter((d) => d.status === 'Non justifié')
      .reduce((sum, d) => {
        const emp = employees.find((e) => e.id === d.employeeId);
        if (!emp) return sum;
        const hourlyRate = (Number(emp.baseSalary) || 0) / (settings.standardHours || 173);
        const ratePerMinute = hourlyRate / 60;
        return sum + (Number(d.delayMinutes) || 0) * ratePerMinute;
      }, 0);
  }, [filteredDelays, employees, settings]);

  // Jours fériés Cameroun & CEMAC
  const getCameroonHolidays = (year: number): Record<string, string> => {
    return {
      [`${year}-01-01`]: "Jour de l'An",
      [`${year}-02-11`]: 'Fête de la Jeunesse',
      [`${year}-05-01`]: 'Fête du Travail',
      [`${year}-05-20`]: 'Fête Nationale du 20 Mai',
      [`${year}-08-15`]: 'Assomption',
      [`${year}-12-25`]: 'Noël',
      // Fêtes religieuses chrétiennes
      [`2026-04-03`]: 'Vendredi Saint',
      [`2026-04-06`]: 'Lundi de Pâques',
      [`2026-05-14`]: 'Ascension',
      [`2026-05-25`]: 'Lundi de Pentecôte',
      [`2027-03-26`]: 'Vendredi Saint',
      [`2027-03-29`]: 'Lundi de Pâques',
      [`2027-05-06`]: 'Ascension',
      [`2027-05-17`]: 'Lundi de Pentecôte',
      // Fêtes musulmanes (hégiriennes)
      [`2026-03-20`]: 'Aïd al-Fitr (Fin Ramadan)',
      [`2026-05-27`]: 'Aïd al-Adha (Tabaski)',
      [`2026-08-25`]: 'Mawlid',
      [`2027-03-09`]: 'Aïd al-Fitr',
      [`2027-05-16`]: 'Aïd al-Adha',
      [`2027-08-15`]: 'Mawlid',
    };
  };

  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const numDays = new Date(year, month, 0).getDate();
    const holidays = getCameroonHolidays(year);
    const days = [];
    for (let d = 1; d <= numDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(dateStr).getDay();
      if (dayOfWeek !== 0) { // Exclure les dimanches
        days.push({
          dayNum: d,
          dateStr,
          isWeekend: dayOfWeek === 6,
          dayLabel: new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short' }).substring(0, 2).toUpperCase(),
          holidayName: holidays[dateStr] || null,
        });
      }
    }
    return days;
  };

  const getWeeksOfMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const weeks = [];

    let currentStart = new Date(firstDay);
    let weekIndex = 1;
    while (currentStart <= lastDay) {
      const dayOfWeek = currentStart.getDay();
      const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      let currentEnd = new Date(currentStart);
      currentEnd.setDate(currentStart.getDate() + daysToSunday);
      if (currentEnd > lastDay) {
        currentEnd = new Date(lastDay);
      }

      const startStr = currentStart.toISOString().split('T')[0];
      const endStr = currentEnd.toISOString().split('T')[0];

      weeks.push({
        index: weekIndex,
        start: startStr,
        end: endStr,
        label: `Semaine ${weekIndex} : Du ${currentStart.getDate()} au ${currentEnd.getDate()} ${currentStart.toLocaleDateString('fr-FR', { month: 'short' })}`,
      });

      weekIndex++;
      currentStart = new Date(currentEnd);
      currentStart.setDate(currentEnd.getDate() + 1);
    }
    return weeks;
  };

  // Enregistrement d'un pointage
  const saveAttendanceRecord = async (
    employeeId: string,
    dateStr: string,
    attStatus: ISWAttendance['status'],
    attReason: string,
    arrTime: string,
    delStatus: 'Justifié' | 'Non justifié'
  ) => {
    const isPresent = attStatus === 'Présent';

    const existingAtt = attendanceList.find((a) => a.employeeId === employeeId && a.date === dateStr);
    const attendanceData: Partial<ISWAttendance> & { employeeId: string; date: string } = {
      id: existingAtt?.id,
      employeeId,
      date: dateStr,
      status: attStatus,
      reason: isPresent ? '' : attReason,
      presentDays: isPresent ? 1 : 0,
      workableDays: 1,
      arrivalTime: isPresent ? arrTime : '',
    };
    await iswHrService.saveAttendance(attendanceData);

    const existingDel = delaysList.find((d) => d.employeeId === employeeId && d.date === dateStr);
    if (isPresent && arrTime) {
      const [expH, expM] = expectedTime.split(':').map(Number);
      const [arrH, arrM] = arrTime.split(':').map(Number);
      const diff = (arrH * 60 + arrM) - (expH * 60 + expM);

      if (diff > 0) {
        const delayData: ISWDelay = {
          id: existingDel?.id || `del_${employeeId}_${dateStr}`,
          employeeId,
          date: dateStr,
          expectedTime,
          arrivalTime: arrTime,
          delayMinutes: Number(diff),
          reason: delStatus === 'Justifié' ? attReason : '',
          status: delStatus,
        };
        await iswHrService.saveDelay(delayData);
      } else if (existingDel) {
        await iswHrService.deleteDelay(existingDel.id);
      }
    } else if (existingDel) {
      await iswHrService.deleteDelay(existingDel.id);
    }
  };

  // Soumission Pointage ponctuel
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!empId) newErrors.empId = 'Veuillez sélectionner un employé.';
    if (!date) newErrors.date = 'La date est requise.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await saveAttendanceRecord(empId, date, status, reason, arrivalTime, delayStatus);
      setEmpId('');
      setReason('');
      setArrivalTime('');
      setDelayStatus('Non justifié');
      setStatus('Présent');
      notify('Pointage ponctuel enregistré avec succès !');
    } catch (err) {
      notify("Erreur lors de l'enregistrement du pointage.", true);
    }
  };

  // Édition rapide d'une cellule
  const openCellEditor = (emp: ISWEmployee, dateStr: string) => {
    const att = attendanceList.find((a) => a.employeeId === emp.id && a.date === dateStr);
    const del = delaysList.find((d) => d.employeeId === emp.id && d.date === dateStr);

    setEditingCell({
      employee: emp,
      dateStr,
      status: att?.status || 'Non pointé',
      reason: att?.reason || del?.reason || '',
      arrivalTime: att?.arrivalTime || del?.arrivalTime || '',
      delayStatus: del?.status || 'Non justifié',
    });
  };

  const handleCellEditorSave = async () => {
    if (!editingCell) return;
    const backup = { ...editingCell };
    setEditingCell(null);
    try {
      const { employee, dateStr, status: s, reason: r, arrivalTime: a, delayStatus: ds } = backup;
      if (s === 'Non pointé') {
        const att = attendanceList.find((x) => x.employeeId === employee.id && x.date === dateStr);
        const del = delaysList.find((x) => x.employeeId === employee.id && x.date === dateStr);
        if (att) await iswHrService.deleteAttendance(att.id);
        if (del) await iswHrService.deleteDelay(del.id);
      } else {
        await saveAttendanceRecord(employee.id, dateStr, s as ISWAttendance['status'], r, a, ds);
      }
      notify(`Pointage mis à jour pour ${backup.employee.firstName} (${backup.dateStr}).`);
    } catch (err) {
      notify('Erreur de sauvegarde de la cellule.', true);
    }
  };

  // Exports
  const handlePresencePDF = async () => {
    setExportingPDF(true);
    try {
      const cols = ['Matricule', 'Nom & Prénom', 'Département', 'Présents', 'Retards', 'Retenue (FCFA)', 'Taux'];
      const activeEmps = employees.filter((e) => e.status === 'Actif');
      const rows = activeEmps.map((emp) => {
        const empAtt = filteredAttendance.filter((a) => a.employeeId === emp.id);
        const empDel = filteredDelays.filter((d) => d.employeeId === emp.id);
        const present = empAtt.filter((a) => a.status === 'Présent').length;
        const unjMin = empDel.filter((d) => d.status === 'Non justifié').reduce((s, d) => s + (Number(d.delayMinutes) || 0), 0);
        const hr = (Number(emp.baseSalary) || 0) / (settings.standardHours || 173);
        const penalty = unjMin * (hr / 60);
        const total = empAtt.length;
        const rate = total > 0 ? ((present / total) * 100).toFixed(1) + '%' : 'N/A';
        return [
          emp.id,
          `${emp.firstName} ${emp.lastName}`,
          emp.department,
          present,
          empDel.length,
          formatFCFA(penalty),
          rate,
        ];
      });

      const summary: [string, string][] = [
        ['Effectif actif analysé :', `${activeEmps.length} employés`],
        ['Taux de présence moyen :', `${presenceRate}%`],
        ['Total minutes retards :', `${totalMinutes} min`],
        ['Total retenues estimées :', formatFCFA(totalPenalty)],
      ];
      const periodLabel = new Date(selectedMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      await exportToPDF('BILAN CONSOLIDÉ PRÉSENCES & RETARDS', periodLabel, cols, rows, `bilan-presence-retards-${selectedMonth}`, summary);
      notify('Bilan mensuel exporté en PDF.');
    } catch (err) {
      console.error(err);
      notify("Erreur lors de l'exportation PDF.", true);
    } finally {
      setExportingPDF(false);
    }
  };

  const handlePresenceExcel = async () => {
    setExportingExcel(true);
    try {
      const cols = ['Matricule', 'Nom & Prénom', 'Département', 'Présents', 'Abs. Justifiées', 'Abs. Injustifiées', 'Congés', 'Maladie', 'Retards', 'Retenue (FCFA)', 'Taux (%)'];
      const activeEmps = employees.filter((e) => e.status === 'Actif');
      const rows = activeEmps.map((emp) => {
        const empAtt = filteredAttendance.filter((a) => a.employeeId === emp.id);
        const empDel = filteredDelays.filter((d) => d.employeeId === emp.id);
        const present = empAtt.filter((a) => a.status === 'Présent').length;
        const absJ = empAtt.filter((a) => a.status === 'Absence justifiée').length;
        const absI = empAtt.filter((a) => a.status === 'Absence injustifiée').length;
        const conge = empAtt.filter((a) => a.status === 'Congé').length;
        const mal = empAtt.filter((a) => a.status === 'Maladie').length;
        const unjMin = empDel.filter((d) => d.status === 'Non justifié').reduce((s, d) => s + (Number(d.delayMinutes) || 0), 0);
        const hr = (Number(emp.baseSalary) || 0) / (settings.standardHours || 173);
        const penalty = unjMin * (hr / 60);
        const total = empAtt.length;
        const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
        return [
          emp.id,
          `${emp.firstName} ${emp.lastName}`,
          emp.department,
          present,
          absJ,
          absI,
          conge,
          mal,
          empDel.length,
          Math.round(penalty),
          rate,
        ];
      });
      const periodLabel = new Date(selectedMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      await exportToExcel('Registre ' + periodLabel, cols, rows, `bilan-presence-retards-${selectedMonth}`);
      notify('Registre mensuel exporté en Excel.');
    } catch (err) {
      console.error(err);
      notify("Erreur lors de l'exportation Excel.", true);
    } finally {
      setExportingExcel(false);
    }
  };

  const triggerWeeklyExport = async (week: { index: number; start: string; end: string; label: string }, type: 'pdf' | 'excel') => {
    setIsWeeklyExportOpen(false);
    if (!week) return;

    if (type === 'pdf') {
      setExportingPDF(true);
      try {
        const cols = ['Matricule', 'Nom & Prénom', 'Département', 'Présents', 'Abs. Justifiées', 'Abs. Injustifiées', 'Congés', 'Maladie', 'Retards', 'Retenue (FCFA)', 'Taux'];
        const activeEmps = employees.filter((e) => e.status === 'Actif');
        const weekAtt = attendanceList.filter((a) => a.date && a.date >= week.start && a.date <= week.end);
        const weekDel = delaysList.filter((d) => d.date && d.date >= week.start && d.date <= week.end);

        const rows = activeEmps.map((emp) => {
          const empAtt = weekAtt.filter((a) => a.employeeId === emp.id);
          const empDel = weekDel.filter((d) => d.employeeId === emp.id);
          const present = empAtt.filter((a) => a.status === 'Présent').length;
          const absJ = empAtt.filter((a) => a.status === 'Absence justifiée').length;
          const absI = empAtt.filter((a) => a.status === 'Absence injustifiée').length;
          const conge = empAtt.filter((a) => a.status === 'Congé').length;
          const mal = empAtt.filter((a) => a.status === 'Maladie').length;
          const unjMin = empDel.filter((d) => d.status === 'Non justifié').reduce((s, d) => s + (Number(d.delayMinutes) || 0), 0);
          const hr = (Number(emp.baseSalary) || 0) / (settings.standardHours || 173);
          const penalty = unjMin * (hr / 60);
          const total = empAtt.length;
          const rate = total > 0 ? ((present / total) * 100).toFixed(1) + '%' : 'N/A';
          return [
            emp.id,
            `${emp.firstName} ${emp.lastName}`,
            emp.department,
            present,
            absJ,
            absI,
            conge,
            mal,
            empDel.length,
            formatFCFA(penalty),
            rate,
          ];
        });

        const totalPres = weekAtt.filter((a) => a.status === 'Présent').length;
        const totalWork = weekAtt.length;
        const avgRate = totalWork > 0 ? ((totalPres / totalWork) * 100).toFixed(1) + '%' : 'N/A';
        const totalDelayMin = weekDel.reduce((s, d) => s + (Number(d.delayMinutes) || 0), 0);
        const totalPenaltyEst = weekDel
          .filter((d) => d.status === 'Non justifié')
          .reduce((sum, d) => {
            const emp = employees.find((e) => e.id === d.employeeId);
            if (!emp) return sum;
            const hr = (Number(emp.baseSalary) || 0) / (settings.standardHours || 173);
            return sum + (Number(d.delayMinutes) || 0) * (hr / 60);
          }, 0);

        const summary: [string, string][] = [
          ['Période hebdomadaire :', `${week.start} au ${week.end}`],
          ['Effectif actif analysé :', `${activeEmps.length} collaborateurs`],
          ['Taux de présence moyen :', avgRate],
          ['Total retards cumulés :', `${totalDelayMin} min`],
          ['Total retenues estimées :', formatFCFA(totalPenaltyEst)],
        ];

        await exportToPDF('BILAN HEBDOMADAIRE PRÉSENCES & RETARDS', week.label, cols, rows, `bilan-hebdo-${week.start}-au-${week.end}`, summary);
        notify('Bilan hebdomadaire PDF généré.');
      } catch (err) {
        console.error(err);
        notify("Erreur lors de l'exportation hebdomadaire.", true);
      } finally {
        setExportingPDF(false);
      }
    } else {
      setExportingExcel(true);
      try {
        const cols = ['Matricule', 'Nom & Prénom', 'Département', 'Présents', 'Abs. Justifiées', 'Abs. Injustifiées', 'Congés', 'Maladie', 'Retards', 'Retenue (FCFA)', 'Taux (%)'];
        const activeEmps = employees.filter((e) => e.status === 'Actif');
        const weekAtt = attendanceList.filter((a) => a.date && a.date >= week.start && a.date <= week.end);
        const weekDel = delaysList.filter((d) => d.date && d.date >= week.start && d.date <= week.end);

        const rows = activeEmps.map((emp) => {
          const empAtt = weekAtt.filter((a) => a.employeeId === emp.id);
          const empDel = weekDel.filter((d) => d.employeeId === emp.id);
          const present = empAtt.filter((a) => a.status === 'Présent').length;
          const absJ = empAtt.filter((a) => a.status === 'Absence justifiée').length;
          const absI = empAtt.filter((a) => a.status === 'Absence injustifiée').length;
          const conge = empAtt.filter((a) => a.status === 'Congé').length;
          const mal = empAtt.filter((a) => a.status === 'Maladie').length;
          const unjMin = empDel.filter((d) => d.status === 'Non justifié').reduce((s, d) => s + (Number(d.delayMinutes) || 0), 0);
          const hr = (Number(emp.baseSalary) || 0) / (settings.standardHours || 173);
          const penalty = unjMin * (hr / 60);
          const total = empAtt.length;
          const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
          return [
            emp.id,
            `${emp.firstName} ${emp.lastName}`,
            emp.department,
            present,
            absJ,
            absI,
            conge,
            mal,
            empDel.length,
            Math.round(penalty),
            rate,
          ];
        });
        await exportToExcel('Registre ' + week.label, cols, rows, `bilan-hebdo-${week.start}-au-${week.end}`);
        notify('Bilan hebdomadaire Excel généré.');
      } catch (err) {
        console.error(err);
        notify("Erreur lors de l'exportation hebdomadaire Excel.", true);
      } finally {
        setExportingExcel(false);
      }
    }
  };

  const handleDailyPresencePDF = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isCurrentMonth = todayStr.startsWith(selectedMonth);
    const dayToExport = isCurrentMonth ? todayStr : `${selectedMonth}-01`;
    setDailyExportDate(dayToExport);
    setIsDailyExportOpen(true);
  };

  const triggerDailyExport = async (userDay: string) => {
    setIsDailyExportOpen(false);
    if (!userDay || !/^\d{4}-\d{2}-\d{2}$/.test(userDay)) {
      notify('Format de date invalide (AAAA-MM-JJ).', true);
      return;
    }

    setExportingPDF(true);
    try {
      const cols = ['Matricule', 'Nom & Prénom', 'Département', 'Poste', 'Statut de Présence', 'Heure Arrivée', 'Retard (min)', 'Justification / Motif'];
      const activeEmps = employees.filter((e) => e.status === 'Actif');
      const dailyAtt = attendanceList.filter((a) => a.date === userDay);
      const dailyDel = delaysList.filter((d) => d.date === userDay);

      const rows = activeEmps.map((emp) => {
        const att = dailyAtt.find((a) => a.employeeId === emp.id);
        const del = dailyDel.find((d) => d.employeeId === emp.id);

        let statusText = 'Non pointé';
        let arrivalText = '-';
        let delayMin = 0;
        let comment = '-';

        if (att) {
          statusText = att.status;
          arrivalText = att.arrivalTime || '-';
          comment = att.reason || '-';
        }
        if (del) {
          delayMin = del.delayMinutes || 0;
          if (del.reason) comment = del.reason;
        }

        return [
          emp.id,
          `${emp.firstName} ${emp.lastName}`,
          emp.department,
          emp.role,
          statusText,
          arrivalText,
          delayMin > 0 ? `${delayMin} min (${del?.status || 'Non justifié'})` : '-',
          comment,
        ];
      });

      const presentCount = dailyAtt.filter((a) => a.status === 'Présent').length;
      const totalCount = activeEmps.length;
      const summary: [string, string][] = [
        ['Date du rapport :', new Date(userDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
        ['Collaborateurs présents :', `${presentCount} / ${totalCount}`],
        ['Retards constatés :', `${dailyDel.length} retards`],
      ];

      await exportToPDF('RAPPORT JOURNALIER DE POINTAGE', userDay, cols, rows, `rapport-pointage-${userDay}`, summary);
      notify(`Rapport journalier du ${userDay} exporté en PDF.`);
    } catch (err) {
      console.error(err);
      notify("Erreur lors de l'exportation du rapport journalier.", true);
    } finally {
      setExportingPDF(false);
    }
  };

  const getInitials = (emp: ISWEmployee) => {
    return `${(emp.firstName || '')[0] || ''}${(emp.lastName || '')[0] || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Barre d'outils supérieure */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-emerald-400 rounded-lg border border-[#3B7A2C]/20">
              <Clock className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Registre de Pointage &amp; Présences
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Matrice collective mensuelle, détection des retards, fiches de présence et calcul automatisé des retenues salariales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#3B7A2C] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grille Collective
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#3B7A2C] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Fiches Individuelles
            </button>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-[#3B7A2C] dark:text-emerald-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Action Export Buttons */}
          <button
            onClick={handleDailyPresencePDF}
            disabled={exportingPDF}
            className="px-3 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            title="Exporter la feuille de pointage d'un jour précis"
          >
            <FileText className="w-3.5 h-3.5" />
            Bilan du Jour
          </button>
          <button
            onClick={() => setIsWeeklyExportOpen(true)}
            disabled={exportingPDF}
            className="px-3 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            title="Exporter une semaine complète"
          >
            <FileText className="w-3.5 h-3.5" />
            Bilan Hebdo
          </button>
          <button
            onClick={handlePresencePDF}
            disabled={exportingPDF}
            className="px-3.5 py-2 bg-[#3B7A2C] hover:bg-[#2D6020] disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-[#3B7A2C]/20 transition-transform active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Bilan Mensuel (PDF)
          </button>
          <button
            onClick={handlePresenceExcel}
            disabled={exportingExcel}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel Mensuel
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Taux de Présence</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white truncate">{presenceRate}%</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-green-500/10 text-[#3B7A2C] dark:text-emerald-400 border border-green-500/20 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Jours Pointés</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white truncate">{totalPresent} j</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Minutes Retards</p>
            <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 truncate">{totalMinutes} min</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Retenues Retards</p>
            <h3 className="text-base font-black text-rose-600 dark:text-rose-400 truncate">{formatFCFA(totalPenalty)}</h3>
          </div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Rechercher un collaborateur..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3B7A2C]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Tous les Départements</option>
            {settings.departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {viewMode === 'grid' ? (
        /* GRILLE DE REMPLISSAGE EN GROUPE (CALENDRIER MENSUEL) */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs overflow-hidden flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3B7A2C] dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Matrice Mensuelle Collective — Cliquez sur une case pour pointer
              </h3>
            </div>

            {/* Légende */}
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-2 rounded-xl">
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 inline-flex items-center justify-center rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold">✓</span> Présent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 inline-flex items-center justify-center rounded bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-bold">⏱</span> Retard
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 inline-flex items-center justify-center rounded bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 font-bold">✕</span> Abs. Injustifiée
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 inline-flex items-center justify-center rounded bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 font-bold">J</span> Abs. Justifiée
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 inline-flex items-center justify-center rounded bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-200 font-bold">C</span> Congé
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 inline-flex items-center justify-center rounded bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200 font-bold">F</span> Férié
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-300 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 w-[200px] border-r border-slate-200 dark:border-slate-800">
                    Collaborateur
                  </th>
                  {getDaysInMonth().map((day) => {
                    const localDate = new Date();
                    const todayStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
                    const isToday = day.dateStr === todayStr;
                    return (
                      <th
                        key={day.dayNum}
                        id={isToday ? 'today-column-header' : undefined}
                        title={day.holidayName || undefined}
                        className={`p-2 text-center font-bold min-w-[42px] border-r border-slate-200 dark:border-slate-800 ${
                          isToday
                            ? 'bg-[#3B7A2C] text-white shadow-xs z-20 sticky'
                            : day.holidayName
                              ? 'bg-purple-700 text-white'
                              : day.isWeekend
                                ? 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-500'
                                : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div>{day.dayNum}</div>
                        <div className={`text-[8px] uppercase mt-0.5 ${isToday || day.holidayName ? 'text-white/80' : 'text-slate-400'}`}>
                          {day.dayLabel}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {displayEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Colonne collaborateur figée à gauche */}
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.03)] z-10 min-w-[200px]">
                      <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate">
                        {emp.id} &bull; {emp.department}
                      </div>
                    </td>

                    {/* Cellules des jours */}
                    {getDaysInMonth().map((day) => {
                      const att = filteredAttendance.find((a) => a.employeeId === emp.id && a.date === day.dateStr);
                      const del = filteredDelays.find((d) => d.employeeId === emp.id && d.date === day.dateStr);
                      const localDate = new Date();
                      const todayStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
                      const isToday = day.dateStr === todayStr;

                      let cellSymbol = '-';
                      let cellClass = 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800';

                      if (att) {
                        if (att.status === 'Présent') {
                          cellSymbol = del ? '⏱' : '✓';
                          cellClass = del
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-bold';
                        } else if (att.status === 'Retard') {
                          cellSymbol = '⏱';
                          cellClass = 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold';
                        } else if (att.status === 'Absence injustifiée') {
                          cellSymbol = '✕';
                          cellClass = 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-bold';
                        } else if (att.status === 'Absence justifiée') {
                          cellSymbol = 'J';
                          cellClass = 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-bold';
                        } else if (att.status === 'Congé') {
                          cellSymbol = 'C';
                          cellClass = 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 font-bold';
                        } else if (att.status === 'Maladie') {
                          cellSymbol = 'M';
                          cellClass = 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-bold';
                        }
                      } else if (day.holidayName) {
                        cellSymbol = 'F';
                        cellClass = 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-extrabold';
                      }

                      return (
                        <td
                          key={day.dayNum}
                          onClick={() => openCellEditor(emp, day.dateStr)}
                          title={`${emp.firstName} ${emp.lastName} — ${day.dateStr}
Statut : ${att?.status || (day.holidayName ? `Férié (${day.holidayName})` : 'Non pointé')}
${del ? `Retard : ${del.delayMinutes} min (${del.arrivalTime}) — ${del.status}` : ''}`}
                          className={`p-1.5 border-r border-slate-200 dark:border-slate-800 text-center select-none cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                            day.isWeekend ? 'bg-slate-50/40 dark:bg-slate-800/20' : ''
                          } ${
                            isToday
                              ? 'bg-green-500/10 dark:bg-emerald-950/30 ring-1 ring-[#3B7A2C] ring-inset'
                              : ''
                          }`}
                        >
                          <span
                            className={`w-6 h-6 inline-flex items-center justify-center rounded-lg border text-[10px] ${
                              isToday && !att ? 'border-[#3B7A2C] bg-white dark:bg-slate-900 text-[#3B7A2C]' : cellClass
                            }`}
                          >
                            {cellSymbol}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VUE CARTES INDIVIDUELLES + FORMULAIRE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire Enregistrer un Pointage */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs h-fit">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-5 bg-[#3B7A2C] rounded-full" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Enregistrer un Pointage Ponctuel
              </h3>
            </div>

            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1.5">
                  Collaborateur
                </label>
                <select
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3B7A2C]"
                >
                  <option value="">Sélectionner un collaborateur...</option>
                  {employees.filter((e) => e.status === 'Actif').map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.id} — {e.firstName} {e.lastName} ({e.department})
                    </option>
                  ))}
                </select>
                {errors.empId && <p className="text-rose-500 text-[10px] mt-1">{errors.empId}</p>}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3B7A2C]"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1.5">
                  Statut
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ISWAttendance['status'])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3B7A2C]"
                >
                  <option value="Présent">Présent</option>
                  <option value="Retard">Retard</option>
                  <option value="Absence justifiée">Absence justifiée</option>
                  <option value="Absence injustifiée">Absence injustifiée</option>
                  <option value="Congé">Congé</option>
                  <option value="Maladie">Maladie</option>
                </select>
              </div>

              {(status === 'Présent' || status === 'Retard') && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] font-bold">
                    <Clock className="w-3.5 h-3.5 text-[#3B7A2C]" />
                    <span>Pointage horaire (Heure théorique : {expectedTime})</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Heure d'arrivée</label>
                    <input
                      type="time"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  {arrivalTime && arrivalTime > expectedTime && (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Justification du retard</label>
                      <select
                        value={delayStatus}
                        onChange={(e) => setDelayStatus(e.target.value as 'Justifié' | 'Non justifié')}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="Non justifié">Non justifié (Retenue salariale appliquée)</option>
                        <option value="Justifié">Justifié (Exempté)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {status !== 'Présent' && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1.5">
                    Motif / Commentaire
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Saisissez la justification..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-[#3B7A2C]"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#3B7A2C] hover:bg-[#2D6020] text-white font-bold rounded-xl text-xs shadow-md shadow-[#3B7A2C]/20 transition-all cursor-pointer"
              >
                Enregistrer le Pointage
              </button>
            </form>
          </div>

          {/* Grille des fiches individuelles */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#3B7A2C] dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Fiches Collaborateurs &amp; Historique Récent
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[640px] overflow-y-auto pr-1">
              {displayEmployees.map((emp) => {
                const empAtt = filteredAttendance.filter((a) => a.employeeId === emp.id);
                const empDel = filteredDelays.filter((d) => d.employeeId === emp.id);
                const presentCount = empAtt.filter((a) => a.status === 'Présent').length;
                const totalWork = empAtt.length;
                const rate = totalWork > 0 ? ((presentCount / totalWork) * 100).toFixed(0) : '0';

                return (
                  <div
                    key={emp.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3B7A2C] to-emerald-400 flex items-center justify-center text-white text-xs font-black shrink-0">
                          {getInitials(emp)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {emp.firstName} {emp.lastName}
                          </h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate">
                            {emp.id} &bull; {emp.department}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-black ${
                              Number(rate) >= 90
                                ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : Number(rate) >= 75
                                  ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {rate}%
                          </span>
                          {empDel.length > 0 && (
                            <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                              {empDel.length} retard{empDel.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Barre de progression */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                          <span>Présences</span>
                          <span>{presentCount} / {totalWork} jours</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              Number(rate) >= 90
                                ? 'bg-emerald-500'
                                : Number(rate) >= 75
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                            }`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mini-pastilles des jours récents */}
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1 max-h-[70px] overflow-y-auto">
                      {getDaysInMonth().map((d) => {
                        const rec = empAtt.find((a) => a.date === d.dateStr);
                        const delRec = empDel.find((del) => del.date === d.dateStr);

                        let badgeColor = 'text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
                        let symbol: string | number = d.dayNum;

                        if (rec) {
                          if (rec.status === 'Présent') {
                            symbol = delRec ? '⏱' : '✓';
                            badgeColor = delRec
                              ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300 font-bold'
                              : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 font-bold';
                          } else if (rec.status === 'Absence injustifiée') {
                            symbol = '✕';
                            badgeColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300 font-bold';
                          } else if (rec.status === 'Congé') {
                            symbol = 'C';
                            badgeColor = 'text-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 font-bold';
                          }
                        }

                        return (
                          <span
                            key={d.dayNum}
                            onClick={() => openCellEditor(emp, d.dateStr)}
                            title={`${d.dateStr} : ${rec?.status || 'Non pointé'}`}
                            className={`w-5 h-5 inline-flex items-center justify-center rounded border text-[9px] cursor-pointer hover:scale-110 active:scale-95 transition-transform ${badgeColor}`}
                          >
                            {symbol}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* POPUP D'ÉDITION DIRECTE DE CELLULE */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setEditingCell(null)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  Pointer / Modifier Présence
                </h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">
                  {editingCell.employee.firstName} {editingCell.employee.lastName} &bull; {editingCell.dateStr}
                </p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1.5 uppercase">
                  Statut de Présence
                </label>
                <select
                  value={editingCell.status}
                  onChange={(e) => setEditingCell((prev) => prev ? { ...prev, status: e.target.value } : null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="Non pointé">Non pointé (Vierge)</option>
                  <option value="Présent">Présent (Au poste)</option>
                  <option value="Retard">Retard</option>
                  <option value="Absence justifiée">Absence justifiée</option>
                  <option value="Absence injustifiée">Absence injustifiée</option>
                  <option value="Congé">Congé</option>
                  <option value="Maladie">Maladie</option>
                </select>
              </div>

              {(editingCell.status === 'Présent' || editingCell.status === 'Retard') && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase">
                    <Clock className="w-3.5 h-3.5 text-[#3B7A2C]" />
                    <span>Paramètres d'arrivée (Heure prévue : {expectedTime})</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">
                      Heure d'arrivée réelle
                    </label>
                    <input
                      type="time"
                      value={editingCell.arrivalTime}
                      onChange={(e) => setEditingCell((prev) => prev ? { ...prev, arrivalTime: e.target.value } : null)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  {editingCell.arrivalTime && editingCell.arrivalTime > expectedTime && (
                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">
                        Statut du retard
                      </label>
                      <select
                        value={editingCell.delayStatus}
                        onChange={(e) => setEditingCell((prev) => prev ? { ...prev, delayStatus: e.target.value as 'Justifié' | 'Non justifié' } : null)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                      >
                        <option value="Non justifié">Non justifié (Retenue salariale)</option>
                        <option value="Justifié">Justifié (Exempté)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {editingCell.status !== 'Présent' && editingCell.status !== 'Non pointé' && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1.5 uppercase">
                    Motif / Justification
                  </label>
                  <textarea
                    value={editingCell.reason}
                    onChange={(e) => setEditingCell((prev) => prev ? { ...prev, reason: e.target.value } : null)}
                    placeholder="Saisissez le motif..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 min-h-[60px] focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
              <button
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleCellEditorSave}
                className="px-4 py-2 bg-[#3B7A2C] hover:bg-[#2D6020] text-white font-bold text-xs rounded-xl shadow-md shadow-[#3B7A2C]/20 transition-colors cursor-pointer"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPORT HEBDOMADAIRE */}
      {isWeeklyExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsWeeklyExportOpen(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  Export Hebdomadaire
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Sélectionnez la semaine et le format</p>
              </div>
              <button
                onClick={() => setIsWeeklyExportOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1.5 uppercase">
                  Semaine du mois
                </label>
                <select
                  value={selectedWeekIndex}
                  onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {getWeeksOfMonth(selectedMonth).map((week, idx) => (
                    <option key={idx} value={idx}>{week.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
              <button
                onClick={() => setIsWeeklyExportOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => triggerWeeklyExport(getWeeksOfMonth(selectedMonth)[selectedWeekIndex], 'excel')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Excel
              </button>
              <button
                onClick={() => triggerWeeklyExport(getWeeksOfMonth(selectedMonth)[selectedWeekIndex], 'pdf')}
                className="px-4 py-2 bg-[#3B7A2C] hover:bg-[#2D6020] text-white font-bold text-xs rounded-xl shadow-md shadow-[#3B7A2C]/20 transition-colors cursor-pointer"
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPORT JOURNALIER */}
      {isDailyExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsDailyExportOpen(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  Exporter le Pointage Journalier
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Choisissez la date du rapport</p>
              </div>
              <button
                onClick={() => setIsDailyExportOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1.5 uppercase">
                  Date de pointage
                </label>
                <input
                  type="date"
                  value={dailyExportDate}
                  onChange={(e) => setDailyExportDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
              <button
                onClick={() => setIsDailyExportOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => triggerDailyExport(dailyExportDate)}
                className="px-4 py-2 bg-[#3B7A2C] hover:bg-[#2D6020] text-white font-bold text-xs rounded-xl shadow-md shadow-[#3B7A2C]/20 transition-colors cursor-pointer"
              >
                Exporter PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
