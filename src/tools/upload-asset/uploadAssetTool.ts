import type { AssetStorageProvider } from '../../core/providers.js';
import type { GeneratedImage, UploadedAsset } from '../../core/types.js';

export async function uploadAssetTool(
  input: { image: GeneratedImage },
  storageProvider: AssetStorageProvider,
): Promise<UploadedAsset> {
  return storageProvider.upload(input.image);
}
