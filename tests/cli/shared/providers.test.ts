import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/providers/storage/cloudinaryStorageProvider.js', () => ({
  createCloudinaryStorageProvider: vi.fn(() => ({ upload: vi.fn() })),
}));

vi.mock('../../../src/providers/storage/localStorageProvider.js', () => ({
  createLocalStorageProvider: vi.fn(() => ({ upload: vi.fn() })),
}));

vi.mock('../../../src/providers/ai/openaiTextProvider.js', () => ({
  createOpenAITextProvider: vi.fn(() => ({ generateStructuredOutput: vi.fn() })),
}));

vi.mock('../../../src/providers/ai/anthropicTextProvider.js', () => ({
  createAnthropicTextProvider: vi.fn(() => ({ generateStructuredOutput: vi.fn() })),
}));

vi.mock('../../../src/providers/image/openaiImageProvider.js', () => ({
  createOpenAIImageProvider: vi.fn(() => ({ generateImage: vi.fn() })),
}));

import {
  createStorageProvider,
  createTextAIProvider,
  createImageProvider,
  resolveTextApiKey,
  resolveImageApiKey,
} from '../../../src/cli/shared/providers.js';
import { createCloudinaryStorageProvider } from '../../../src/providers/storage/cloudinaryStorageProvider.js';
import { createLocalStorageProvider } from '../../../src/providers/storage/localStorageProvider.js';
import { createOpenAITextProvider } from '../../../src/providers/ai/openaiTextProvider.js';
import { createAnthropicTextProvider } from '../../../src/providers/ai/anthropicTextProvider.js';
import { createOpenAIImageProvider } from '../../../src/providers/image/openaiImageProvider.js';
import type { KtaviConfig } from '../../../src/core/config.js';

const baseConfig: KtaviConfig = {
  ai: { provider: 'openai', textModel: 'gpt-4o' },
  markdown: { coverField: 'cover', preserveFrontmatterOrder: true },
  writing: { defaultMode: 'medium' },
  image: { size: '1792x1024' },
  storage: {
    provider: 'local',
    local: { outputDir: './temp/images/blog', publicPathPrefix: '/images/blog' },
  },
};

describe('createStorageProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a Cloudinary provider when target is cloudinary', () => {
    const config: KtaviConfig = {
      ...baseConfig,
      storage: {
        ...baseConfig.storage,
        provider: 'cloudinary',
        cloudinary: { folder: 'my-covers' },
      },
    };
    const env = {
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-key',
      CLOUDINARY_API_SECRET: 'test-secret',
    };

    createStorageProvider('cloudinary', config, env);

    expect(createCloudinaryStorageProvider).toHaveBeenCalledWith({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      folder: 'my-covers',
    });
    expect(createLocalStorageProvider).not.toHaveBeenCalled();
  });

  it('falls back to blog-covers folder when cloudinary config is absent', () => {
    const config: KtaviConfig = {
      ...baseConfig,
      storage: { provider: 'cloudinary' },
    };
    const env = {
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-key',
      CLOUDINARY_API_SECRET: 'test-secret',
    };

    createStorageProvider('cloudinary', config, env);

    expect(createCloudinaryStorageProvider).toHaveBeenCalledWith(
      expect.objectContaining({ folder: 'blog-covers' }),
    );
  });

  it('creates a local provider when target is local', () => {
    createStorageProvider('local', baseConfig, {});

    expect(createLocalStorageProvider).toHaveBeenCalledWith('./temp/images/blog', '/images/blog');
    expect(createCloudinaryStorageProvider).not.toHaveBeenCalled();
  });

  it('uses the schema default path for local storage config', () => {
    const config: KtaviConfig = {
      ...baseConfig,
      storage: {
        provider: 'local',
        local: { outputDir: './temp/images/blog', publicPathPrefix: '/images/blog' },
      },
    };

    createStorageProvider('local', config, {});

    expect(createLocalStorageProvider).toHaveBeenCalledWith('./temp/images/blog', '/images/blog');
  });

  it('passes empty strings for missing Cloudinary env vars', () => {
    const config: KtaviConfig = {
      ...baseConfig,
      storage: { provider: 'cloudinary', cloudinary: { folder: 'covers' } },
    };

    createStorageProvider('cloudinary', config, {});

    expect(createCloudinaryStorageProvider).toHaveBeenCalledWith({
      cloudName: '',
      apiKey: '',
      apiSecret: '',
      folder: 'covers',
    });
  });
});

describe('resolveTextApiKey', () => {
  it('prefers KTAVI_TEXT_API_KEY over provider-specific key', () => {
    expect(
      resolveTextApiKey('openai', {
        KTAVI_TEXT_API_KEY: 'ktavi-key',
        OPENAI_API_KEY: 'openai-key',
      }),
    ).toBe('ktavi-key');
  });

  it('falls back to OPENAI_API_KEY for openai provider', () => {
    expect(resolveTextApiKey('openai', { OPENAI_API_KEY: 'sk-123' })).toBe('sk-123');
  });

  it('falls back to ANTHROPIC_API_KEY for anthropic provider', () => {
    expect(resolveTextApiKey('anthropic', { ANTHROPIC_API_KEY: 'sk-ant-123' })).toBe('sk-ant-123');
  });

  it('returns undefined when no key is set', () => {
    expect(resolveTextApiKey('openai', {})).toBeUndefined();
  });
});

describe('resolveImageApiKey', () => {
  it('prefers KTAVI_IMAGE_API_KEY over OPENAI_API_KEY', () => {
    expect(
      resolveImageApiKey({ KTAVI_IMAGE_API_KEY: 'ktavi-img', OPENAI_API_KEY: 'openai-key' }),
    ).toBe('ktavi-img');
  });

  it('falls back to OPENAI_API_KEY', () => {
    expect(resolveImageApiKey({ OPENAI_API_KEY: 'sk-123' })).toBe('sk-123');
  });

  it('returns undefined when no key is set', () => {
    expect(resolveImageApiKey({})).toBeUndefined();
  });
});

describe('createTextAIProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates OpenAI provider when config.ai.provider is openai', () => {
    const config = { ...baseConfig, ai: { provider: 'openai' as const, textModel: 'gpt-4o' } };
    createTextAIProvider(config, { KTAVI_TEXT_API_KEY: 'sk-123' });

    expect(createOpenAITextProvider).toHaveBeenCalledWith('sk-123', 'gpt-4o');
    expect(createAnthropicTextProvider).not.toHaveBeenCalled();
  });

  it('creates Anthropic provider when config.ai.provider is anthropic', () => {
    const config = {
      ...baseConfig,
      ai: { provider: 'anthropic' as const, textModel: 'claude-sonnet-4-20250514' },
    };
    createTextAIProvider(config, { KTAVI_TEXT_API_KEY: 'sk-ant-123' });

    expect(createAnthropicTextProvider).toHaveBeenCalledWith(
      'sk-ant-123',
      'claude-sonnet-4-20250514',
    );
    expect(createOpenAITextProvider).not.toHaveBeenCalled();
  });

  it('uses fallback key when KTAVI_TEXT_API_KEY is not set', () => {
    const config = { ...baseConfig, ai: { provider: 'openai' as const, textModel: 'gpt-4o' } };
    createTextAIProvider(config, { OPENAI_API_KEY: 'fallback-key' });

    expect(createOpenAITextProvider).toHaveBeenCalledWith('fallback-key', 'gpt-4o');
  });

  it('returns undefined when no API key is available', () => {
    const result = createTextAIProvider(baseConfig, {});

    expect(result).toBeUndefined();
    expect(createOpenAITextProvider).not.toHaveBeenCalled();
  });
});

describe('createImageProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates OpenAI image provider with KTAVI_IMAGE_API_KEY', () => {
    const config = {
      ...baseConfig,
      ai: { provider: 'openai' as const, textModel: 'gpt-4o', imageModel: 'gpt-image-2' },
    };
    createImageProvider(config, { KTAVI_IMAGE_API_KEY: 'img-key' });

    expect(createOpenAIImageProvider).toHaveBeenCalledWith('img-key', 'gpt-image-2');
  });

  it('falls back to OPENAI_API_KEY for image provider', () => {
    const config = {
      ...baseConfig,
      ai: { provider: 'openai' as const, textModel: 'gpt-4o', imageModel: 'gpt-image-2' },
    };
    createImageProvider(config, { OPENAI_API_KEY: 'sk-123' });

    expect(createOpenAIImageProvider).toHaveBeenCalledWith('sk-123', 'gpt-image-2');
  });

  it('returns undefined when no image key is available', () => {
    const result = createImageProvider(baseConfig, {});

    expect(result).toBeUndefined();
    expect(createOpenAIImageProvider).not.toHaveBeenCalled();
  });
});
