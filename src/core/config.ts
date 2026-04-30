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
  ai: { provider: 'openai', textModel: 'gpt-4o' },
  markdown: { coverField: 'cover', preserveFrontmatterOrder: true },
  writing: { defaultMode: 'medium' },
  image: { size: '1792x1024' },
  storage: {
    provider: 'local',
    local: { outputDir: './public/images/blog', publicPathPrefix: '/images/blog' },
  },
};

export async function loadConfig(configPath?: string): Promise<PoliraConfig> {
  if (!configPath) {
    return DEFAULT_CONFIG;
  }

  try {
    const module = await import(configPath);
    const raw = module.default ?? module;
    return poliraConfigSchema.parse(raw) as PoliraConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export { DEFAULT_CONFIG };
