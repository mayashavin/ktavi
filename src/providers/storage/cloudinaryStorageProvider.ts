import type { AssetStorageProvider } from '../../core/providers.js';
import type { GeneratedImage, UploadedAsset } from '../../core/types.js';
import { PoliraError } from '../../core/errors.js';

export type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

export function createCloudinaryStorageProvider(config: CloudinaryConfig): AssetStorageProvider {
  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new PoliraError(
      'Cloudinary credentials are not set. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file.',
      'CLOUDINARY_UPLOAD_FAILED',
    );
  }

  return {
    async upload(image: GeneratedImage): Promise<UploadedAsset> {
      const { v2: cloudinary } = await import('cloudinary');

      cloudinary.config({
        cloud_name: config.cloudName,
        api_key: config.apiKey,
        api_secret: config.apiSecret,
      });

      const base64Data = image.base64 ?? image.buffer?.toString('base64');
      if (!base64Data) {
        throw new PoliraError('Image has no data to upload.', 'CLOUDINARY_UPLOAD_FAILED');
      }

      const dataUri = `data:${image.mimeType};base64,${base64Data}`;
      const publicId = image.fileName.replace(/\.[^.]+$/, '');

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: config.folder,
        public_id: publicId,
      });

      return {
        provider: 'cloudinary',
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    },
  };
}
