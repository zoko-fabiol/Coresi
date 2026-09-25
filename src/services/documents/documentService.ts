import { DocumentRecord, CloudinaryMeta } from '../../types';
import { CloudinaryService } from '../cloudinaryService';
import { FirestoreService } from '../firebase/firestoreService';
import { AuthService } from '../auth/authService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  authorId: string;
  authorName: string;
  createdAt: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  changeReason: string;
  fileSize: number;
  fileName: string;
}

export interface UploadBatchItem {
  file: File | { name: string; type: string; dataUrl: string; size: number };
  title: string;
  category: any;
  projectId?: string;
  clientId?: string;
  supplierId?: string;
  employeeId?: string;
}

export interface BatchProgressCallback {
  (current: number, total: number, fileName: string, status: 'uploading' | 'success' | 'error', errorMsg?: string): void;
}

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'txt', 'rtf',
  'xls', 'xlsx', 'csv',
  'ppt', 'pptx',
  'mdb', 'accdb',
  'jpg', 'jpeg', 'png', 'webp', 'tiff', 'tif'
];

export class DocumentService {
  public static isValidFileExtension(fileName: string): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return !!ext && ALLOWED_DOCUMENT_EXTENSIONS.includes(ext);
  }

  public static async uploadDocumentWithVersion(
    dataUrl: string,
    fileName: string,
    title: string,
    category: any,
    context: {
      projectId?: string;
      projectName?: string;
      clientId?: string;
      clientName?: string;
      supplierId?: string;
      supplierName?: string;
      employeeId?: string;
      employeeName?: string;
    } = {},
    changeReason: string = 'Création initiale'
  ): Promise<DocumentRecord> {
    if (!this.isValidFileExtension(fileName)) {
      throw new Error(`Format de fichier non autorisé. Formats acceptés : ${ALLOWED_DOCUMENT_EXTENSIONS.join(', ')}`);
    }

    const user = AuthService.getCurrentUser();
    const folderCategory = context.projectId ? 'projects' : (category || 'general');

    // 1. Upload to Cloudinary
    const cloudMeta: CloudinaryMeta = await CloudinaryService.uploadFile(
      dataUrl,
      fileName,
      folderCategory
    );

    // 2. Generate atomic sequence number
    const docNumber = await FirestoreService.getNextAtomicSequence('document', 'DOC', 4, true);

    const docId = `doc-${Date.now()}`;
    const newDoc: DocumentRecord = {
      id: docId,
      documentNumber: docNumber,
      title: title || fileName,
      category,
      status: 'validated',
      cloudinary: cloudMeta,
      context,
      ocr: {
        text: '',
        confidence: 0,
        processedAt: new Date().toISOString(),
      },
      metadata: {
        documentDate: new Date().toISOString().split('T')[0],
        description: title || fileName,
        tags: [category],
      },
      uploadedBy: user?.displayName || 'Collaborateur CORESI',
      uploadedById: user?.uid || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Save to Firestore
    await FirestoreService.saveDocument('documents', docId, newDoc);

    // 4. Create initial version record
    const versionId = `ver-${docId}-v1`;
    const versionRecord: DocumentVersion = {
      id: versionId,
      documentId: docId,
      versionNumber: 1,
      authorId: user?.uid || 'system',
      authorName: user?.displayName || 'Utilisateur',
      createdAt: new Date().toISOString(),
      cloudinaryUrl: cloudMeta.secureUrl,
      cloudinaryPublicId: cloudMeta.publicId,
      changeReason,
      fileSize: cloudMeta.bytes,
      fileName,
    };
    await setDoc(doc(db, 'documentVersions', versionId), versionRecord);

    return newDoc;
  }

  public static async createNewVersion(
    docId: string,
    dataUrl: string,
    fileName: string,
    changeReason: string
  ): Promise<DocumentRecord> {
    const existing = await FirestoreService.getDocument<DocumentRecord>('documents', docId);
    if (!existing) throw new Error('Document introuvable.');

    const user = AuthService.getCurrentUser();
    const folderCategory = existing.context?.projectId ? 'projects' : (existing.category || 'general');

    const cloudMeta = await CloudinaryService.uploadFile(dataUrl, fileName, folderCategory);
    const existingVersionNum = (existing as any).version || 1;
    const nextVersionNum = existingVersionNum + 1;

    const updatedDoc: DocumentRecord = {
      ...existing,
      cloudinary: cloudMeta,
      updatedAt: new Date().toISOString(),
    };
    (updatedDoc as any).version = nextVersionNum;

    await FirestoreService.saveDocument('documents', docId, updatedDoc);

    const versionId = `ver-${docId}-v${nextVersionNum}`;
    const versionRecord: DocumentVersion = {
      id: versionId,
      documentId: docId,
      versionNumber: nextVersionNum,
      authorId: user?.uid || 'system',
      authorName: user?.displayName || 'Utilisateur',
      createdAt: new Date().toISOString(),
      cloudinaryUrl: cloudMeta.secureUrl,
      cloudinaryPublicId: cloudMeta.publicId,
      changeReason,
      fileSize: cloudMeta.bytes,
      fileName,
    };
    await setDoc(doc(db, 'documentVersions', versionId), versionRecord);

    return updatedDoc;
  }

  public static async batchUpload(
    items: UploadBatchItem[],
    onProgress?: BatchProgressCallback
  ): Promise<{ succeeded: DocumentRecord[]; failed: { fileName: string; error: string }[] }> {
    const succeeded: DocumentRecord[] = [];
    const failed: { fileName: string; error: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const fileName = 'name' in item.file ? item.file.name : 'document.bin';

      if (onProgress) {
        onProgress(i + 1, items.length, fileName, 'uploading');
      }

      try {
        let dataUrl = '';
        if ('dataUrl' in item.file) {
          dataUrl = item.file.dataUrl;
        } else if (item.file instanceof File) {
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(item.file as File);
          });
        }

        const docRecord = await this.uploadDocumentWithVersion(
          dataUrl,
          fileName,
          item.title || fileName,
          item.category,
          {
            projectId: item.projectId,
            clientId: item.clientId,
            supplierId: item.supplierId,
            employeeId: item.employeeId,
          }
        );

        succeeded.push(docRecord);
        if (onProgress) {
          onProgress(i + 1, items.length, fileName, 'success');
        }
      } catch (err: any) {
        failed.push({ fileName, error: err.message || 'Erreur inconnue' });
        if (onProgress) {
          onProgress(i + 1, items.length, fileName, 'error', err.message);
        }
      }
    }

    return { succeeded, failed };
  }
}
