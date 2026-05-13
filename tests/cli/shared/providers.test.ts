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
  getApiKeyForProvider,
  getApiKeyEnvName,
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

describe('getApiKeyEnvName', () => {
  it('returns OPENAI_API_KEY for openai', () => {
    expect(getApiKeyEnvName('openai')).toBe('OPENAI_API_KEY');
  });

  it('returns ANTHROPIC_API_KEY for anthropic', () => {
    expect(getApiKeyEnvName('anthropic')).toBe('ANTHROPIC_API_KEY');
  });
});

describe('getApiKeyForProvider', () => {
  it('returns OPENAI_API_KEY for openai provider', () => {
    expect(getApiKeyForProvider('openai', { OPENAI_API_KEY: 'sk-123' })).toBe('sk-123');
  });

  it('returns ANTHROPIC_API_KEY for anthropic provider', () => {
    expect(getApiKeyForProvider('anthropic', { ANTHROPIC_API_KEY: 'sk-ant-123' })).toBe(
      'sk-ant-123',
    );
  });

  it('returns undefined when key is not set', () => {
    expect(getApiKeyForProvider('openai', {})).toBeUndefined();
  });
});

describe('createTextAIProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates OpenAI provider when config.ai.provider is openai', () => {
    const config = { ...baseConfig, ai: { provider: 'openai' as const, textModel: 'gpt-4o' } };
    createTextAIProvider(config, { OPENAI_API_KEY: 'sk-123' });

    expect(createOpenAITextProvider).toHaveBeenCalledWith('sk-123', 'gpt-4o');
    expect(createAnthropicTextProvider).not.toHaveBeenCalled();
  });

  it('creates Anthropic provider when config.ai.provider is anthropic', () => {
    const config = {
      ...baseConfig,
      ai: { provider: 'anthropic' as const, textModel: 'claude-sonnet-4-20250514' },
    };
    createTextAIProvider(config, { ANTHROPIC_API_KEY: 'sk-ant-123' });

    expect(createAnthropicTextProvider).toHaveBeenCalledWith(
      'sk-ant-123',
      'claude-sonnet-4-20250514',
    );
    expect(createOpenAITextProvider).not.toHaveBeenCalled();
  });

  it('returns undefined when API key is not set', () => {
    const result = createTextAIProvider(baseConfig, {});

    expect(result).toBeUndefined();
    expect(createOpenAITextProvider).not.toHaveBeenCalled();
  });
});

describe('createImageProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates OpenAI image provider when OPENAI_API_KEY is set', () => {
    const config = {
      ...baseConfig,
      ai: { provider: 'openai' as const, textModel: 'gpt-4o', imageModel: 'gpt-image-2' },
    };
    createImageProvider(config, { OPENAI_API_KEY: 'sk-123' });

    expect(createOpenAIImageProvider).toHaveBeenCalledWith('sk-123', 'gpt-image-2');
  });

  it('returns undefined when OPENAI_API_KEY is not set', () => {
    const result = createImageProvider(baseConfig, {});

    expect(result).toBeUndefined();
    expect(createOpenAIImageProvider).not.toHaveBeenCalled();
  });
});
