import { createCloudinaryStorageProvider } from '../../providers/storage/cloudinaryStorageProvider.js';
import { createLocalStorageProvider } from '../../providers/storage/localStorageProvider.js';
import { createOpenAITextProvider } from '../../providers/ai/openaiTextProvider.js';
import { createOpenAIImageProvider } from '../../providers/image/openaiImageProvider.js';
import { createAnthropicTextProvider } from '../../providers/ai/anthropicTextProvider.js';
import type {
  AssetStorageProvider,
  ImageGenerationProvider,
  TextAIProvider,
} from '../../core/providers.js';
import type { KtaviConfig } from '../../core/config.js';
import type { AIProvider, StorageTarget } from '../../core/types.js';

const API_KEY_ENV: Record<AIProvider, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

export function getApiKeyForProvider(
  provider: AIProvider,
  env: NodeJS.ProcessEnv,
): string | undefined {
  return env[API_KEY_ENV[provider]];
}

export function createTextAIProvider(
  config: KtaviConfig,
  env: NodeJS.ProcessEnv,
): TextAIProvider | undefined {
  const apiKey = getApiKeyForProvider(config.ai.provider, env);
  if (!apiKey) return undefined;

  switch (config.ai.provider) {
    case 'anthropic':
      return createAnthropicTextProvider(apiKey, config.ai.textModel);
    case 'openai':
    default:
      return createOpenAITextProvider(apiKey, config.ai.textModel);
  }
}

export function createImageProvider(
  config: KtaviConfig,
  env: NodeJS.ProcessEnv,
): ImageGenerationProvider | undefined {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return undefined;
  return createOpenAIImageProvider(apiKey, config.ai.imageModel);
}

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
