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

interface HrModuleProps {
  employees: Employee[];
  documents: DocumentRecord[];
  onOpenScannerForEmployee: (employee: Employee) => void;
  onSelectDocument: (doc: DocumentRecord) => void;
  onNewEmployee: () => void;
  onRefresh: () => void;
}

export const HrModule: React.FC<HrModuleProps> = ({
  employees,
  documents,
  onOpenScannerForEmployee,
  onSelectDocument,
  onNewEmployee,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'certifications' | 'missions'>('employees');
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
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Ressources Humaines &amp; Main-d'Œuvre Qualifiée
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Dossiers du personnel, qualifications industrielles (soudeurs ASME, tuyauterie), congés, missions et archivage avec rétention d'historique.
          </p>
        </div>

        <button
          onClick={onNewEmployee}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Collaborateur</span>
        </button>
      </div>

      {/* 3 Top Tabs */}
      <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'employees' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Personnel &amp; Fiches Individuelles ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('certifications')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'certifications' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Habilitations &amp; Certifications Métiers ({allCertifications.length})
        </button>
        <button
          onClick={() => setActiveTab('missions')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'missions' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Missions de Terrain &amp; Congés ({allLeaves.length})
        </button>
      </div>

      {/* TAB 1: EMPLOYEES */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Filter and Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, matricule ou qualification..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">Tous les départements</option>
              <option value="direction">Direction Générale</option>
              <option value="ingenierie">Ingénierie &amp; Qualité</option>
              <option value="tuyauterie">Tuyauterie Haute Pression</option>
              <option value="chaudronnerie">Chaudronnerie &amp; Montage</option>
              <option value="comptabilite">Administration &amp; Finances</option>
            </select>

            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setStatusFilter('actif')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'actif' ? 'bg-slate-800 text-cyan-300 shadow font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Actifs ({employees.filter((e) => e.status === 'actif').length})
              </button>
              <button
                onClick={() => setStatusFilter('archive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'archive' ? 'bg-slate-800 text-amber-300 shadow font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Historique Archivés ({employees.filter((e) => e.status === 'archive').length})
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'all' ? 'bg-slate-800 text-white shadow font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tous ({employees.length})
              </button>
            </div>
          </div>

          {/* Employees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((emp) => {
              const empDocs = documents.filter((d) => d.context.employeeId === emp.id || d.title.toLowerCase().includes(emp.fullName.toLowerCase()));

              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between cursor-pointer transition-all duration-200"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white font-bold flex items-center justify-center text-sm shadow-md">
                          {emp.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                            {emp.fullName}
                          </h4>
                          <p className="text-xs text-cyan-400 font-medium">{emp.role}</p>
                          <span className="text-[10px] font-mono text-slate-400">{emp.matricule}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          emp.status === 'actif'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {emp.status === 'actif' ? 'Actif' : 'Archivé'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-3">
                      <p className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                        <span className="capitalize">{emp.department} • Contrat {emp.contractType.toUpperCase()}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{emp.phone}</span>
                      </p>
                      {emp.assignedProjectName && (
                        <p className="flex items-center gap-2 text-cyan-300">
                          <Building2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          <span className="truncate">{emp.assignedProjectName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Fiche &amp; Avances ({empDocs.length} docs)
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenScannerForEmployee(emp);
                      }}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Numériser contrat, certificat ou passeport sécurité"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scanner RH</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
