import path from 'node:path';
import type { AssetStorageProvider } from '../../core/providers.js';
import type { GeneratedImage, UploadedAsset } from '../../core/types.js';
import { writeBuffer } from '../../utils/fileSystem.js';
import { KtaviError } from '../../core/errors.js';

export function createLocalStorageProvider(
  outputDir: string,
  publicPathPrefix: string,
): AssetStorageProvider {
  return {
    async upload(image: GeneratedImage): Promise<UploadedAsset> {
      const buffer = image.buffer ?? (image.base64 ? Buffer.from(image.base64, 'base64') : null);

      if (!buffer) {
        throw new KtaviError('Image has no buffer or base64 data to save.', 'WRITE_FAILED');
      }

      const normalizedFileName = path.parse(image.fileName).name;
      const filePath = path.join(outputDir, `${normalizedFileName}.png`);
      await writeBuffer(filePath, buffer);

      const publicUrl = `${publicPathPrefix}/${normalizedFileName}.png`;

      return {
        provider: 'local',
        url: publicUrl,
        localPath: filePath,
        bytes: buffer.length,
      };
    },
  };
}
