import React, { useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Building2,
  Calendar,
  User,
} from 'lucide-react';
import { AdminConfigService } from '../../services/adminConfigService';

export interface PrintDocumentData {
  type: 'payslip' | 'attendance' | 'report' | 'purchase_order' | 'generic';
  title: string;
  reference: string;
  date: string;
  recipientName?: string;
  recipientRole?: string;
  recipientMatricule?: string;
  recipientDepartment?: string;
  siteName?: string;
  periodLabel?: string;
  // Specific payload fields
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

// Clean format helper for FCFA amounts without non-breaking space corruption
const formatFCFA = (val: number | string | undefined): string => {
  const num = Math.round(Number(val) || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
};

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  isOpen,
  onClose,
  documentData,
  onDownloaded,
}) => {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  if (!isOpen || !documentData) return null;

  const comp = AdminConfigService.getCompanySettings();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const sheet = document.getElementById('coresi-print-sheet');
    if (!sheet) return;

    setGeneratingPdf(true);
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule as any).default || html2pdfModule;

      const safeRef = documentData.reference.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${documentData.type.toUpperCase()}_${safeRef}_${documentData.date}.pdf`;

      const opt = {
        margin: [6, 6, 6, 6],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(sheet).save();
      onDownloaded?.();
    } catch (err) {
      console.error('Erreur html2pdf:', err);
      window.print();
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-slate-800 flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:p-0">
        {/* Top Control Bar (Hidden when printed) */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between bg-stone-50 dark:bg-slate-950 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                Aperçu du Document — {documentData.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Format A4 certifié • Réf: {documentData.reference} • Date: {documentData.date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Lancer l'impression système"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-green-700/20 cursor-pointer"
              title="Télécharger le fichier PDF officiel"
            >
              {generatingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{generatingPdf ? 'Génération...' : 'Télécharger PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Viewport with Physical A4 Sheet Appearance */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-200/70 dark:bg-slate-950/80 flex justify-center">
          {/* Physical Sheet Container */}
          <div
            id="coresi-print-sheet"
            className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-10 shadow-2xl rounded-sm border border-stone-300 font-sans space-y-6 print:m-0 print:p-6 print:shadow-none print:border-none print:w-full"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Header Letterhead */}
            <div className="flex items-start justify-between border-b-2 border-[#3B7A2C] pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-stone-200 p-1 flex items-center justify-center shrink-0">
                  <img src="/logo.png" alt="CORESI" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#3B7A2C] tracking-tight leading-tight">
                    {comp.name}
                  </h2>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                    {comp.legalForm} • RCCM: {comp.registrationNumber} • NIF: {comp.taxId}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {comp.address}, {comp.city} — {comp.country} | Tél: {comp.phone}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-green-50 text-[#3B7A2C] font-mono font-bold text-xs rounded-md border border-green-200">
                  RÉF: {documentData.reference}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Date: {documentData.date}</p>
                {documentData.periodLabel && (
                  <p className="text-[10px] font-bold text-[#E8731A]">
                    Période : {documentData.periodLabel}
                  </p>
                )}
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="bg-gradient-to-r from-[#3B7A2C] to-[#2D6020] text-white p-3.5 rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200 block">
                  DOCUMENT OFFICIEL CERTIFIÉ
                </span>
                <h1 className="text-base font-extrabold tracking-wide uppercase">
                  {documentData.title}
                </h1>
              </div>
              <div className="text-right text-[10px] text-emerald-100 font-mono">
                {comp.country.toUpperCase()}
              </div>
            </div>

            {/* Recipient / Employee Information Box */}
            {documentData.recipientName && (
              <div className="grid grid-cols-2 gap-4 bg-stone-50 border border-stone-200 p-3.5 rounded-lg text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Collaborateur / Destinataire :</span>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">{documentData.recipientName}</p>
                  {documentData.recipientRole && (
                    <p className="text-slate-600 font-medium">{documentData.recipientRole}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Matricule :</span>
                    <strong className="font-mono text-[#3B7A2C]">{documentData.recipientMatricule || 'EMP-2026'}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-1">
                    <span className="text-slate-500 font-medium">Département :</span>
                    <span className="font-semibold text-slate-700">{documentData.recipientDepartment || 'Opérations Chantiers'}</span>
                  </div>
                  {documentData.siteName && (
                    <div className="flex items-center justify-between text-[11px] mt-1">
                      <span className="text-slate-500 font-medium">Site / Base :</span>
                      <span className="font-semibold text-slate-700">{documentData.siteName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PAYSLIP SPECIFIC LAYOUT */}
            {documentData.type === 'payslip' && documentData.payslipDetails && (
              <div className="space-y-4">
                {/* Earnings & Deductions Table */}
                <div className="border border-stone-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-stone-100 text-[10px] uppercase font-bold text-slate-600 border-b border-stone-200">
                      <tr>
                        <th className="p-2.5">Rubrique de Paie</th>
                        <th className="p-2.5 text-right">Base / Taux</th>
                        <th className="p-2.5 text-right text-emerald-800">Gains (+)</th>
                        <th className="p-2.5 text-right text-rose-800">Retenues (-)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      <tr>
                        <td className="p-2.5 font-bold">Salaire de Base Catégoriel</td>
                        <td className="p-2.5 text-right font-mono text-slate-500">100%</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {formatFCFA(documentData.payslipDetails.baseSalary)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                      </tr>
                      {documentData.payslipDetails.seniorityBonus > 0 && (
                        <tr>
                          <td className="p-2.5">Prime d'Ancienneté</td>
                          <td className="p-2.5 text-right font-mono text-slate-500">Barème</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {formatFCFA(documentData.payslipDetails.seniorityBonus)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                        </tr>
                      )}
                      {documentData.payslipDetails.transportBonus > 0 && (
                        <tr>
                          <td className="p-2.5">Indemnité de Transport</td>
                          <td className="p-2.5 text-right font-mono text-slate-500">Forfait</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {formatFCFA(documentData.payslipDetails.transportBonus)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                        </tr>
                      )}
                      {documentData.payslipDetails.siteBonus > 0 && (
                        <tr>
                          <td className="p-2.5">Prime de Panier / Chantier Industriel</td>
                          <td className="p-2.5 text-right font-mono text-slate-500">Jours</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {formatFCFA(documentData.payslipDetails.siteBonus)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                        </tr>
                      )}
                      {/* Deductions */}
                      <tr>
                        <td className="p-2.5 text-slate-700">Cotisation CNSS Salariale</td>
                        <td className="p-2.5 text-right font-mono text-slate-500">4.0%</td>
                        <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-700">
                          {formatFCFA(documentData.payslipDetails.cnssSalarial)}
                        </td>
                      </tr>
                      {documentData.payslipDetails.taxesSalarial > 0 && (
                        <tr>
                          <td className="p-2.5 text-slate-700">Retenue Fiscale (IRPP / CAC)</td>
                          <td className="p-2.5 text-right font-mono text-slate-500">Barème DGI</td>
                          <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                          <td className="p-2.5 text-right font-mono font-bold text-rose-700">
                            {formatFCFA(documentData.payslipDetails.taxesSalarial)}
                          </td>
                        </tr>
                      )}
                      {documentData.payslipDetails.delayDeductions > 0 && (
                        <tr>
                          <td className="p-2.5 text-rose-800">Retenue pour Retards de Pointage</td>
                          <td className="p-2.5 text-right font-mono text-rose-500">Pénalité</td>
                          <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                          <td className="p-2.5 text-right font-mono font-bold text-rose-700">
                            {formatFCFA(documentData.payslipDetails.delayDeductions)}
                          </td>
                        </tr>
                      )}
                      {documentData.payslipDetails.advancesDeductions > 0 && (
                        <tr>
                          <td className="p-2.5 text-amber-800">Remboursement d'Avance sur Salaire</td>
                          <td className="p-2.5 text-right font-mono text-amber-500">Échéance</td>
                          <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                          <td className="p-2.5 text-right font-mono font-bold text-amber-700">
                            {formatFCFA(documentData.payslipDetails.advancesDeductions)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-stone-50 font-bold border-t border-stone-200">
                      <tr>
                        <td className="p-2.5">Totaux Brut &amp; Retenues</td>
                        <td className="p-2.5"></td>
                        <td className="p-2.5 text-right font-mono text-[#3B7A2C]">
                          {formatFCFA(documentData.payslipDetails.grossSalary)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-rose-700">
                          {formatFCFA(documentData.payslipDetails.totalDeductions)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Net Pay Callout Banner */}
                <div className="bg-stone-900 text-white p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      NET À PAYER AU SALARIÉ
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Mode : {documentData.payslipDetails.paymentMode || 'Virement Bancaire'} • {documentData.payslipDetails.bankDetails || 'Banque Postale / BGFI'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-white">
                      {formatFCFA(documentData.payslipDetails.netSalary)}
                    </span>
                  </div>
                </div>

                {/* Employer Charges Summary */}
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Cotisations Patronales (CNSS, Accidents Travail, FNE) :</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatFCFA(documentData.payslipDetails.cnssPatronal)}
                  </span>
                </div>
              </div>
            )}

            {/* GENERIC / ATTENDANCE / REPORT TABLE LAYOUT */}
            {documentData.tableColumns && documentData.tableRows && (
              <div className="border border-stone-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-stone-100 text-[10px] uppercase font-bold text-slate-600 border-b border-stone-200">
                    <tr>
                      {documentData.tableColumns.map((col, idx) => (
                        <th key={idx} className="p-2.5">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {documentData.tableRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-stone-50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2.5">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Notes / Observations */}
            {documentData.notes && (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-slate-800 block text-[11px]">Observations &amp; Mentions Légales :</span>
                <p className="text-slate-600 leading-relaxed">{documentData.notes}</p>
              </div>
            )}

            {/* Official Signatures & Certified Seal */}
            <div className="pt-6 border-t-2 border-stone-200 grid grid-cols-3 gap-4 items-end text-center">
              <div className="p-3 border border-dashed border-stone-300 rounded-lg">
                <p className="text-[10px] font-bold uppercase text-slate-500">Pour le Salarié / Titulaire</p>
                <div className="h-10 flex items-center justify-center font-serif italic text-xs text-slate-600">
                  {documentData.recipientName || 'Bon pour accord'}
                </div>
                <span className="text-[9px] text-slate-400">Émargement / Lu et approuvé</span>
              </div>

              {/* CORESI Certified Technical Seal */}
              <div className="p-2.5 bg-emerald-50 border-2 border-emerald-600 rounded-xl relative shadow-xs">
                <div className="flex items-center justify-center gap-1 text-emerald-900 font-black text-[11px] uppercase">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>VISA DIRECTION RH</span>
                </div>
                <p className="text-[9px] font-extrabold text-emerald-700 mt-0.5">
                  CORESI INTERNATIONAL
                </p>
                <p className="text-[8px] text-emerald-600">CONFORME AU CODE DU TRAVAIL</p>
                <span className="text-[8px] font-mono text-emerald-800 block mt-0.5">
                  REF: {documentData.reference}
                </span>
              </div>

              <div className="p-3 border border-dashed border-stone-300 rounded-lg">
                <p className="text-[10px] font-bold uppercase text-slate-500">Direction Générale / RH</p>
                <div className="h-10 flex items-center justify-center font-serif italic text-xs font-bold text-[#3B7A2C]">
                  Direction CORESI
                </div>
                <span className="text-[9px] text-slate-400">Signature &amp; Cachet Électronique</span>
              </div>
            </div>

            {/* Footer Legal Notice */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-[9px] text-slate-400">
              <span>Édité via CORESI Gestion &amp; GED • Pointe-Noire (Congo)</span>
              <span>Document certifié à conserver sans limitation de durée</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
