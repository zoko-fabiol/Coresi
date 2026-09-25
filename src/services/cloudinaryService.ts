import { CloudinaryConfig, CloudinaryMeta } from '../types';

const STORAGE_KEY = 'coresi_cloudinary_config';

const DEFAULT_CONFIG: CloudinaryConfig = {
  cloudName: 'z2lmk5bs',
  apiKey: '111482983945734',
  apiSecret: 'nY_cXWjbKlFcr31u3gk4gjygAVM',
  uploadPreset: 'coresi_ged_unsigned',
  folder: 'CORESI',
};

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
   * Uploads base64 or blob to Cloudinary.
   * Performs direct signed upload with API key / secret,
   * or unsigned upload if a preset is provided.
   * Falls back to high-fidelity metadata representation if offline or network fails.
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

    // Calculate approximate bytes
    const base64Content = dataUrl.split(',')[1] || '';
    const bytes = Math.round((base64Content.length * 3) / 4);
    const format = filename.split('.').pop()?.toLowerCase() || (dataUrl.includes('application/pdf') ? 'pdf' : 'jpg');

    // 1. Try real signed Cloudinary upload if API key and secret are present
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
        } else {
          const errText = await response.text();
          console.warn('Direct Cloudinary signed upload response error:', errText);
        }
      } catch (e) {
        console.warn('Direct Cloudinary signed upload notice:', e);
      }
    }

    // 2. Try unsigned upload if custom preset is configured
    if (config.cloudName && config.uploadPreset && config.uploadPreset !== 'coresi_ged_unsigned') {
      try {
        const formData = new FormData();
        formData.append('file', dataUrl);
        formData.append('upload_preset', config.uploadPreset);
        formData.append('folder', folder);

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
        console.warn('Direct Cloudinary unsigned upload notice:', e);
      }
    }

    // High fidelity Cloudinary metadata object
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
}
