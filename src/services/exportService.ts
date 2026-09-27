/**
 * exportService.ts - CORESI SARL
 * Fonctions utilitaires d'exportation en PDF (jsPDF + autotable), Excel (ExcelJS) et Word (.doc)
 * Adapté aux couleurs de marque CORESI (#3B7A2C / Forest Green)
 */

import { logoBase64 } from './logoBase64';

// — Formatage FCFA —
// Évite les espaces insécables WinAnsi pour jsPDF
export const formatFCFA = (val: number | string | undefined | null): string => {
  const num = Math.round(Number(val) || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F CFA';
};

// — En-tête CORESI pour PDF —
const addPdfHeader = (doc: any, title: string, period: string) => {
  const pageW = doc.internal.pageSize.getWidth();

  // Bande de couleur en haut (CORESI Green: RGB 59, 122, 44)
  doc.setFillColor(59, 122, 44);
  doc.rect(0, 0, pageW, 28, 'F');

  // Logo CORESI en haut à gauche
  try {
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 12, 7, 14, 14);
    }
  } catch (e) {
    console.error("Erreur d'insertion du logo PDF :", e);
  }

  // Titre de l'entreprise
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('CORESI SARL', 29, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 245, 220);
  doc.text("Bureau d'Études & Travaux Publics — SIRH & GED", 29, 19);

  // Titre du rapport (droite)
  doc.setFont('helvetica', 'bold');
  const maxTitleWidth = pageW - 29 - 14 - 55;
  let fontSize = 11;
  doc.setFontSize(fontSize);
  while (doc.getTextWidth(title) > maxTitleWidth && fontSize > 7) {
    fontSize -= 0.5;
    doc.setFontSize(fontSize);
  }
  doc.setTextColor(255, 255, 255);
  doc.text(title, pageW - 14, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(220, 245, 220);
  doc.text(`Période : ${period}`, pageW - 14, 19, { align: 'right' });

  // Ligne de séparation
  doc.setDrawColor(90, 160, 75);
  doc.setLineWidth(0.3);
  doc.line(0, 28, pageW, 28);
};

// — Pied de page PDF —
const addPdfFooter = (doc: any) => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const now = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  doc.setDrawColor(220, 230, 220);
  doc.setLineWidth(0.2);
  doc.line(14, pageH - 15, pageW - 14, pageH - 15);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(140, 150, 140);
  doc.text(`Document officiel CORESI SARL — Généré le ${now}`, 14, pageH - 8);
  doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageW - 14, pageH - 8, { align: 'right' });
};

// — Export PDF générique —
export const exportToPDF = async (
  title: string,
  period: string,
  columns: string[],
  rows: (string | number)[][],
  filename: string,
  summaryRows: [string, string][] = []
) => {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  addPdfHeader(doc, title, period);

  const transliterate = (str: string) => {
    const map: Record<string, string> = {
      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
      'à': 'a', 'â': 'a', 'ä': 'a',
      'î': 'i', 'ï': 'i',
      'ô': 'o', 'ö': 'o',
      'ù': 'u', 'û': 'u', 'ü': 'u',
      'ç': 'c', 'ñ': 'n',
      'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
      'À': 'A', 'Â': 'A', 'Ä': 'A',
      'Î': 'I', 'Ï': 'I',
      'Ô': 'O', 'Ö': 'O',
      'Ù': 'U', 'Û': 'U', 'Ü': 'U',
      'Ç': 'C', 'Ñ': 'N',
    };
    return str.split('').map(c => map[c] !== undefined ? map[c] : (c.charCodeAt(0) <= 127 ? c : ' ')).join('');
  };

  let lastFinalY = 34;
  if (summaryRows.length > 0) {
    const pageW = doc.internal.pageSize.getWidth();
    let y = 38;
    const lineHeight = 6;
    summaryRows.forEach(([label, value]) => {
      const safeLabel = transliterate(String(label));
      const safeValue = transliterate(String(value));

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(59, 122, 44); // CORESI Green
      doc.text(safeLabel, 14, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      const maxValueWidth = pageW - 75 - 14;
      const lines = doc.splitTextToSize(safeValue, maxValueWidth);
      doc.text(lines, 75, y);

      y += lineHeight * lines.length;
    });
    lastFinalY = y + 4;
  }

  autoTable(doc, {
    startY: lastFinalY,
    head: [columns],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 122, 44], // CORESI Green
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 6.5,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [246, 250, 246], // Light soft emerald/green tint
    },
    styles: {
      overflow: 'linebreak',
      lineColor: [215, 230, 215],
      lineWidth: 0.15,
    },
    margin: { left: 10, right: 10 },
    didDrawPage: () => addPdfFooter(doc),
  });

  doc.save(`${filename}.pdf`);
};

// — Export Excel générique (exceljs) —
export const exportToExcel = async (
  sheetName: string,
  columns: string[],
  rows: (string | number)[][],
  filename: string
) => {
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CORESI SARL - SIRH v1.0';
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName.substring(0, 31));

  ws.columns = columns.map((col) => ({
    header: col,
    key: col,
    width: Math.max(col.length + 6, 18),
  }));

  // Style en-tête CORESI Green (ARGB: FF3B7A2C)
  ws.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B7A2C' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF234D1A' } }
    };
  });
  ws.getRow(1).height = 22;

  // Lignes de données
  rows.forEach((row, rowIdx) => {
    const wsRow = ws.addRow(row);
    wsRow.eachCell((cell) => {
      cell.font = { size: 9 };
      cell.alignment = { vertical: 'middle' };
      if (rowIdx % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5FAF5' } };
      }
    });
  });

  // Feuille info
  const infoWs = wb.addWorksheet('Infos CORESI');
  infoWs.addRow(['CORESI SARL — Bureau d\'Études & Travaux Publics']);
  infoWs.addRow([`Rapport : ${sheetName}`]);
  infoWs.addRow([`Généré le : ${new Date().toLocaleDateString('fr-FR')}`]);
  infoWs.getRow(1).font = { bold: true, size: 12, color: { argb: 'FF3B7A2C' } };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

// — Export Liste du Personnel sous Word (.doc compatible) —
export const exportEmployeesWord = (columns: string[], rows: (string | number)[][], title: string) => {
  const now = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; }
        .header { background-color: #3b7a2c; color: white; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
        .header-content { display: table; width: 100%; }
        .header-logo { display: table-cell; vertical-align: middle; width: 50px; }
        .header-text { display: table-cell; vertical-align: middle; padding-left: 15px; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 5px 0 0 0; font-size: 11px; color: #dcfce7; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background-color: #3b7a2c; color: white; font-weight: bold; font-size: 11px; padding: 10px; border: 1px solid #86efac; text-align: left; }
        td { padding: 8px; border: 1px solid #e2e8f0; font-size: 10px; }
        tr:nth-child(even) td { background-color: #f0fdf4; }
        .footer { margin-top: 30px; font-size: 9px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div class="header-logo">
            <img src="${logoBase64}" width="40" height="40" alt="Logo CORESI" style="border-radius: 6px;"/>
          </div>
          <div class="header-text">
            <h1>CORESI SARL — Bureau d'Études &amp; Travaux Publics</h1>
            <p>Rapport RH : ${title} &bull; Généré le ${now}</p>
          </div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell !== undefined && cell !== null ? cell : ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        Document officiel généré via la plateforme intégrée CORESI ERP — Compatible Microsoft Word
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.doc`;
  a.click();
  URL.revokeObjectURL(url);
};
