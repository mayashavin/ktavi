import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/providers/storage/cloudinaryStorageProvider.js', () => ({
  createCloudinaryStorageProvider: vi.fn(() => ({ upload: vi.fn() })),
}));

vi.mock('../../../src/providers/storage/localStorageProvider.js', () => ({
  createLocalStorageProvider: vi.fn(() => ({ upload: vi.fn() })),
}));

import { createStorageProvider } from '../../../src/cli/shared/providers.js';
import { createCloudinaryStorageProvider } from '../../../src/providers/storage/cloudinaryStorageProvider.js';
import { createLocalStorageProvider } from '../../../src/providers/storage/localStorageProvider.js';
import type { PoliraConfig } from '../../../src/core/config.js';

const baseConfig: PoliraConfig = {
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
    const config: PoliraConfig = {
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
    const config: PoliraConfig = {
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
    const config: PoliraConfig = {
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
    const config: PoliraConfig = {
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
