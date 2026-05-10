import { createCloudinaryStorageProvider } from '../../providers/storage/cloudinaryStorageProvider.js';
import { createLocalStorageProvider } from '../../providers/storage/localStorageProvider.js';
import type { AssetStorageProvider } from '../../core/providers.js';
import type { KtaviConfig } from '../../core/config.js';
import type { StorageTarget } from '../../core/types.js';

/**
 * Factory function that resolves the correct storage provider based on the
 * given target, config, and environment variables.
 */
export function createStorageProvider(
  target: StorageTarget,
  config: KtaviConfig,
  env: NodeJS.ProcessEnv,
): AssetStorageProvider {
  if (target === 'cloudinary') {
    return createCloudinaryStorageProvider({
      cloudName: env.CLOUDINARY_CLOUD_NAME ?? '',
      apiKey: env.CLOUDINARY_API_KEY ?? '',
      apiSecret: env.CLOUDINARY_API_SECRET ?? '',
      folder: config.storage.cloudinary?.folder ?? 'blog-covers',
    });
  }

  return createLocalStorageProvider(
    config.storage.local?.outputDir ?? './temp/images/blog',
    config.storage.local?.publicPathPrefix ?? '/images/blog',
  );
}
