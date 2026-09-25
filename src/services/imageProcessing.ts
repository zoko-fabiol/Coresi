import { jsPDF } from 'jspdf';
import { ScannedPage } from '../types';

export class ImageProcessingService {
  /**
   * Applies rotation and color filters (enhanced, grayscale, b/w, color) to an image
   */
  public static async processPage(
    dataUrl: string,
    rotation: number,
    filter: 'color' | 'grayscale' | 'bw' | 'enhanced'
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        const isRotated90or270 = rotation === 90 || rotation === 270;
        canvas.width = isRotated90or270 ? img.height : img.width;
        canvas.height = isRotated90or270 ? img.width : img.height;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        if (filter !== 'color') {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Standard luminance formula
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;

            if (filter === 'grayscale') {
              data[i] = gray;
              data[i + 1] = gray;
              data[i + 2] = gray;
            } else if (filter === 'bw') {
              // High contrast binarization for clean text scan
              const v = gray > 135 ? 255 : 0;
              data[i] = v;
              data[i + 1] = v;
              data[i + 2] = v;
            } else if (filter === 'enhanced') {
              // Adaptive contrast & unsharp text enhancement
              const contrast = 1.35;
              const enhanced = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
              // Whitening paper background slightly
              const finalVal = enhanced > 200 ? 255 : enhanced < 50 ? 0 : enhanced;
              data[i] = finalVal;
              data[i + 1] = finalVal;
              data[i + 2] = finalVal;
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = dataUrl;
    });
  }

  /**
   * Generates a multi-page PDF from an array of scanned pages
   */
  public static async generateMultiPagePdf(pages: ScannedPage[]): Promise<string> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      const pageImg = pages[i].processedDataUrl || pages[i].originalDataUrl;
      // Add image scaled to fit A4 preserving aspect ratio with clean 10mm margins
      const margin = 10;
      const targetWidth = pageWidth - margin * 2;
      const targetHeight = pageHeight - margin * 2;

      pdf.addImage(pageImg, 'JPEG', margin, margin, targetWidth, targetHeight, undefined, 'FAST');
    }

    return pdf.output('datauristring');
  }
}
