import React, { useState } from 'react';
import {
  Building2,
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  FolderKanban,
  ExternalLink,
  X,
  CheckCircle,
} from 'lucide-react';
import { Client, Supplier, Project, Invoice, DocumentRecord } from '../../types';
import { DataService } from '../../services/dataService';
import { DetailSidebar, SidebarSection, SidebarField, SidebarStatusBadge, SidebarDivider } from '../shared/DetailSidebar';

interface PartnersModuleProps {
  clients: Client[];
  suppliers: Supplier[];
  projects: Project[];
  invoices: Invoice[];
  documents: DocumentRecord[];
  onSelectDocument: (doc: DocumentRecord) => void;
  onSelectProject?: (projectId: string) => void;
  onRefresh: () => void;
}

export const PartnersModule: React.FC<PartnersModuleProps> = ({
  clients,
  suppliers,
  projects,
  invoices,
  documents,
  onSelectDocument,
  onSelectProject,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'suppliers'>('clients');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // New partner modal
  const [newPartnerOpen, setNewPartnerOpen] = useState<boolean>(false);
  const [partnerType, setPartnerType] = useState<'client' | 'supplier'>('client');
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [categoryOrSector, setCategoryOrSector] = useState<string>('');

  const filteredClients = clients.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q);
  });

  const filteredSuppliers = suppliers.filter((s) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (partnerType === 'client') {
      const newClient: Client = {
        id: `cli-${Date.now()}`,
        code: code || `CLI-COR-${Math.floor(10 + Math.random() * 90)}`,
        name,
        contactPerson,
        email,
        phone,
        address,
        sector: categoryOrSector || 'Industrie & Énergie',
        activeProjectsCount: 0,
        createdAt: new Date().toISOString(),
      };
      await DataService.saveClient(newClient);
    } else {
      const newSupplier: Supplier = {
        id: `sup-${Date.now()}`,
        code: code || `FOUR-COR-${Math.floor(10 + Math.random() * 90)}`,
        name,
        category: categoryOrSector || 'Fournitures Industrielles',
        contactPerson,
        email,
        phone,
        address,
        createdAt: new Date().toISOString(),
      };
      await DataService.saveSupplier(newSupplier);
    }

    onRefresh();
    setNewPartnerOpen(false);
    setName('');
    setCode('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Répertoire Clients &amp; Fournisseurs Industriels
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Historique complet des relations commerciales, commandes, factures, paiements et projets associés.
          </p>
        </div>

        <button
          onClick={() => {
            setPartnerType(activeTab === 'clients' ? 'client' : 'supplier');
            setNewPartnerOpen(true);
          }}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau {activeTab === 'clients' ? 'Client' : 'Fournisseur'}</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'clients' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Clients ({clients.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'suppliers' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Fournisseurs ({suppliers.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Rechercher un ${activeTab === 'clients' ? 'client' : 'fournisseur'}...`}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid of Partners */}
      {activeTab === 'clients' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const clientProjects = projects.filter((p) => p.clientId === client.id || p.clientName.toLowerCase().includes(client.name.toLowerCase()));
            const clientInvoices = invoices.filter((i) => i.partyName.toLowerCase().includes(client.name.toLowerCase()));
            const clientDocs = documents.filter((d) => d.context.clientId === client.id || d.context.clientName?.toLowerCase().includes(client.name.toLowerCase()));

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold">
                        {client.code}
                      </span>
                      <h3 className="font-bold text-base text-white mt-1 hover:text-cyan-300">
                        {client.name}
                      </h3>
                      <p className="text-xs text-slate-400">{client.sector}</p>
                    </div>
                    <span className="text-xs bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-1 rounded-full font-semibold">
                      {clientProjects.length} chantiers
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80 my-3">
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-slate-300">Contact :</span>
                      <span>{client.contactPerson}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{client.phone}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{client.email}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{client.address}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>{clientInvoices.length} factures enregistrées</span>
                  <span className="text-cyan-400 font-medium flex items-center gap-1">
                    <span>Fiche complète</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuppliers.map((supplier) => {
            const supplierInvoices = invoices.filter((i) => i.partyName.toLowerCase().includes(supplier.name.toLowerCase()));
            const supplierDocs = documents.filter((d) => d.context.supplierId === supplier.id || d.context.supplierName?.toLowerCase().includes(supplier.name.toLowerCase()));

            return (
              <div
                key={supplier.id}
                onClick={() => setSelectedSupplier(supplier)}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold">
                        {supplier.code}
                      </span>
                      <h3 className="font-bold text-base text-white mt-1 hover:text-amber-300">
                        {supplier.name}
                      </h3>
                      <p className="text-xs text-slate-400">{supplier.category}</p>
                    </div>
                    <span className="text-xs bg-amber-950 text-amber-300 border border-amber-800 px-2.5 py-1 rounded-full font-semibold">
                      Fournisseur
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80 my-3">
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-slate-300">Contact :</span>
                      <span>{supplier.contactPerson}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{supplier.phone}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{supplier.email}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{supplier.address}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>{supplierDocs.length} documents &amp; factures GED</span>
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <span>Fiche complète</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DetailSidebar: Client Detail */}
      {selectedClient && (
        <DetailSidebar
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          title={selectedClient.name}
          subtitle={`${selectedClient.sector} • ${selectedClient.address}`}
          referenceCode={selectedClient.code}
          badge={{ text: 'Client Donneur d\'Ordre', color: 'bg-cyan-950 text-cyan-400 border-cyan-800' }}
          documents={documents
            .filter((d) => d.context.clientId === selectedClient.id || d.context.clientName?.toLowerCase().includes(selectedClient.name.toLowerCase()))
            .map((d) => ({
              id: d.id,
              title: d.title,
              type: d.category.toUpperCase(),
              url: d.cloudinary.secureUrl,
              date: d.createdAt?.split('T')[0],
            }))}
          onDocumentClick={(doc) => {
            const found = documents.find((d) => d.id === doc.id);
            if (found) onSelectDocument(found);
          }}
          actions={[
            {
              label: 'Contacter',
              icon: <Phone className="w-3.5 h-3.5" />,
              onClick: () => window.open(`tel:${selectedClient.phone}`),
              variant: 'secondary',
            },
            {
              label: 'Envoyer Email',
              icon: <Mail className="w-3.5 h-3.5" />,
              onClick: () => window.open(`mailto:${selectedClient.email}`),
              variant: 'primary',
            },
          ]}
        >
          {/* Section: Coordonnées & Contact */}
          <SidebarSection title="Coordonnées Principales" icon={<Building2 className="w-3.5 h-3.5 text-cyan-400" />}>
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <SidebarField label="Contact Référent" value={selectedClient.contactPerson} highlight />
              <SidebarField label="Téléphone Direct" value={selectedClient.phone} mono />
              <SidebarField label="Email" value={selectedClient.email} />
              <SidebarField label="Siège / Adresse" value={selectedClient.address} />
              <SidebarField label="Secteur d'Activité" value={selectedClient.sector} />
            </div>
          </SidebarSection>

          <SidebarDivider />

          {/* Section: Chantiers & Projets */}
          <SidebarSection title="Chantiers & Projets Réalisés" icon={<FolderKanban className="w-3.5 h-3.5 text-cyan-400" />}>
            <div className="space-y-2">
              {projects
                .filter((p) => p.clientId === selectedClient.id || p.clientName.toLowerCase().includes(selectedClient.name.toLowerCase()))
                .map((prj) => (
                  <div
                    key={prj.id}
                    onClick={() => {
                      setSelectedClient(null);
                      if (onSelectProject) onSelectProject(prj.id);
                    }}
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold text-xs">{prj.code}</span>
                        <span className="font-semibold text-slate-800 dark:text-white text-xs group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          {prj.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{prj.location} • Budget: {prj.budget.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold font-mono text-xs">{prj.progress}%</span>
                  </div>
                ))}
              {projects.filter((p) => p.clientId === selectedClient.id || p.clientName.toLowerCase().includes(selectedClient.name.toLowerCase())).length === 0 && (
                <p className="text-xs text-slate-400 italic">Aucun chantier rattaché pour le moment.</p>
              )}
            </div>
          </SidebarSection>

          <SidebarDivider />

          {/* Section: Synthèse Financière */}
          <SidebarSection title="Synthèse Factures & Règlements" icon={<DollarSign className="w-3.5 h-3.5 text-emerald-400" />}>
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <SidebarField
                label="Nombre de Factures"
                value={`${invoices.filter((i) => i.partyName.toLowerCase().includes(selectedClient.name.toLowerCase())).length} facture(s)`}
              />
              <SidebarField
                label="Total Facturé TTC"
                value={`${invoices.filter((i) => i.partyName.toLowerCase().includes(selectedClient.name.toLowerCase())).reduce((s, i) => s + i.totalAmount, 0).toLocaleString('fr-FR')} FCFA`}
                highlight
                mono
              />
              <SidebarField
                label="Total Encaissé"
                value={`${invoices.filter((i) => i.partyName.toLowerCase().includes(selectedClient.name.toLowerCase())).reduce((s, i) => s + i.paidAmount, 0).toLocaleString('fr-FR')} FCFA`}
                mono
              />
            </div>
          </SidebarSection>
        </DetailSidebar>
      )}

      {/* DetailSidebar: Supplier Detail */}
      {selectedSupplier && (
        <DetailSidebar
          isOpen={!!selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
          title={selectedSupplier.name}
          subtitle={`${selectedSupplier.category} • ${selectedSupplier.address}`}
          referenceCode={selectedSupplier.code}
          badge={{ text: 'Fournisseur Matériel / Service', color: 'bg-amber-950 text-amber-400 border-amber-800' }}
          documents={documents
            .filter((d) => d.context.supplierId === selectedSupplier.id || d.context.supplierName?.toLowerCase().includes(selectedSupplier.name.toLowerCase()))
            .map((d) => ({
              id: d.id,
              title: d.title,
              type: d.category.toUpperCase(),
              url: d.cloudinary.secureUrl,
              date: d.createdAt?.split('T')[0],
            }))}
          onDocumentClick={(doc) => {
            const found = documents.find((d) => d.id === doc.id);
            if (found) onSelectDocument(found);
          }}
          actions={[
            {
              label: 'Appeler',
              icon: <Phone className="w-3.5 h-3.5" />,
              onClick: () => window.open(`tel:${selectedSupplier.phone}`),
              variant: 'secondary',
            },
            {
              label: 'Envoyer Email',
              icon: <Mail className="w-3.5 h-3.5" />,
              onClick: () => window.open(`mailto:${selectedSupplier.email}`),
              variant: 'primary',
            },
          ]}
        >
          {/* Section: Coordonnées Commerciales */}
          <SidebarSection title="Coordonnées Commerciales" icon={<Truck className="w-3.5 h-3.5 text-amber-400" />}>
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <SidebarField label="Contact Commercial" value={selectedSupplier.contactPerson} highlight />
              <SidebarField label="Téléphone" value={selectedSupplier.phone} mono />
              <SidebarField label="Email" value={selectedSupplier.email} />
              <SidebarField label="Adresse & Entrepôt" value={selectedSupplier.address} />
              <SidebarField label="Spécialité & Matériaux" value={selectedSupplier.category} />
            </div>
          </SidebarSection>

          <SidebarDivider />

          {/* Section: Historique Achats */}
          <SidebarSection title="Commandes & Factures Fournisseur" icon={<DollarSign className="w-3.5 h-3.5 text-cyan-400" />}>
            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <SidebarField
                label="Factures Enregistrées"
                value={`${invoices.filter((i) => i.partyName.toLowerCase().includes(selectedSupplier.name.toLowerCase())).length} facture(s)`}
              />
              <SidebarField
                label="Montant Total Facturé"
                value={`${invoices.filter((i) => i.partyName.toLowerCase().includes(selectedSupplier.name.toLowerCase())).reduce((s, i) => s + i.totalAmount, 0).toLocaleString('fr-FR')} FCFA`}
                highlight
                mono
              />
            </div>
          </SidebarSection>
        </DetailSidebar>
      )}

      {/* New Partner Modal */}
      {newPartnerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 text-xs">
            <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg">
                  <Building2 className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-sm text-white">
                  Nouveau {partnerType === 'client' ? 'Client Industriel' : 'Fournisseur de Matériel'}
                </h3>
              </div>
              <button onClick={() => setNewPartnerOpen(false)} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Type d'Entité</label>
                  <select
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="client">Client Donneur d'Ordre</option>
                    <option value="supplier">Fournisseur Matériel / Service</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Code Réf</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex: CLI-TOT-01"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">Raison Sociale / Nom</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: ENI CONGO SA"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Contact Référent</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Ex: Patrick M'Bemba (Chef Achats)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Secteur / Catégorie</label>
                  <input
                    type="text"
                    value={categoryOrSector}
                    onChange={(e) => setCategoryOrSector(e.target.value)}
                    placeholder="Ex: Pétrole Offshore ou Tuyaux Sch 80"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+242 06 600..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@societe.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">Adresse Géographique</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Zone Portuaire, Pointe-Noire"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewPartnerOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
