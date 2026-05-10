import type { AssetStorageProvider } from '../../src/core/providers.js';
import type { UploadedAsset } from '../../src/core/types.js';

export function createMockAssetStorageProvider(
  uploadedAsset: Partial<UploadedAsset> = {},
): AssetStorageProvider {
  return {
    async upload(image): Promise<UploadedAsset> {
      return {
        provider: 'local',
        url: `https://example.test/assets/${image.fileName}.png`,
        ...uploadedAsset,
      };
    },
  };
}
