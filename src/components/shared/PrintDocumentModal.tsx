import React, { useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Calendar,
  User,
  MapPin,
  Clock,
  Layers,
  Award,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  Wrench,
  Navigation,
} from 'lucide-react';
import { AdminConfigService } from '../../services/adminConfigService';
import { printOfficialA4Document, downloadOfficialA4Pdf, formatFCFA } from '../../utils/printDocumentHelper';

export type PrintDocumentType =
  | 'invoice'
  | 'purchase_order'
  | 'goods_receipt'
  | 'purchase_request'
  | 'technical_report'
  | 'work_order'
  | 'mission_order'
  | 'project_summary'
  | 'stock_transfer'
  | 'payslip'
  | 'attendance'
  | 'leave_overtime'
  | 'report'
  | 'generic';

export interface PrintDocumentData {
  type: PrintDocumentType;
  title: string;
  reference: string;
  date: string;
  recipientName?: string;
  recipientRole?: string;
  recipientMatricule?: string;
  recipientDepartment?: string;
  siteName?: string;
  periodLabel?: string;
  statusLabel?: string;

  // Commercial / Finance Details
  clientName?: string;
  clientAddress?: string;
  clientNif?: string;
  supplierName?: string;
  totalHT?: number;
  tva?: number;
  totalTTC?: number;
  amountInWords?: string;

  // Technical / Industrial Details
  equipmentName?: string;
  equipmentCode?: string;
  normeReference?: string;
  inspectionResult?: string;
  missionDestination?: string;

  // Payslip specific payload
  payslipDetails?: {
    baseSalary: number;
    seniorityBonus: number;
    transportBonus: number;
    siteBonus: number;
    grossSalary: number;
    cnssSalarial: number;
    taxesSalarial: number;
    delayDeductions: number;
    advancesDeductions: number;
    totalDeductions: number;
    netSalary: number;
    cnssPatronal: number;
    paymentMode?: string;
    bankDetails?: string;
  };

  // Structured Table & Summary for generic / purchases / reports
  tableColumns?: string[];
  tableRows?: (string | number)[][];
  summaryItems?: { label: string; value: string | number; highlight?: boolean }[];
  notes?: string;
  visaText?: string;
}

interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: PrintDocumentData | null;
  onDownloaded?: () => void;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  isOpen,
  onClose,
  documentData,
  onDownloaded,
}) => {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  if (!isOpen || !documentData) return null;

  const comp = AdminConfigService.getCompanySettings();
  const printCfg = AdminConfigService.getPrintSettings();

  const handlePrint = () => {
    printOfficialA4Document('coresi-print-sheet', `${documentData.title} - ${documentData.reference}`);
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const safeRef = documentData.reference.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${documentData.type.toUpperCase()}_${safeRef}_${documentData.date}.pdf`;
      await downloadOfficialA4Pdf('coresi-print-sheet', fileName);
      onDownloaded?.();
    } finally {
      setGeneratingPdf(false);
    }
  };

  const getTypeIcon = () => {
    switch (documentData.type) {
      case 'invoice':
        return <Receipt className="w-5 h-5 text-emerald-600" />;
      case 'purchase_order':
      case 'purchase_request':
      case 'goods_receipt':
        return <ShoppingCart className="w-5 h-5 text-orange-600" />;
      case 'work_order':
        return <Wrench className="w-5 h-5 text-blue-600" />;
      case 'mission_order':
        return <Navigation className="w-5 h-5 text-indigo-600" />;
      case 'technical_report':
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <FileText className="w-5 h-5 text-green-700" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-slate-800 flex flex-col max-h-[96vh]">
        
        {/* Top Control Bar (Non-imprimable, style CGA-SPE) */}
        <div className="px-5 py-3.5 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between bg-stone-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 flex items-center justify-center shadow-xs shrink-0">
              {getTypeIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight truncate">
                  {documentData.title}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30">
                  Gabarit A4 Officiel
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                <span className="font-bold text-[#3B7A2C]">{documentData.reference}</span>
                <span>•</span>
                <span>{documentData.date}</span>
                {documentData.siteName && (
                  <>
                    <span>•</span>
                    <span className="truncate">{documentData.siteName}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3B7A2C] hover:bg-[#2D6020] text-white font-bold text-xs transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{generatingPdf ? 'Génération...' : 'Télécharger PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-green-700 dark:text-green-400" />
              <span>Imprimer</span>
            </button>
            <div className="w-px h-6 bg-stone-200 dark:bg-slate-800 mx-0.5" />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Container with centered physical A4 Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100/80 dark:bg-slate-950/60 flex justify-center">
          <div
            id="coresi-print-sheet"
            className="w-full max-w-[740px] bg-white text-slate-900 shadow-2xl rounded-sm p-6 sm:p-8 relative flex flex-col justify-between"
            style={{
              minHeight: '1000px',
              border: '2px solid #3B7A2C',
              boxSizing: 'border-box',
            }}
          >
            {/* Watermark central de sécurité institutionnelle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none">
              <div className="text-center transform -rotate-12">
                <p className="text-7xl sm:text-8xl font-black tracking-widest text-[#3B7A2C]">
                  {printCfg.officialWatermark || 'CORESI'}
                </p>
                <p className="text-xl sm:text-2xl font-bold uppercase tracking-widest text-slate-900">
                  {printCfg.companyHeaderTitle || comp.name || 'INTERNATIONAL SARL'}
                </p>
                <p className="text-xs uppercase tracking-widest mt-1">{comp.address || 'Pointe-Noire · République du Congo'}</p>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {/* Header Letterhead */}
              <div className="border-b-2 border-[#3B7A2C] pb-3 flex justify-between items-start gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white border border-stone-200 p-1 flex items-center justify-center shadow-xs shrink-0">
                    <img
                      src="/logo.png"
                      alt="CORESI Logo"
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight leading-none">
                      {printCfg.companyHeaderTitle || 'CORESI INTERNATIONAL SARL'}
                    </h2>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wide mt-0.5">
                      {printCfg.companySubtitle || 'Chaudronnerie · Tuyauterie Haute Pression · Maintenance Industrielle'}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-1 leading-tight">
                      Siège : {comp.address} · NIF : {comp.taxId} · RCCM : {comp.registrationNumber}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[10px] space-y-0.5 shrink-0">
                  <div className="inline-block bg-stone-100 border border-stone-200 rounded px-2 py-0.5 font-mono font-bold text-[#3B7A2C]">
                    REF : {documentData.reference}
                  </div>
                  <p className="text-slate-500 font-medium">Date d'émission : {documentData.date}</p>
                  {documentData.periodLabel && (
                    <p className="text-slate-500 font-medium">Période : {documentData.periodLabel}</p>
                  )}
                  {documentData.statusLabel && (
                    <div className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {documentData.statusLabel}
                    </div>
                  )}
                </div>
              </div>

              {/* Document Title Banner */}
              <div className="bg-gradient-to-r from-[#3B7A2C] via-[#336b26] to-[#254f1c] text-white p-3 rounded-lg shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[8.5px] font-black uppercase tracking-widest text-emerald-200 block">
                    DOCUMENT INDUSTRIEL CERTIFIÉ
                  </span>
                  <h1 className="text-sm sm:text-base font-extrabold tracking-wide uppercase">
                    {documentData.title}
                  </h1>
                </div>
                <div className="text-right text-[9px] text-emerald-100 font-mono">
                  {comp.country.toUpperCase()} · OHADA
                </div>
              </div>

              {/* Recipient / Partner Context Box */}
              {(documentData.recipientName || documentData.clientName || documentData.supplierName) && (
                <div className="grid grid-cols-2 gap-4 bg-stone-50 border border-stone-200 p-3 rounded-lg text-xs">
                  <div>
                    <span className="text-[9.5px] uppercase font-bold text-slate-500 block">
                      {documentData.clientName
                        ? 'Client / Maître d\'Ouvrage :'
                        : documentData.supplierName
                        ? 'Fournisseur / Prestataire :'
                        : 'Collaborateur / Opérateur :'}
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm mt-0.5">
                      {documentData.clientName || documentData.supplierName || documentData.recipientName}
                    </p>
                    {documentData.clientAddress && (
                      <p className="text-slate-600 text-[11px] mt-0.5">{documentData.clientAddress}</p>
                    )}
                    {documentData.recipientRole && (
                      <p className="text-slate-600 font-medium">{documentData.recipientRole}</p>
                    )}
                  </div>
                  <div>
                    {documentData.clientNif && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">NIF Client :</span>
                        <strong className="font-mono text-slate-800">{documentData.clientNif}</strong>
                      </div>
                    )}
                    {documentData.recipientMatricule && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Matricule :</span>
                        <strong className="font-mono text-[#3B7A2C]">{documentData.recipientMatricule}</strong>
                      </div>
                    )}
                    {documentData.recipientDepartment && (
                      <div className="flex items-center justify-between text-[11px] mt-0.5">
                        <span className="text-slate-500">Département :</span>
                        <span className="font-semibold text-slate-700">{documentData.recipientDepartment}</span>
                      </div>
                    )}
                    {documentData.siteName && (
                      <div className="flex items-center justify-between text-[11px] mt-0.5">
                        <span className="text-slate-500">Chantier / Base :</span>
                        <span className="font-semibold text-slate-700">{documentData.siteName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TECHNICAL SPECIFIC DETAILS */}
              {(documentData.equipmentName || documentData.normeReference || documentData.inspectionResult || documentData.missionDestination) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-emerald-50/50 border border-emerald-200 p-2.5 rounded-lg text-xs">
                  {documentData.equipmentName && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Équipement / Machine</span>
                      <strong className="text-slate-800">{documentData.equipmentName}</strong>
                      {documentData.equipmentCode && <span className="block text-[10px] font-mono text-slate-500">{documentData.equipmentCode}</span>}
                    </div>
                  )}
                  {documentData.normeReference && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Norme / Procédé</span>
                      <strong className="text-[#3B7A2C]">{documentData.normeReference}</strong>
                    </div>
                  )}
                  {documentData.inspectionResult && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Résultat Contrôle</span>
                      <span className="font-bold text-emerald-700">{documentData.inspectionResult}</span>
                    </div>
                  )}
                  {documentData.missionDestination && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Destination</span>
                      <strong className="text-slate-800">{documentData.missionDestination}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* SPECIFIC PAYSLIP SECTION */}
              {documentData.type === 'payslip' && documentData.payslipDetails && (
                <div className="space-y-3">
                  <div className="border border-stone-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-stone-100 text-[10px] uppercase font-bold text-slate-600 border-b border-stone-200">
                        <tr>
                          <th className="p-2">Rubrique de Paie</th>
                          <th className="p-2 text-right">Base / Taux</th>
                          <th className="p-2 text-right text-emerald-800">Gains (+)</th>
                          <th className="p-2 text-right text-rose-800">Retenues (-)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        <tr>
                          <td className="p-2 font-bold">Salaire de Base Catégoriel</td>
                          <td className="p-2 text-right font-mono text-slate-500">100%</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">{formatFCFA(documentData.payslipDetails.baseSalary)}</td>
                          <td className="p-2 text-right font-mono text-slate-400">-</td>
                        </tr>
                        {documentData.payslipDetails.seniorityBonus > 0 && (
                          <tr>
                            <td className="p-2">Prime d'Ancienneté</td>
                            <td className="p-2 text-right font-mono text-slate-500">Barème</td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">{formatFCFA(documentData.payslipDetails.seniorityBonus)}</td>
                            <td className="p-2 text-right font-mono text-slate-400">-</td>
                          </tr>
                        )}
                        {documentData.payslipDetails.transportBonus > 0 && (
                          <tr>
                            <td className="p-2">Indemnité de Transport</td>
                            <td className="p-2 text-right font-mono text-slate-500">Forfait</td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">{formatFCFA(documentData.payslipDetails.transportBonus)}</td>
                            <td className="p-2 text-right font-mono text-slate-400">-</td>
                          </tr>
                        )}
                        {documentData.payslipDetails.siteBonus > 0 && (
                          <tr>
                            <td className="p-2">Prime de Chantier &amp; Panier</td>
                            <td className="p-2 text-right font-mono text-slate-500">Chantier</td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">{formatFCFA(documentData.payslipDetails.siteBonus)}</td>
                            <td className="p-2 text-right font-mono text-slate-400">-</td>
                          </tr>
                        )}
                        <tr className="bg-stone-50/80 font-bold border-t border-stone-200">
                          <td className="p-2 text-slate-800">TOTAL SALAIRE BRUT</td>
                          <td className="p-2 text-right">-</td>
                          <td className="p-2 text-right font-mono text-emerald-700">{formatFCFA(documentData.payslipDetails.grossSalary)}</td>
                          <td className="p-2 text-right">-</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-700">Cotisation CNSS Salariale (4%)</td>
                          <td className="p-2 text-right font-mono text-slate-500">4.0%</td>
                          <td className="p-2 text-right">-</td>
                          <td className="p-2 text-right font-mono text-rose-600 font-bold">{formatFCFA(documentData.payslipDetails.cnssSalarial)}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-700">Impôt sur le Revenu (IRPP)</td>
                          <td className="p-2 text-right font-mono text-slate-500">Barème</td>
                          <td className="p-2 text-right">-</td>
                          <td className="p-2 text-right font-mono text-rose-600 font-bold">{formatFCFA(documentData.payslipDetails.taxesSalarial)}</td>
                        </tr>
                        {documentData.payslipDetails.advancesDeductions > 0 && (
                          <tr>
                            <td className="p-2 text-slate-700">Acompte sur Salaire</td>
                            <td className="p-2 text-right font-mono text-slate-500">Déduction</td>
                            <td className="p-2 text-right">-</td>
                            <td className="p-2 text-right font-mono text-rose-600 font-bold">{formatFCFA(documentData.payslipDetails.advancesDeductions)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-[#FAF7F2] border-2 border-[#3B7A2C] rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">NET À PAYER AU SALARIÉ</span>
                      <p className="text-xs text-slate-600 mt-0.5">Mode : {documentData.payslipDetails.paymentMode || 'Virement bancaire'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black font-mono text-[#3B7A2C] block">
                        {formatFCFA(documentData.payslipDetails.netSalary)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* STRUCTURED TABLE FOR INVOICES, PURCHASES, ATTENDANCE & REPORTS */}
              {documentData.tableColumns && documentData.tableRows && (
                <div className="border border-stone-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-stone-100 text-[10px] uppercase font-bold text-slate-700 border-b border-stone-200">
                      <tr>
                        {documentData.tableColumns.map((col, idx) => (
                          <th key={idx} className={`p-2 ${idx >= documentData.tableColumns!.length - 2 ? 'text-right' : ''}`}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {documentData.tableRows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-stone-50/50' : ''}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className={`p-2 ${cIdx >= row.length - 2 ? 'text-right font-mono' : ''}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* COMMERCIAL TOTALS (Factures & Achats) */}
              {(documentData.totalHT !== undefined || documentData.totalTTC !== undefined) && (
                <div className="flex justify-end pt-1">
                  <div className="w-72 bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs space-y-1">
                    {documentData.totalHT !== undefined && (
                      <div className="flex justify-between text-slate-600">
                        <span>Total Hors Taxes (HT) :</span>
                        <strong className="font-mono text-slate-800">{formatFCFA(documentData.totalHT)}</strong>
                      </div>
                    )}
                    {documentData.tva !== undefined && (
                      <div className="flex justify-between text-slate-600">
                        <span>TVA (18%) :</span>
                        <strong className="font-mono text-slate-800">{formatFCFA(documentData.tva)}</strong>
                      </div>
                    )}
                    {documentData.totalTTC !== undefined && (
                      <div className="flex justify-between border-t border-stone-200 pt-1 text-sm font-bold text-slate-900">
                        <span className="text-[#3B7A2C]">TOTAL TTC :</span>
                        <span className="font-mono text-[#3B7A2C]">{formatFCFA(documentData.totalTTC)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Montant en lettres */}
              {documentData.amountInWords && (
                <div className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs italic text-slate-700">
                  <span className="font-bold not-italic text-slate-900">Arrêté à la somme de : </span>
                  {documentData.amountInWords}
                </div>
              )}

              {/* Summary Items (KPIs / Stats) */}
              {documentData.summaryItems && documentData.summaryItems.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {documentData.summaryItems.map((item, i) => (
                    <div key={i} className={`p-2 rounded-lg border text-center ${item.highlight ? 'bg-green-50 border-green-200 text-green-900 font-bold' : 'bg-stone-50 border-stone-200 text-slate-700'}`}>
                      <span className="text-[9px] uppercase block text-slate-500">{item.label}</span>
                      <span className="text-xs font-mono font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes & Observations */}
              {documentData.notes && (
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-[11px] text-slate-600 space-y-0.5">
                  <span className="font-bold text-slate-800 block text-[10px] uppercase">Notes &amp; Observations :</span>
                  <p>{documentData.notes}</p>
                </div>
              )}
            </div>

            {/* Signatures & Certification Footer */}
            <div className="pt-6 border-t border-stone-200 mt-6 space-y-4 relative z-10">
              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div className="p-2 border border-stone-200 rounded-lg bg-stone-50 flex flex-col justify-between h-24">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500">
                    {printCfg.defaultSignerLeft || 'L\'Émetteur / Responsable'}
                  </span>
                  <div className="text-[10px] text-slate-400 italic">Signature &amp; Date</div>
                  <span className="text-[10px] font-semibold text-slate-700">{documentData.visaText || 'CORESI Opérations'}</span>
                </div>

                <div className="p-2 border border-stone-200 rounded-lg bg-stone-50 flex flex-col justify-between h-24 items-center">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500">Cachet d'Homologation</span>
                  <div className="w-14 h-14 border border-dashed border-[#3B7A2C]/60 rounded-full flex items-center justify-center text-[7px] text-[#3B7A2C] font-black uppercase text-center leading-none px-1">
                    {printCfg.stampAsmeIsoText || 'CORESI SARL\nASME IX\nISO 9606-1'}
                  </div>
                  <span className="text-[9px] text-emerald-800 font-bold">VALIDÉ DIRECTION</span>
                </div>

                <div className="p-2 border border-stone-200 rounded-lg bg-stone-50 flex flex-col justify-between h-24">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500">
                    {printCfg.defaultSignerRight || 'Direction Générale / Client'}
                  </span>
                  <div className="text-[10px] text-slate-400 italic">Mention "Bon pour accord"</div>
                  <span className="text-[10px] font-semibold text-slate-700">Dr. Joseph Ndoundo (DG)</span>
                </div>
              </div>

              {/* Micro-footer */}
              <div className="flex justify-between text-[8px] text-slate-400 border-t border-stone-100 pt-1">
                <span>{printCfg.legalFormOhada || `${comp.name} · Logiciel Certifié Gestion & GED Industrielle v2.0`}</span>
                <span>Document généré le {new Date().toLocaleDateString('fr-FR')} · Page 1 / 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
