import { CloudinaryConfig, CloudinaryMeta } from '../types';

const STORAGE_KEY = 'coresi_cloudinary_config';

const DEFAULT_CONFIG: CloudinaryConfig = {
  cloudName: 'z2lmk5bs',
  apiKey: '111482983945734',
  apiSecret: 'nY_cXWjbKlFcr31u3gk4gjygAVM',
  uploadPreset: 'coresi_ged_unsigned',
  folder: 'CORESI',
};

// Strict file security validation from CGA SPE model
export const ALLOWED_EXTENSIONS = [
  'pdf', 'png', 'jpg', 'jpeg', 'webp',
  'xlsx', 'xls', 'docx', 'doc', 'csv', 'txt',
  'webm', 'ogg', 'mp3', 'mp4', 'm4a', 'wav'
];

export const FORBIDDEN_EXTENSIONS = [
  'html', 'htm', 'js', 'mjs', 'exe', 'bat', 'cmd', 'sh', 'php', 'vbs', 'scr', 'dll', 'jar', 'apk', 'svg'
];

export const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 Mo max pour plans industriels & scans HD
export const MAX_BASE64_FALLBACK_SIZE = 8 * 1024 * 1024; // 8 Mo max pour le stockage local Base64

export interface VoiceNoteMeta extends CloudinaryMeta {
  duration: number;
  type: 'audio';
}

export class CloudinaryService {
  public static getConfig(): CloudinaryConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.cloudName === 'coresi-industrial') {
          parsed.cloudName = DEFAULT_CONFIG.cloudName;
          parsed.apiKey = DEFAULT_CONFIG.apiKey;
          parsed.apiSecret = DEFAULT_CONFIG.apiSecret;
        }
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  }

  public static saveConfig(config: CloudinaryConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  /**
   * Validates file security (extension and size)
   */
  public static validateFile(file: File | { name: string; size: number }): { valid: boolean; error?: string } {
    const fileName = file.name || 'document';
    const fileExt = (fileName.split('.').pop() || '').toLowerCase();

    if (FORBIDDEN_EXTENSIONS.includes(fileExt) || !ALLOWED_EXTENSIONS.includes(fileExt)) {
      return {
        valid: false,
        error: `Format .${fileExt} non autorisé. Formats acceptés : PDF, PNG, JPG, WEBP, Word, Excel, Audio.`,
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Le fichier "${fileName}" dépasse le plafond de 30 Mo (${Math.round(file.size / (1024 * 1024))} Mo).`,
      };
    }

    return { valid: true };
  }

  /**
   * Converts a File or Blob into persistent Base64 Data URL
   */
  public static fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Upload with real-time XHR progress tracking (0 to 100%) and automatic Base64 fallback.
   */
  public static uploadFileWithProgress(
    file: File | Blob,
    filename: string,
    folderCategory: string = 'chantiers',
    onProgress?: (percent: number) => void
  ): Promise<CloudinaryMeta> {
    return new Promise(async (resolve, reject) => {
      if (!file) {
        reject(new Error('Aucun fichier fourni pour le téléversement.'));
        return;
      }

      // 1. Validation
      const validation = this.validateFile({ name: filename, size: file.size });
      if (!validation.valid) {
        reject(new Error(validation.error));
        return;
      }

      const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileExt = (sanitizedName.split('.').pop() || '').toLowerCase();
      const config = this.getConfig();
      const folder = `${config.folder}/${folderCategory}`.replace(/\/+/g, '/');
      const publicId = `${folder}/${Date.now()}_${sanitizedName.replace(/\.[^/.]+$/, '')}`;

      // Convert to Base64 fallback
      let fallbackDataUrl = '';
      if (file.size <= MAX_BASE64_FALLBACK_SIZE) {
        try {
          fallbackDataUrl = await this.fileToBase64(file);
        } catch (e) {
          console.warn('Base64 conversion fallback notice:', e);
        }
      }

      if (onProgress) onProgress(20);

      // Attempt Cloudinary XHR upload if cloud name is configured
      if (config.cloudName) {
        const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        if (config.uploadPreset && config.uploadPreset !== 'coresi_ged_unsigned') {
          formData.append('upload_preset', config.uploadPreset);
        } else if (config.apiKey && config.apiSecret) {
          // Signed upload
          const timestamp = Math.floor(Date.now() / 1000).toString();
          const strToSign = `folder=${folder}&timestamp=${timestamp}${config.apiSecret}`;
          const encoder = new TextEncoder();
          const data = encoder.encode(strToSign);
          const hashBuffer = await crypto.subtle.digest('SHA-1', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const signature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

          formData.append('timestamp', timestamp);
          formData.append('api_key', config.apiKey);
          formData.append('signature', signature);
        } else {
          formData.append('upload_preset', 'coresi_ged_unsigned');
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl, true);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            const percent = Math.round(20 + (e.loaded / e.total) * 80);
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (onProgress) onProgress(100);
              resolve({
                publicId: res.public_id,
                secureUrl: res.secure_url || res.url,
                resourceType: res.resource_type || (fileExt === 'pdf' ? 'raw' : 'image'),
                format: res.format || fileExt,
                bytes: res.bytes || file.size,
                width: res.width,
                height: res.height,
                folder,
              });
              return;
            } catch (err) {
              console.warn('JSON parse error from Cloudinary:', err);
            }
          }

          // Fallback if status != 200
          console.warn('[Cloudinary] Fallback vers stockage persistant local pour:', sanitizedName);
          if (onProgress) onProgress(100);
          resolve({
            publicId,
            secureUrl: fallbackDataUrl,
            resourceType: fileExt === 'pdf' ? 'raw' : 'image',
            format: fileExt || 'jpg',
            bytes: file.size,
            width: 1920,
            height: 1080,
            folder,
          });
        };

        xhr.onerror = () => {
          console.warn('[Cloudinary] Network error, fallback local');
          if (onProgress) onProgress(100);
          resolve({
            publicId,
            secureUrl: fallbackDataUrl,
            resourceType: fileExt === 'pdf' ? 'raw' : 'image',
            format: fileExt || 'jpg',
            bytes: file.size,
            width: 1920,
            height: 1080,
            folder,
          });
        };

        xhr.send(formData);
      } else {
        if (onProgress) onProgress(100);
        resolve({
          publicId,
          secureUrl: fallbackDataUrl,
          resourceType: fileExt === 'pdf' ? 'raw' : 'image',
          format: fileExt || 'jpg',
          bytes: file.size,
          width: 1920,
          height: 1080,
          folder,
        });
      }
    });
  }

  /**
   * Standard upload using dataUrl or string.
   */
  public static async uploadFile(
    dataUrl: string,
    filename: string,
    folderCategory: string = 'general',
    resourceType: 'image' | 'raw' | 'auto' = 'auto'
  ): Promise<CloudinaryMeta> {
    const config = this.getConfig();
    const folder = `${config.folder}/${folderCategory}`.replace(/\/+/g, '/');
    const publicId = `${folder}/${Date.now()}_${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    const base64Content = dataUrl.split(',')[1] || '';
    const bytes = Math.round((base64Content.length * 3) / 4);
    const format = filename.split('.').pop()?.toLowerCase() || (dataUrl.includes('application/pdf') ? 'pdf' : 'jpg');

    if (config.cloudName && config.apiKey && config.apiSecret) {
      try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const strToSign = `folder=${folder}&timestamp=${timestamp}${config.apiSecret}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(strToSign);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const formData = new FormData();
        formData.append('file', dataUrl);
        formData.append('folder', folder);
        formData.append('timestamp', timestamp);
        formData.append('api_key', config.apiKey);
        formData.append('signature', signature);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          return {
            publicId: result.public_id,
            secureUrl: result.secure_url,
            resourceType: result.resource_type || (format === 'pdf' ? 'raw' : 'image'),
            format: result.format || format,
            bytes: result.bytes || bytes,
            width: result.width,
            height: result.height,
            folder,
          };
        }
      } catch (e) {
        console.warn('Direct Cloudinary signed upload notice:', e);
      }
    }

    return {
      publicId,
      secureUrl: dataUrl,
      resourceType: format === 'pdf' ? 'raw' : 'image',
      format,
      bytes,
      folder,
      width: 1920,
      height: 1080,
    };
  }

  /**
   * Voice note upload for site operators and welders
   */
  public static async uploadChantierVoiceNote(
    audioBlob: Blob,
    durationSeconds: number = 0,
    folderCategory: string = 'notes_vocales',
    onProgress?: (pct: number) => void
  ): Promise<VoiceNoteMeta> {
    const ext = audioBlob.type?.includes('mp4') ? 'mp4' : audioBlob.type?.includes('ogg') ? 'ogg' : 'webm';
    const filename = `constat_vocal_${Date.now()}.${ext}`;
    const file = new File([audioBlob], filename, { type: audioBlob.type || 'audio/webm' });

    const meta = await this.uploadFileWithProgress(file, filename, folderCategory, onProgress);
    return {
      ...meta,
      duration: durationSeconds,
      type: 'audio',
    };
  }

  public static formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  public static getOptimizedThumbnail(url: string, width: number = 400, height: number = 300): string {
    if (!url) return '';
    if (url.includes('res.cloudinary.com')) {
      return url.replace('/upload/', `/upload/c_fill,w_${width},h_${height},q_auto,f_auto/`);
    }
    return url;
  }

  public static getCloudinaryOptimizedUrl(
    url: string,
    options: { width?: number; height?: number; quality?: string; format?: string } = {}
  ): string {
    if (!url) return '';
    if (!url.includes('cloudinary.com')) return url;
    const { width = 1200, quality = 'auto', format = 'auto' } = options;
    return url.replace('/upload/', `/upload/w_${width},c_scale,q_${quality},f_${format}/`);
  }
}

/**
 * Functional export helpers
 */
export async function uploadFileWithProgress(
  file: File | Blob,
  options?: {
    filename?: string;
    folder?: string;
    onProgress?: (progress: { percent: number }) => void;
  }
): Promise<CloudinaryMeta> {
  const name = options?.filename || (file instanceof File ? file.name : `file_${Date.now()}`);
  const folder = options?.folder || 'documents';
  const progressCb = options?.onProgress ? (pct: number) => options.onProgress!({ percent: pct }) : undefined;
  return CloudinaryService.uploadFileWithProgress(file, name, folder, progressCb);
}

export const getCloudinaryOptimizedUrl = CloudinaryService.getCloudinaryOptimizedUrl;
export const uploadChantierVoiceNote = CloudinaryService.uploadChantierVoiceNote.bind(CloudinaryService);

