import { jsPDF } from 'jspdf';
import { TechnicalReport, ReportActionItem } from '../types/advancedModules';
import { DataService } from './dataService';
import { AdminConfigService } from './adminConfigService';

export class ReportService {
  /**
   * Create a new technical report or PV
   */
  public static async createReport(
    data: Omit<TechnicalReport, 'id' | 'reference' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: TechnicalReport['status'];
    }
  ): Promise<TechnicalReport> {
    const isPv = data.type.startsWith('pv_') || data.type === 'epreuve_hydraulique';
    const reference = AdminConfigService.getNextSequenceNumber(isPv ? 'pv' : 'rpt');
    const id = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const report: TechnicalReport = {
      ...data,
      id,
      reference,
      status: data.status || 'soumis',
      createdAt: now,
      updatedAt: now,
    };

    await DataService.saveTechnicalReport(report);
    return report;
  }

  /**
   * Validate a technical report or PV
   */
  public static async validateReport(
    reportId: string,
    validatorName: string,
    validatorRole: string
  ): Promise<void> {
    const reports = DataService.getTechnicalReports();
    const rep = reports.find((r) => r.id === reportId);
    if (!rep) return;

    rep.status = 'valide';
    rep.validatedBy = `${validatorName} (${validatorRole.toUpperCase()})`;
    rep.validatedAt = new Date().toISOString();
    rep.updatedAt = new Date().toISOString();

    await DataService.saveTechnicalReport(rep);
  }

  /**
   * Generates a high-quality, standardized PDF document for reports and PVs
   */
  public static generatePdf(report: TechnicalReport): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const comp = AdminConfigService.getCompanySettings();

    // 1. Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(comp.name, 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`${comp.legalForm} • ${comp.registrationNumber} • ${comp.taxId}`, 14, 21);
    doc.text(`${comp.address}, ${comp.city} — ${comp.country} | Tél: ${comp.phone}`, 14, 26);

    // Accent line
    doc.setFillColor(6, 182, 212); // cyan-500
    doc.rect(0, 34, 210, 2, 'F');

    // 2. Document Title Box
    let y = 46;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const titleType = report.type.toUpperCase().replace(/_/g, ' ');
    doc.text(`${titleType} : ${report.reference}`, 14, y);

    y += 7;
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(report.title, 14, y, { maxWidth: 180 });

    y += 12;
    // Metadata table
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, 182, 26, 2, 2, 'F');

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Date du rapport :', 18, y + 6);
    doc.text('Chantier / Projet :', 18, y + 13);
    doc.text('Site d\'intervention :', 18, y + 20);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(report.date || new Date().toISOString().split('T')[0], 55, y + 6);
    doc.text(report.projectName || 'Non rattaché', 55, y + 13);
    doc.text(report.siteName || 'Base Principale', 55, y + 20);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Auteur / Rédacteur :', 110, y + 6);
    doc.text('Statut validation :', 110, y + 13);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(report.authorName, 145, y + 6);
    doc.text(report.status.toUpperCase(), 145, y + 13);

    y += 34;

    // Helper for section headings
    const addSection = (title: string, content: string | undefined, isHighlight = false) => {
      if (!content || !content.trim()) return;
      if (y > 255) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(isHighlight ? 14 : 30, isHighlight ? 116 : 41, isHighlight ? 144 : 59);
      doc.text(title.toUpperCase(), 14, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const splitText = doc.splitTextToSize(content, 182);
      doc.text(splitText, 14, y);
      y += splitText.length * 4.5 + 4;
    };

    if (report.participants && report.participants.length > 0) {
      addSection('Participants & Signataires', report.participants.join(' • '));
    }

    addSection('1. Objet & Synthèse', report.summary);
    addSection('2. Travaux & Constatations', report.workPerformed || report.observations);
    if (report.issues) {
      addSection('3. Anomalies & Points Bloquants', report.issues);
    }
    if (report.reserves) {
      addSection('4. Réserves Formulées', report.reserves, true);
    }
    if (report.recommendations) {
      addSection('5. Recommandations & Prescriptions', report.recommendations);
    }

    // Action Items Table
    if (report.actionItems && report.actionItems.length > 0) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('PLAN D\'ACTIONS ENGAGÉES', 14, y);
      y += 5;

      report.actionItems.forEach((action, idx) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(
          `${idx + 1}. ${action.description} — Responsable: ${action.responsiblePerson} (Échéance: ${action.deadlineDate}) [${action.status}]`,
          18,
          y
        );
        y += 5;
      });
      y += 4;
    }

    // Signatures & Stamps
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    y = Math.max(y + 6, 235);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('POUR LE CHEF DE PROJET / QA', 20, y);
    doc.text('POUR LA DIRECTION GÉNÉRALE', 130, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Rédigé le ${report.date} par :`, 20, y);
    doc.text(report.authorName, 20, y + 4);

    if (report.validatedBy) {
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.setFont('helvetica', 'bold');
      doc.text('DOCUMENT OFFICIELLEMENT VALIDÉ', 130, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`Par : ${report.validatedBy}`, 130, y + 4);
      doc.text(`Le : ${report.validatedAt ? report.validatedAt.split('T')[0] : ''}`, 130, y + 8);
    } else {
      doc.text('En attente de visa formel', 130, y);
    }

    // Save PDF
    doc.save(`${report.reference}_${report.title.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  }
}
