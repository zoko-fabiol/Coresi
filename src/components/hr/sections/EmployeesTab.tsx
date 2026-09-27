import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  UserPlus,
  MapPin,
  Phone,
  Mail,
  Award,
  X,
  Download,
  PlusCircle,
  FileText,
  FileSpreadsheet,
  Users,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { iswHrService, ISWEmployee, ISWSettings } from '../../../services/iswHrService';
import { exportToPDF, exportEmployeesWord, formatFCFA } from '../../../services/exportService';

interface EmployeesTabProps {
  onRefresh?: () => void;
  showToast?: (msg: string) => void;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({ showToast }) => {
  const [employees, setEmployees] = useState<ISWEmployee[]>([]);
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

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<ISWEmployee | null>(null);

  // Modal d'export personnalisé
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([
    { key: 'id', label: 'Matricule', selected: true },
    { key: 'firstName', label: 'Nom', selected: true },
    { key: 'lastName', label: 'Prénom', selected: true },
    { key: 'role', label: 'Poste', selected: true },
    { key: 'department', label: 'Département', selected: true },
    { key: 'contractType', label: 'Contrat', selected: true },
    { key: 'baseSalary', label: 'Salaire Base', selected: false },
    { key: 'phone', label: 'Téléphone', selected: false },
    { key: 'email', label: 'Email', selected: false },
    { key: 'cnpsNumber', label: 'N° CNPS', selected: false },
    { key: 'qualification', label: 'Qualification', selected: false },
  ]);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [newCustomColumnName, setNewCustomColumnName] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'word'>('pdf');
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPresetName, setSelectedPresetName] = useState('');
  const [newPresetName, setNewPresetName] = useState('');

  // Champs de saisie employé
  const [formId, setFormId] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formJobType, setFormJobType] = useState('Temps plein');
  const [formBaseSalary, setFormBaseSalary] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formContractType, setFormContractType] = useState('CDI');
  const [formGender, setFormGender] = useState('Homme');
  const [formCity, setFormCity] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formStatus, setFormStatus] = useState<ISWEmployee['status']>('Actif');
  const [formCnpsNumber, setFormCnpsNumber] = useState('');
  const [formIndice, setFormIndice] = useState('B');
  const [formNiveau, setFormNiveau] = useState('7');
  const [formCoefficient, setFormCoefficient] = useState('');
  const [formQualification, setFormQualification] = useState('');
  const [formConventionCollective, setFormConventionCollective] = useState(
    'CONVENTION COLLECTIVE NATIONALE DU BÂTIMENT ET DES TRAVAUX PUBLICS'
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const notify = (msg: string, isErr = false) => {
    if (showToast) showToast(msg);
    else console.log(`[CORESI Employés] ${isErr ? 'ERR' : 'OK'}: ${msg}`);
  };

  useEffect(() => {
    iswHrService.getEmployees().then(setEmployees);
    iswHrService.getSettings().then((s) => {
      setSettings(s);
      if (!formDepartment && s.departments.length > 0) {
        setFormDepartment(s.departments[0]);
      }
    });

    const unsub = iswHrService.subscribeEmployees(setEmployees);

    const savedPresets = localStorage.getItem('sirh_export_presets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (err) {
        console.error(err);
      }
    }

    return () => unsub();
  }, []);

  // Déclencher le modal d'ajout
  const handleAddClick = () => {
    setEditingEmployee(null);

    // Calculer le prochain matricule COR-XX
    const lastNum = employees.reduce((max, emp) => {
      const match = emp.id.match(/(?:COR|ISW)[-_]?(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const nextId = `COR-${String(lastNum + 1).padStart(2, '0')}`;

    setFormId(nextId);
    setFormFirstName('');
    setFormLastName('');
    setFormRole('');
    setFormDepartment(settings.departments[0] || 'Bureau d\'Études & Ingénierie');
    setFormJobType('Temps plein');
    setFormBaseSalary('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormContractType(settings.contractTypes[0] || 'CDI');
    setFormGender('Homme');
    setFormCity('Douala');
    setFormPhone('');
    setFormEmail('');
    setFormStatus('Actif');
    setFormCnpsNumber('');
    setFormIndice('B');
    setFormNiveau('7');
    setFormCoefficient('350');
    setFormQualification('');
    setFormConventionCollective('CONVENTION COLLECTIVE NATIONALE DU BTP');
    setErrors({});
    setIsModalOpen(true);
  };

  // Déclencher le modal d'édition
  const handleEditClick = (emp: ISWEmployee) => {
    setEditingEmployee(emp);
    setFormId(emp.id);
    setFormFirstName(emp.firstName);
    setFormLastName(emp.lastName);
    setFormRole(emp.role);
    setFormDepartment(emp.department);
    setFormJobType(emp.jobType);
    setFormBaseSalary(String(emp.baseSalary));
    setFormStartDate(emp.startDate);
    setFormContractType(emp.contractType);
    setFormGender(emp.gender);
    setFormCity(emp.city);
    setFormPhone(emp.phone);
    setFormEmail(emp.email);
    setFormStatus(emp.status);
    setFormCnpsNumber(emp.cnpsNumber || '');
    setFormIndice(emp.indice || 'B');
    setFormNiveau(emp.niveau || '7');
    setFormCoefficient(emp.coefficient || '');
    setFormQualification(emp.qualification || '');
    setFormConventionCollective(emp.conventionCollective || 'CONVENTION COLLECTIVE NATIONALE DU BTP');
    setErrors({});
    setIsModalOpen(true);
  };

  // Supprimer un collaborateur
  const handleDeleteClick = async (empId: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le collaborateur ${empId} et son historique lié ?`)) {
      try {
        await iswHrService.deleteEmployee(empId);
        notify(`Collaborateur ${empId} supprimé avec succès.`);
      } catch (err) {
        notify("Erreur lors de la suppression de l'employé.", true);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formId.trim()) newErrors.id = "L'identifiant est requis.";
    else if (!editingEmployee && employees.some((e) => e.id.toLowerCase() === formId.trim().toLowerCase())) {
      newErrors.id = 'Cet identifiant est déjà attribué.';
    }

    if (!formFirstName.trim()) newErrors.firstName = 'Le prénom est requis.';
    if (!formLastName.trim()) newErrors.lastName = 'Le nom de famille est requis.';
    if (!formRole.trim()) newErrors.role = 'Le poste / titre est requis.';
    if (!formDepartment) newErrors.department = 'Le département est requis.';

    const salary = Number(formBaseSalary);
    if (!formBaseSalary) newErrors.baseSalary = 'Le salaire de base est requis.';
    else if (isNaN(salary) || salary <= 0) newErrors.baseSalary = 'Saisissez un montant valide supérieur à 0.';

    if (!formStartDate) newErrors.startDate = "La date d'embauche est requise.";
    if (!formEmail) newErrors.email = "L'email professionnel est requis.";
    if (!formPhone) newErrors.phone = 'Le numéro de téléphone est requis.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const employeeData: ISWEmployee = {
      id: formId.trim(),
      firstName: formFirstName.trim(),
      lastName: formLastName.trim(),
      role: formRole.trim(),
      department: formDepartment,
      jobType: formJobType,
      baseSalary: Number(formBaseSalary),
      startDate: formStartDate,
      contractType: formContractType,
      gender: formGender,
      city: formCity.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      status: formStatus,
      cnpsNumber: formCnpsNumber.trim(),
      indice: formIndice.trim(),
      niveau: formNiveau.trim(),
      coefficient: formCoefficient.trim(),
      qualification: formQualification.trim(),
      conventionCollective: formConventionCollective.trim(),
    };

    try {
      setIsModalOpen(false);
      await iswHrService.saveEmployee(employeeData);
      notify(editingEmployee ? 'Fiche collaborateur mise à jour.' : 'Nouveau collaborateur enregistré.');
    } catch (err) {
      notify("Erreur lors de l'enregistrement.", true);
    }
  };

  // Filtrage
  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch =
      emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter ? emp.department === deptFilter : true;
    const matchesStatus = statusFilter ? emp.status === statusFilter : true;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Export personnalisé
  const handleToggleColumn = (index: number) => {
    setSelectedColumns((prev) =>
      prev.map((col, idx) => (idx === index ? { ...col, selected: !col.selected } : col))
    );
  };

  const handleAddCustomColumn = () => {
    if (!newCustomColumnName.trim()) return;
    if (customColumns.includes(newCustomColumnName.trim())) {
      notify('Cette colonne personnalisée existe déjà.', true);
      return;
    }
    setCustomColumns((prev) => [...prev, newCustomColumnName.trim()]);
    setNewCustomColumnName('');
  };

  const handleRemoveCustomColumn = (index: number) => {
    setCustomColumns((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      notify('Veuillez saisir un nom pour le modèle de colonnes.', true);
      return;
    }
    const presetName = newPresetName.trim();
    const activeColsKeys = selectedColumns.filter((c) => c.selected).map((c) => c.key);

    const newPreset = {
      name: presetName,
      selectedKeys: activeColsKeys,
      customColumns,
    };

    let updatedPresets = [...presets];
    const existingIndex = presets.findIndex((p) => p.name.toLowerCase() === presetName.toLowerCase());
    if (existingIndex > -1) {
      updatedPresets[existingIndex] = newPreset;
    } else {
      updatedPresets.push(newPreset);
    }

    setPresets(updatedPresets);
    localStorage.setItem('sirh_export_presets', JSON.stringify(updatedPresets));
    setSelectedPresetName(presetName);
    setNewPresetName('');
    notify(`Modèle "${presetName}" sauvegardé.`);
  };

  const handleLoadPreset = (presetName: string) => {
    setSelectedPresetName(presetName);
    if (!presetName) return;
    const preset = presets.find((p) => p.name === presetName);
    if (preset) {
      setSelectedColumns((prev) =>
        prev.map((col) => ({ ...col, selected: preset.selectedKeys.includes(col.key) }))
      );
      setCustomColumns(preset.customColumns || []);
      notify(`Modèle "${presetName}" chargé.`);
    }
  };

  const handleDeletePreset = (presetName: string) => {
    const updated = presets.filter((p) => p.name !== presetName);
    setPresets(updated);
    localStorage.setItem('sirh_export_presets', JSON.stringify(updated));
    if (selectedPresetName === presetName) {
      setSelectedPresetName('');
    }
    notify(`Modèle "${presetName}" supprimé.`);
  };

  const triggerStaffExport = async () => {
    setIsExportModalOpen(false);
    const activeCols = selectedColumns.filter((c) => c.selected);

    if (activeCols.length === 0 && customColumns.length === 0) {
      notify('Veuillez sélectionner au moins une colonne.', true);
      return;
    }

    const headers = [...activeCols.map((c) => c.label), ...customColumns];
    const dataRows = filteredEmployees.map((emp: any) => {
      const activeData = activeCols.map((col) => {
        if (col.key === 'baseSalary') return formatFCFA(emp[col.key]);
        return emp[col.key] || '';
      });
      const extraEmpty = customColumns.map(() => '');
      return [...activeData, ...extraEmpty];
    });

    const reportTitle = 'REGISTRE DU PERSONNEL & MAIN-D\'ŒUVRE';
    if (exportFormat === 'word') {
      exportEmployeesWord(headers, dataRows, reportTitle);
      notify('Liste du personnel exportée vers Microsoft Word (.doc).');
    } else {
      const summary: [string, string][] = [
        ['Effectif total répertorié :', `${filteredEmployees.length} collaborateurs`],
        ['Filtre département :', deptFilter === '' ? 'Tous les départements' : deptFilter],
        ['Statut des dossiers :', statusFilter === '' ? 'Tous statuts' : statusFilter],
      ];
      await exportToPDF(
        reportTitle,
        new Date().toLocaleDateString('fr-FR'),
        headers,
        dataRows,
        `registre-personnel-${Date.now()}`,
        summary
      );
      notify('Liste du personnel exportée en PDF.');
    }
  };

  // KPIs
  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status === 'Actif').length;
  const cdiCount = employees.filter((e) => e.contractType === 'CDI').length;
  const totalPayroll = employees.reduce((sum, e) => sum + (Number(e.baseSalary) || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-emerald-400 border border-[#3B7A2C]/20 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Effectif Total</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white truncate">{totalEmployees}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Actifs en Poste</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white truncate">{activeCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contrats CDI</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white truncate">{cdiCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Masse Salariale Base</p>
            <h3 className="text-base font-black text-amber-600 dark:text-amber-400 truncate">{formatFCFA(totalPayroll)}</h3>
          </div>
        </div>
      </div>

      {/* Barre d'actions & Filtres */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, matricule, poste..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3B7A2C]"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">Tous les Départements</option>
            {settings.departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">Tous les Statuts</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
            <option value="Suspendu">Suspendu</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exporter Liste...
          </button>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-[#3B7A2C] hover:bg-[#2D6020] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-[#3B7A2C]/20 transition-transform active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Nouveau Collaborateur
          </button>
        </div>
      </div>

      {/* Grille des Collaborateurs */}
      {filteredEmployees.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          Aucun collaborateur ne correspond à vos critères de recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Carte */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#3B7A2C] to-emerald-400 flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                        {emp.firstName} {emp.lastName}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold truncate">
                        {emp.id} &bull; {emp.department}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      emp.status === 'Actif'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {emp.status}
                  </span>
                </div>

                {/* Poste & Contrat */}
                <div className="space-y-1.5 mb-4 text-xs">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {emp.role}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md font-bold">
                      {emp.contractType}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md font-bold">
                      {emp.jobType}
                    </span>
                    {emp.cnpsNumber && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md font-bold">
                        CNPS: {emp.cnpsNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Contacts & Localisation */}
                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{emp.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{emp.city || 'Douala'}</span>
                  </div>
                </div>
              </div>

              {/* Footer de la carte avec Salaire & Boutons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Salaire Base</span>
                  <span className="text-xs font-black text-[#3B7A2C] dark:text-emerald-400">
                    {formatFCFA(emp.baseSalary)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditClick(emp)}
                    className="p-1.5 text-slate-500 hover:text-[#3B7A2C] dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Modifier le collaborateur"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(emp.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CRÉATION / ÉDITION COLLABORATEUR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  {editingEmployee ? 'Modifier la Fiche Collaborateur' : 'Ajouter un Collaborateur'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Dossier administratif, classification conventionnelle et coordonnées
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Section 1: Identité */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1">
                    Matricule *
                  </label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    disabled={!!editingEmployee}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 disabled:opacity-60 focus:outline-none"
                  />
                  {errors.id && <p className="text-rose-500 text-[10px] mt-0.5">{errors.id}</p>}
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  {errors.firstName && <p className="text-rose-500 text-[10px] mt-0.5">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  {errors.lastName && <p className="text-rose-500 text-[10px] mt-0.5">{errors.lastName}</p>}
                </div>
              </div>

              {/* Section 2: Poste, Département & Contrat */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1">
                    Poste / Fonction *
                  </label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  {errors.role && <p className="text-rose-500 text-[10px] mt-0.5">{errors.role}</p>}
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1">
                    Département *
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    {settings.departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1">
                    Type de Contrat
                  </label>
                  <select
                    value={formContractType}
                    onChange={(e) => setFormContractType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    {settings.contractTypes.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 3: Salaire, Embauche & Temps de travail */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1">
                    Salaire de Base (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={formBaseSalary}
                    onChange={(e) => setFormBaseSalary(e.target.value)}
                    placeholder="Ex: 500000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  {errors.baseSalary && <p className="text-rose-500 text-[10px] mt-0.5">{errors.baseSalary}</p>}
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1">
                    Date d'Embauche *
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1">
                    Statut du Dossier
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ISWEmployee['status'])}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                    <option value="Suspendu">Suspendu</option>
                    <option value="Archivé">Archivé</option>
                  </select>
                </div>
              </div>

              {/* Section 4: Coordonnées & Ville */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1">
                    Genre
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1">
                    Ville / Résidence
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-1">
                    Email Pro *
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 5: Classification Conventionnelle & CNPS */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs">
                  <Award className="w-4 h-4 text-[#3B7A2C]" />
                  <span>Classification Professionnelle &amp; Sécurité Sociale (CNPS)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">N° CNPS / CNSS</label>
                    <input
                      type="text"
                      value={formCnpsNumber}
                      onChange={(e) => setFormCnpsNumber(e.target.value)}
                      placeholder="Ex: 112-98432-88"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Indice</label>
                    <input
                      type="text"
                      value={formIndice}
                      onChange={(e) => setFormIndice(e.target.value)}
                      placeholder="Ex: A, B, C"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Niveau / Catégorie</label>
                    <input
                      type="text"
                      value={formNiveau}
                      onChange={(e) => setFormNiveau(e.target.value)}
                      placeholder="Ex: 7, 8, 10"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Coefficient</label>
                    <input
                      type="text"
                      value={formCoefficient}
                      onChange={(e) => setFormCoefficient(e.target.value)}
                      placeholder="Ex: 350, 450"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Qualification / Diplôme</label>
                    <input
                      type="text"
                      value={formQualification}
                      onChange={(e) => setFormQualification(e.target.value)}
                      placeholder="Ex: Ingénieur Génie Civil, Soudeur ASME IX..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Convention Collective</label>
                    <input
                      type="text"
                      value={formConventionCollective}
                      onChange={(e) => setFormConventionCollective(e.target.value)}
                      placeholder="Ex: Convention Collective Nationale du BTP"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3B7A2C] hover:bg-[#2D6020] text-white font-bold text-xs rounded-xl shadow-md shadow-[#3B7A2C]/20 transition-colors cursor-pointer"
                >
                  {editingEmployee ? 'Enregistrer les Modifications' : 'Créer le Collaborateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXPORT PERSONNALISÉ (COLONNES & PRÉSÉLECTIONS) */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsExportModalOpen(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  Exporter la Liste du Personnel
                </h3>
                <p className="text-[11px] text-slate-400">
                  Personnalisez les colonnes, ajoutez des colonnes vierges de signature et choisissez le format
                </p>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Modèles de disposition préenregistrés */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <Bookmark className="w-3.5 h-3.5 text-[#3B7A2C]" />
                  <span>Modèles de disposition enregistrés</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedPresetName}
                    onChange={(e) => handleLoadPreset(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="">Sélectionner un modèle...</option>
                    {presets.map((p) => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  {selectedPresetName && (
                    <button
                      onClick={() => handleDeletePreset(selectedPresetName)}
                      className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Nom du nouveau modèle..."
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <button
                    onClick={handleSavePreset}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>

              {/* Sélection des colonnes prédéfinies */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-2 uppercase">
                  Colonnes à inclure dans le rapport
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedColumns.map((col, idx) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={col.selected}
                        onChange={() => handleToggleColumn(idx)}
                        className="rounded text-[#3B7A2C] focus:ring-[#3B7A2C]"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Colonnes personnalisées / vierges (Ex: Signature) */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-2 uppercase">
                  Colonnes vierges personnalisées (ex: Émargement, Remarques)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newCustomColumnName}
                    onChange={(e) => setNewCustomColumnName(e.target.value)}
                    placeholder="Nom de la colonne (ex: Signature Salarié)..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                  <button
                    onClick={handleAddCustomColumn}
                    className="px-3 py-1.5 bg-[#3B7A2C] hover:bg-[#2D6020] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>

                {customColumns.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {customColumns.map((col, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-[#3B7A2C] dark:bg-emerald-950/40 dark:text-emerald-300 border border-[#3B7A2C]/20 rounded-lg text-xs font-bold"
                      >
                        {col}
                        <button
                          onClick={() => handleRemoveCustomColumn(idx)}
                          className="hover:text-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Choix du format */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-xs font-bold mb-2 uppercase">
                  Format de téléchargement
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat('pdf')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      exportFormat === 'pdf'
                        ? 'border-[#3B7A2C] bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Document PDF (.pdf)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('word')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      exportFormat === 'word'
                        ? 'border-[#3B7A2C] bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    Microsoft Word (.doc)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={triggerStaffExport}
                className="px-5 py-2 bg-[#3B7A2C] hover:bg-[#2D6020] text-white font-bold text-xs rounded-xl shadow-md shadow-[#3B7A2C]/20 transition-colors cursor-pointer"
              >
                Générer le Fichier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
