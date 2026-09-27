import React, { useState } from 'react';
import {
  Users,
  Plus,
  Camera,
  FileText,
  Phone,
  Mail,
  Briefcase,
  Award,
  Search,
  CheckCircle,
  Building2,
  Archive,
  Calendar,
  DollarSign,
  MapPin,
  X,
  ShieldCheck,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Employee, DocumentRecord, SalaryAdvance, EmployeeLeave, TechnicalCertification } from '../../types';
import { DataService } from '../../services/dataService';
import { DetailSidebar, SidebarSection, SidebarField, SidebarStatusBadge, SidebarDivider } from '../shared/DetailSidebar';
import { AttendanceTab } from './sections/AttendanceTab';
import { LeavesAndOvertimeTab } from './sections/LeavesAndOvertimeTab';
import { EmployeesTab } from './sections/EmployeesTab';

interface HrModuleProps {
  employees: Employee[];
  documents: DocumentRecord[];
  onOpenScannerForEmployee: (employee: Employee) => void;
  onSelectDocument: (doc: DocumentRecord) => void;
  onNewEmployee: () => void;
  onRefresh: () => void;
  showToast?: (msg: string) => void;
}

export const HrModule: React.FC<HrModuleProps> = ({
  employees,
  documents,
  onOpenScannerForEmployee,
  onSelectDocument,
  onNewEmployee,
  onRefresh,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'leaves_overtime' | 'certifications' | 'missions'>('employees');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'actif' | 'archive' | 'all'>('actif');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const filteredEmployees = employees.filter((emp) => {
    if (statusFilter !== 'all' && emp.status !== statusFilter) return false;
    if (departmentFilter !== 'all' && emp.department !== departmentFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      emp.fullName.toLowerCase().includes(q) ||
      emp.matricule.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q)
    );
  });

  const handleArchiveEmployee = async (emp: Employee) => {
    if (window.confirm(`Êtes-vous sûr de vouloir archiver ${emp.fullName} ? Son historique de passage sera conservé dans le registre.`)) {
      await DataService.archiveEmployee(emp.id);
      onRefresh();
      setSelectedEmployee(null);
    }
  };

  const allAdvances = DataService.getSalaryAdvances();
  const allLeaves = DataService.getEmployeeLeaves();
  const allCertifications = DataService.getCertifications();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg border border-green-500/20">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Ressources Humaines &amp; Main-d'Œuvre Industrielle
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dossiers du personnel, qualifications de soudage ASME / Tuyauterie, registre de pointage journalier, heures supplémentaires et congés.
          </p>
        </div>

        <button
          onClick={onNewEmployee}
          className="px-4 py-2.5 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-green-700/20 transition-transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Collaborateur</span>
        </button>
      </div>

      {/* Top 5 Tabs */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-stone-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5 text-xs shadow-xs">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
            activeTab === 'employees' ? 'bg-green-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Personnel &amp; Fiches ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
            activeTab === 'attendance' ? 'bg-green-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Pointage &amp; Présences
        </button>
        <button
          onClick={() => setActiveTab('leaves_overtime')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
            activeTab === 'leaves_overtime' ? 'bg-green-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Heures Sup &amp; Congés
        </button>
        <button
          onClick={() => setActiveTab('certifications')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
            activeTab === 'certifications' ? 'bg-green-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Habilitations Métiers ({allCertifications.length})
        </button>
        <button
          onClick={() => setActiveTab('missions')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
            activeTab === 'missions' ? 'bg-green-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Missions de Terrain ({allLeaves.length})
        </button>
      </div>

      {/* TAB 2: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <AttendanceTab employees={employees} showToast={showToast} />
      )}

      {/* TAB 3: LEAVES & OVERTIME */}
      {activeTab === 'leaves_overtime' && (
        <LeavesAndOvertimeTab employees={employees} showToast={showToast} />
      )}

      {/* TAB 1: EMPLOYEES */}
      {activeTab === 'employees' && (
        <EmployeesTab onRefresh={onRefresh} showToast={showToast} />
      )}

      {/* TAB 2: CERTIFICATIONS & QUALIFICATIONS TECHNIQUES */}
      {activeTab === 'certifications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white">Registre des Qualifications &amp; Habilitations Industrielles</h3>
            <p className="text-xs text-slate-400">
              Certifications soudeurs ASME IX / ISO 9606, Contrôles non destructifs (CND), permis CACES et visites médicales offshore.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allCertifications.map((cert) => (
              <div
                key={cert.id}
                className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-900 text-cyan-400 border border-slate-800">
                      {cert.category.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        cert.status === 'valide'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {cert.status === 'valide' ? 'Valide' : 'Expire bientôt (<30j)'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white">{cert.title}</h4>
                  <p className="text-xs text-slate-300 font-medium mt-1">Titulaire : {cert.employeeName}</p>
                  <p className="text-[11px] text-slate-400">Organisme émetteur : {cert.issuingBody}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Émis le : {cert.issueDate}</span>
                  <span className="font-semibold text-white">
                    Expire le : <strong className={cert.status === 'expire_bientot' ? 'text-amber-400' : 'text-slate-200'}>{cert.expiryDate}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MISSIONS & CONGÉS */}
      {activeTab === 'missions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white">Suivi des Missions de Terrain &amp; Absences</h3>
            <p className="text-xs text-slate-400">Déplacements d'équipes sur les terminaux pétroliers et usines de production.</p>
          </div>

          <div className="space-y-3">
            {allLeaves.map((leave, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{leave.employeeName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 capitalize">
                      {leave.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Affectation : <span className="text-cyan-300">{leave.destination || 'Chantier Extérieur'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Période</span>
                    <span className="text-slate-300">{leave.startDate} → {leave.endDate}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-semibold capitalize">
                    {leave.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DetailSidebar: Comprehensive Employee File */}
      <DetailSidebar
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title={selectedEmployee?.fullName || ''}
        subtitle={
          selectedEmployee
            ? `${selectedEmployee.matricule} • ${selectedEmployee.role} • Département ${selectedEmployee.department.toUpperCase()}`
            : ''
        }
        width="wide"
        referenceCode={selectedEmployee?.matricule}
        badge={
          selectedEmployee
            ? {
                text: selectedEmployee.status === 'actif' ? 'Collaborateur Actif' : 'Historique Archivé',
                color:
                  selectedEmployee.status === 'actif'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-slate-800 text-slate-400 border-slate-700',
              }
            : undefined
        }
        actions={
          selectedEmployee && selectedEmployee.status !== 'archive'
            ? [
                {
                  label: 'Scanner Document RH',
                  icon: <Camera className="w-4 h-4" />,
                  onClick: () => {
                    onOpenScannerForEmployee(selectedEmployee);
                    setSelectedEmployee(null);
                  },
                  variant: 'primary',
                },
                {
                  label: 'Archiver Collaborateur',
                  icon: <Archive className="w-4 h-4" />,
                  onClick: () => handleArchiveEmployee(selectedEmployee),
                  variant: 'danger',
                },
              ]
            : undefined
        }
      >
        {selectedEmployee && (
          <>
            <SidebarSection title="Identité & Contrat de Travail">
              <div className="grid grid-cols-2 gap-3">
                <SidebarField label="Matricule Interne" value={selectedEmployee.matricule} />
                <SidebarField label="Type de Contrat" value={selectedEmployee.contractType.toUpperCase()} />
                <SidebarField label="Département" value={selectedEmployee.department.toUpperCase()} />
                <SidebarField label="Date d'embauche" value={selectedEmployee.hireDate} />
                <SidebarField
                  label="Salaire Mensuel"
                  value={
                    selectedEmployee.salary
                      ? `${selectedEmployee.salary.toLocaleString('fr-FR')} FCFA`
                      : 'Non renseigné'
                  }
                />
                <SidebarField label="Téléphone" value={selectedEmployee.phone} />
              </div>
              <div className="mt-3">
                <SidebarField label="Email Professionnel" value={selectedEmployee.email} />
              </div>
              {selectedEmployee.assignedProjectName && (
                <div className="mt-3 bg-blue-950/40 border border-blue-800/40 p-3 rounded-xl text-blue-300 flex items-center gap-2 text-xs">
                  <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Chantier assigné : <strong>{selectedEmployee.assignedProjectName}</strong></span>
                </div>
              )}
            </SidebarSection>

            <SidebarDivider />

            <SidebarSection title="Missions de terrain & Congés">
              {allLeaves.filter(
                (l) =>
                  l.employeeId === selectedEmployee.id ||
                  l.employeeName.toLowerCase().includes(selectedEmployee.fullName.toLowerCase())
              ).length === 0 ? (
                <p className="text-xs text-slate-500 italic">Aucun congé ou mission enregistrée.</p>
              ) : (
                <div className="space-y-2">
                  {allLeaves
                    .filter(
                      (l) =>
                        l.employeeId === selectedEmployee.id ||
                        l.employeeName.toLowerCase().includes(selectedEmployee.fullName.toLowerCase())
                    )
                    .map((leave, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white capitalize">{leave.type.replace('_', ' ')}</span>
                          <p className="text-[11px] text-slate-400">
                            {leave.destination || 'Siège / Base'} • Du {leave.startDate} au {leave.endDate}
                          </p>
                        </div>
                        <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full capitalize">
                          {leave.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </SidebarSection>

            <SidebarDivider />

            <SidebarSection title="Avances Accordées & Justifications">
              {allAdvances.filter(
                (a) =>
                  a.employeeId === selectedEmployee.id ||
                  a.employeeName.toLowerCase().includes(selectedEmployee.fullName.toLowerCase())
              ).length === 0 ? (
                <p className="text-xs text-slate-500 italic">Aucune avance accordée.</p>
              ) : (
                <div className="space-y-2">
                  {allAdvances
                    .filter(
                      (a) =>
                        a.employeeId === selectedEmployee.id ||
                        a.employeeName.toLowerCase().includes(selectedEmployee.fullName.toLowerCase())
                    )
                    .map((adv, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-amber-400 font-mono">
                            {adv.amount.toLocaleString('fr-FR')} {adv.currency}
                          </p>
                          <p className="text-[11px] text-slate-300">{adv.reason}</p>
                          {adv.justificationNotes && (
                            <p className="text-[10px] text-slate-500">{adv.justificationNotes}</p>
                          )}
                        </div>
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full capitalize">
                          {adv.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </SidebarSection>

            <SidebarDivider />

            <SidebarSection title="Pièces Jointes GED Rattachées">
              {documents.filter(
                (d) =>
                  d.context.employeeId === selectedEmployee.id ||
                  d.title.toLowerCase().includes(selectedEmployee.fullName.toLowerCase())
              ).length === 0 ? (
                <p className="text-xs text-slate-500 italic">Aucun document numérisé pour ce collaborateur.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {documents
                    .filter(
                      (d) =>
                        d.context.employeeId === selectedEmployee.id ||
                        d.title.toLowerCase().includes(selectedEmployee.fullName.toLowerCase())
                    )
                    .map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setSelectedEmployee(null);
                          onSelectDocument(doc);
                        }}
                        className="p-2.5 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer flex items-center gap-2 transition-colors"
                      >
                        <img
                          src={doc.cloudinary.secureUrl}
                          alt=""
                          className="w-8 h-10 object-cover rounded border border-slate-800 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="font-semibold text-white truncate text-xs">{doc.title}</p>
                          <p className="font-mono text-[10px] text-cyan-400">{doc.documentNumber}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </SidebarSection>
          </>
        )}
      </DetailSidebar>
    </div>
  );
};
