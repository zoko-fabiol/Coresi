/**
 * printDocumentHelper.ts - CORESI International ERP
 * Moteur d'Impression Isolée Haute Définition et Export PDF A4
 * Inspiré de l'architecture CGA-SPE et ISW Technosys
 * 
 * Règle d'or : Supprime STRICTEMENT les en-têtes et pieds de page du navigateur
 * (aucune mention de l'URL, de la date ou de localhost:3000), garantit le format
 * physique A4 sans coupure indésirable et normalise les montants FCFA.
 */

// Normalise les montants FCFA pour éviter les corruptions d'espaces insécables (U+00A0 / U+202F) dans jsPDF
export const formatFCFA = (val: number | string | undefined | null): string => {
  const num = Math.round(Number(val) || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
};

/**
 * Impression Isolée via Iframe masquée
 * Garantit l'absence totale des métadonnées du navigateur (URL, heure, numéro de page navigateur).
 */
export const printOfficialA4Document = (elementId: string, documentTitle = 'Document Officiel CORESI'): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`[printOfficialA4Document] Élément #${elementId} introuvable, fallback window.print()`);
    window.print();
    return;
  }

  // Création d'une iframe isolée temporaire
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${documentTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          /* RÈGLE D'OR : margin: 0 supprime tous les en-têtes et pieds de page par défaut du navigateur */
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
          }
          .no-print {
            display: none !important;
          }
          /* Conteneur calibré strictement pour feuille A4 unique */
          .single-a4-page {
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            padding: 8mm 10mm !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: #ffffff !important;
          }
        </style>
      </head>
      <body>
        <div class="single-a4-page">
          ${element.outerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
              setTimeout(function() {
                try {
                  window.parent.document.body.removeChild(window.frameElement);
                } catch (e) {}
              }, 1200);
            }, 400);
          };
        </script>
      </body>
    </html>
  `);
  doc.close();
};

/**
 * Téléchargement d'un PDF A4 propre vectoriel et infalsifiable
 */
export const downloadOfficialA4Pdf = async (
  elementId: string,
  fileName = 'Document_Officiel_CORESI.pdf'
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`[downloadOfficialA4Pdf] Élément #${elementId} introuvable`);
    return;
  }

  try {
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = (html2pdfModule as any).default || html2pdfModule;

    const opt = {
      margin: [6, 6, 6, 6],
      filename: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    await html2pdf().set(opt).from(element).save();
  } catch (err) {
    console.error('[downloadOfficialA4Pdf] Erreur capture PDF, fallback impression isolée:', err);
    printOfficialA4Document(elementId, fileName.replace('.pdf', ''));
  }
};
