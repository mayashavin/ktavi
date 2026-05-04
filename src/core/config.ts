import path from 'node:path';
import os from 'node:os';
import { z } from 'zod';
import type { CoverFieldName, ImageSize, StorageTarget, WritingMode } from './types.js';

export type PoliraConfig = {
  ai: {
    provider: 'openai';
    textModel: string;
    imageModel?: string;
  };
  markdown: {
    coverField: CoverFieldName;
    preserveFrontmatterOrder?: boolean;
  };
  writing: {
    defaultMode: WritingMode;
  };
  image: {
    size: ImageSize;
    style?: string;
  };
  storage: {
    provider: StorageTarget;
    local?: {
      outputDir: string;
      publicPathPrefix: string;
    };
    cloudinary?: {
      folder: string;
    };
  };
};

const poliraConfigSchema = z.object({
  ai: z
    .object({
      provider: z.literal('openai').default('openai'),
      textModel: z.string().default('gpt-4o'),
      imageModel: z.string().optional(),
    })
    .default({}),
  markdown: z
    .object({
      coverField: z.enum(['cover', 'image', 'heroImage', 'ogImage', 'thumbnail']).default('cover'),
      preserveFrontmatterOrder: z.boolean().optional().default(true),
    })
    .default({}),
  writing: z
    .object({
      defaultMode: z.enum(['light', 'medium', 'strong']).default('medium'),
    })
    .default({}),
  image: z
    .object({
      size: z.enum(['1024x1024', '1536x1024', '1792x1024']).default('1792x1024'),
      style: z.string().optional(),
    })
    .default({}),
  storage: z
    .object({
      provider: z.enum(['local', 'cloudinary']).default('local'),
      local: z
        .object({
          outputDir: z.string().default('./public/images/blog'),
          publicPathPrefix: z.string().default('/images/blog'),
        })
        .optional()
        .default({}),
      cloudinary: z
        .object({
          folder: z.string().default('blog-covers'),
        })
        .optional(),
    })
    .default({}),
});

const DEFAULT_CONFIG: PoliraConfig = {
  ai: { provider: 'openai', textModel: 'gpt-4o', imageModel: 'gpt-image-2' },
  markdown: { coverField: 'cover', preserveFrontmatterOrder: true },
  writing: { defaultMode: 'medium' },
  image: { size: '1792x1024' },
  storage: {
    provider: 'local',
    local: { outputDir: './temp/images/blog', publicPathPrefix: '/images/blog' },
  },
};

export function getGlobalConfigPath(): string {
  return path.join(os.homedir(), '.config', 'polira', 'config.ts');
}

export function getProjectConfigPath(): string {
  return path.resolve('polira.config.ts');
}

async function loadConfigFile(filePath: string): Promise<Partial<PoliraConfig> | null> {
  try {
    const module = await import(filePath);
    return (module.default ?? module) as Partial<PoliraConfig>;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    const message = (err as Error).message ?? '';
    const isFileMissing =
      (code === 'ERR_MODULE_NOT_FOUND' && message.includes(filePath)) || code === 'ENOENT';
    if (isFileMissing) {
      return null;
    }
    throw err;
  }
}

function deepMerge(base: PoliraConfig, override: Partial<PoliraConfig>): PoliraConfig {
  const result = { ...base };

  if (override.ai) {
    result.ai = { ...result.ai, ...override.ai };
  }
  if (override.markdown) {
    result.markdown = { ...result.markdown, ...override.markdown };
  }
  if (override.writing) {
    result.writing = { ...result.writing, ...override.writing };
  }
  if (override.image) {
    result.image = { ...result.image, ...override.image };
  }
  if (override.storage) {
    result.storage = { ...result.storage, ...override.storage };
    if (override.storage.local) {
      result.storage.local = {
        ...(result.storage.local ?? DEFAULT_CONFIG.storage.local!),
        ...override.storage.local,
      };
    }
    if (override.storage.cloudinary) {
      result.storage.cloudinary = {
        ...(result.storage.cloudinary ?? {}),
        ...override.storage.cloudinary,
      };
    }
  }

  return poliraConfigSchema.parse(result) as PoliraConfig;
}

export async function loadConfig(
  configPath?: string,
  globalConfigPath?: string,
): Promise<PoliraConfig> {
  let config = { ...DEFAULT_CONFIG };

  const resolvedGlobalPath = globalConfigPath ?? getGlobalConfigPath();
  const globalRaw = await loadConfigFile(resolvedGlobalPath);
  if (globalRaw) {
    config = deepMerge(config, globalRaw);
  }

  const projectPath = configPath ?? getProjectConfigPath();
  const projectRaw = await loadConfigFile(projectPath);
  if (projectRaw) {
    config = deepMerge(config, projectRaw);
  }

  return config;
}

export { DEFAULT_CONFIG };
