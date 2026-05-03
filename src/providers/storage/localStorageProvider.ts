import path from 'node:path';
import type { AssetStorageProvider } from '../../core/providers.js';
import type { GeneratedImage, UploadedAsset } from '../../core/types.js';
import { writeBuffer } from '../../utils/fileSystem.js';
import { PoliraError } from '../../core/errors.js';

export function createLocalStorageProvider(
  outputDir: string,
  publicPathPrefix: string,
): AssetStorageProvider {
  return {
    async upload(image: GeneratedImage): Promise<UploadedAsset> {
      const buffer = image.buffer ?? (image.base64 ? Buffer.from(image.base64, 'base64') : null);

      if (!buffer) {
        throw new PoliraError('Image has no buffer or base64 data to save.', 'WRITE_FAILED');
      }

      const filePath = path.join(outputDir, `${image.fileName}.png`);
      await writeBuffer(filePath, buffer);

      const publicUrl = `${publicPathPrefix}/${image.fileName}`;

      return {
        provider: 'local',
        url: publicUrl,
        localPath: filePath,
        bytes: buffer.length,
      };
    },
  };
}
