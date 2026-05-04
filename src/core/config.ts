import path from 'node:path';
import os from 'node:os';
import { createJiti } from 'jiti';
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
  return path.join(os.homedir(), '.config', 'polira', 'config.js');
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

    // Plain Node cannot import .ts files (ERR_UNKNOWN_FILE_EXTENSION).
    // Use jiti to load them at runtime without requiring tsx.
    if (filePath.endsWith('.ts') && code === 'ERR_UNKNOWN_FILE_EXTENSION') {
      return loadConfigFileWithJiti(filePath);
    }

    // .ts file absent — fall back to .js sibling so JS projects work too.
    if (filePath.endsWith('.ts') && isFileMissing) {
      return loadConfigFile(filePath.replace(/\.ts$/, '.js'));
    }

    if (isFileMissing) {
      return null;
    }
    throw err;
  }
}

async function loadConfigFileWithJiti(filePath: string): Promise<Partial<PoliraConfig> | null> {
  try {
    const jiti = createJiti(import.meta.url, { interopDefault: true });
    const module = await jiti.import(filePath);
    return (
      (module as { default?: Partial<PoliraConfig> }).default ?? (module as Partial<PoliraConfig>)
    );
  } catch {
    // .ts file exists but can't be loaded — fall back to .js sibling
    return loadConfigFile(filePath.replace(/\.ts$/, '.js'));
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

export type ConfigSource = 'default' | 'global' | 'project';

export type ConfigValueWithSource = {
  value: unknown;
  source: ConfigSource;
};

export type ResolvedConfigWithSources = {
  config: PoliraConfig;
  sources: Record<string, ConfigValueWithSource>;
  paths: {
    global: { path: string; loaded: boolean };
    project: { path: string; loaded: boolean };
  };
};

function flattenConfig(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenConfig(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

function getSource(
  key: string,
  globalFlat: Record<string, unknown> | null,
  projectFlat: Record<string, unknown> | null,
): ConfigSource {
  if (projectFlat && key in projectFlat) return 'project';
  if (globalFlat && key in globalFlat) return 'global';
  return 'default';
}

export async function resolveConfigWithSources(
  configPath?: string,
  globalConfigPath?: string,
): Promise<ResolvedConfigWithSources> {
  const resolvedGlobalPath = globalConfigPath ?? getGlobalConfigPath();
  const projectPath = configPath ?? getProjectConfigPath();

  const globalRaw = await loadConfigFile(resolvedGlobalPath);
  const projectRaw = await loadConfigFile(projectPath);

  let config = { ...DEFAULT_CONFIG };
  if (globalRaw) config = deepMerge(config, globalRaw);
  if (projectRaw) config = deepMerge(config, projectRaw);

  const globalFlat = globalRaw ? flattenConfig(globalRaw as Record<string, unknown>) : null;
  const projectFlat = projectRaw ? flattenConfig(projectRaw as Record<string, unknown>) : null;
  const resolvedFlat = flattenConfig(config as unknown as Record<string, unknown>);

  const sources: Record<string, ConfigValueWithSource> = {};
  for (const key of Object.keys(resolvedFlat)) {
    sources[key] = {
      value: resolvedFlat[key],
      source: getSource(key, globalFlat, projectFlat),
    };
  }

  return {
    config,
    sources,
    paths: {
      global: { path: resolvedGlobalPath, loaded: globalRaw !== null },
      project: { path: projectPath, loaded: projectRaw !== null },
    },
  };
}

export { DEFAULT_CONFIG };
