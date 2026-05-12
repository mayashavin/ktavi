import path from 'node:path';
import { input, select, confirm } from '@inquirer/prompts';
import {
  getGlobalConfigPath,
  getProjectConfigPath,
  loadSingleConfigFile,
} from '../../core/config.js';
import type { KtaviConfig } from '../../core/config.js';
import { logger } from '../../core/logger.js';
import { fileExists } from '../../utils/fileSystem.js';
import { writeFile } from '../../utils/fileSystem.js';

export type ConfigInitOptions = {
  global?: boolean;
  force?: boolean;
  defaults?: boolean;
};

const SCHEMA_DEFAULTS: KtaviConfig = {
  ai: { provider: 'openai', textModel: 'gpt-4o', imageModel: 'gpt-image-2' },
  markdown: { coverField: 'cover', preserveFrontmatterOrder: true },
  writing: { defaultMode: 'medium' },
  image: { size: '1792x1024' },
  storage: {
    provider: 'local',
    local: { outputDir: './temp/images/blog', publicPathPrefix: '/images/blog' },
  },
};

async function detectTypeScript(): Promise<boolean> {
  return fileExists(path.resolve('tsconfig.json'));
}

async function loadExistingConfig(isGlobal: boolean): Promise<Partial<KtaviConfig> | null> {
  try {
    const configPath = isGlobal ? getGlobalConfigPath() : getProjectConfigPath();
    return await loadSingleConfigFile(configPath);
  } catch {
    return null;
  }
}

function getDefault<T>(existing: Partial<KtaviConfig> | null, path: string, fallback: T): T {
  const parts = path.split('.');
  let current: unknown = existing;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return fallback;
    current = (current as Record<string, unknown>)[part];
  }
  return (current as T) ?? fallback;
}

async function promptForConfig(
  existing: Partial<KtaviConfig> | null,
): Promise<Partial<KtaviConfig>> {
  const provider = await select({
    message: 'AI provider',
    choices: [
      { value: 'openai' as const, name: 'OpenAI' },
      { value: 'anthropic' as const, name: 'Anthropic (Claude)' },
    ],
    default: getDefault(existing, 'ai.provider', SCHEMA_DEFAULTS.ai.provider),
  });

  const textModel = await input({
    message: 'Text model',
    default: getDefault(existing, 'ai.textModel', SCHEMA_DEFAULTS.ai.textModel),
  });

  const imageModel = await input({
    message: 'Image model (leave empty to skip)',
    default: getDefault(existing, 'ai.imageModel', SCHEMA_DEFAULTS.ai.imageModel ?? ''),
  });

  const defaultMode = await select({
    message: 'Writing review mode',
    choices: [
      { value: 'light' as const, name: 'light — minimal suggestions' },
      { value: 'medium' as const, name: 'medium — balanced' },
      { value: 'strong' as const, name: 'strong — thorough review' },
    ],
    default: getDefault(existing, 'writing.defaultMode', SCHEMA_DEFAULTS.writing.defaultMode),
  });

  const imageSize = await select({
    message: 'Cover image size',
    choices: [
      { value: '1024x1024' as const, name: '1024x1024 — square' },
      { value: '1536x1024' as const, name: '1536x1024 — landscape' },
      { value: '1792x1024' as const, name: '1792x1024 — wide landscape' },
    ],
    default: getDefault(existing, 'image.size', SCHEMA_DEFAULTS.image.size),
  });

  const imageStyle = await input({
    message: 'Cover image style (leave empty to skip)',
    default: getDefault(existing, 'image.style', ''),
  });

  const coverField = await select({
    message: 'Frontmatter cover field name',
    choices: [
      { value: 'cover' as const },
      { value: 'image' as const },
      { value: 'heroImage' as const },
      { value: 'ogImage' as const },
      { value: 'thumbnail' as const },
    ],
    default: getDefault(existing, 'markdown.coverField', SCHEMA_DEFAULTS.markdown.coverField),
  });

  const storageProvider = await select({
    message: 'Storage provider',
    choices: [
      { value: 'local' as const, name: 'local — save to disk' },
      { value: 'cloudinary' as const, name: 'cloudinary — upload to Cloudinary' },
    ],
    default: getDefault(existing, 'storage.provider', SCHEMA_DEFAULTS.storage.provider),
  });

  const config: Partial<KtaviConfig> = {};

  config.ai = { provider, textModel };
  if (imageModel) config.ai.imageModel = imageModel;

  config.writing = { defaultMode };

  config.image = { size: imageSize };
  if (imageStyle) config.image.style = imageStyle;

  config.markdown = { coverField };

  if (storageProvider === 'local') {
    const outputDir = await input({
      message: 'Local output directory',
      default: getDefault(
        existing,
        'storage.local.outputDir',
        SCHEMA_DEFAULTS.storage.local!.outputDir,
      ),
    });
    const publicPathPrefix = await input({
      message: 'Public path prefix',
      default: getDefault(
        existing,
        'storage.local.publicPathPrefix',
        SCHEMA_DEFAULTS.storage.local!.publicPathPrefix,
      ),
    });
    config.storage = { provider: storageProvider, local: { outputDir, publicPathPrefix } };
  } else {
    const folder = await input({
      message: 'Cloudinary folder',
      default: getDefault(existing, 'storage.cloudinary.folder', 'blog-covers'),
    });
    config.storage = { provider: storageProvider, cloudinary: { folder } };
  }

  return config;
}

function serializeConfig(config: Partial<KtaviConfig>): string {
  const lines: string[] = [];

  function renderObject(obj: Record<string, unknown>, indent: number): void {
    const pad = '  '.repeat(indent);
    const entries = Object.entries(obj);
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      const comma = ',';
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        lines.push(`${pad}${key}: {`);
        renderObject(value as Record<string, unknown>, indent + 1);
        lines.push(`${pad}}${comma}`);
      } else if (typeof value === 'string') {
        lines.push(`${pad}${key}: ${JSON.stringify(value)}${comma}`);
      } else {
        lines.push(`${pad}${key}: ${String(value)}${comma}`);
      }
    }
  }

  lines.push('export default {');
  renderObject(config as Record<string, unknown>, 1);
  lines.push('};');
  lines.push('');

  return lines.join('\n');
}

function printNextSteps(filePath: string, config: Partial<KtaviConfig>): void {
  logger.success(`Config written to ${filePath}`);
  logger.blank();
  logger.heading('Next steps');

  const steps: string[] = [];
  const provider = config.ai?.provider ?? SCHEMA_DEFAULTS.ai.provider;
  if (provider === 'openai') {
    steps.push('Set OPENAI_API_KEY in your .env');
  } else if (provider === 'anthropic') {
    steps.push('Set ANTHROPIC_API_KEY in your .env');
  }
  if (config.storage?.provider === 'cloudinary') {
    steps.push('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
  }
  steps.push('Run ktavi analyze <file> to get started');

  for (const step of steps) {
    console.log(`  • ${step}`);
  }
  logger.blank();
}

export async function runConfigInit(opts: ConfigInitOptions): Promise<void> {
  const isGlobal = opts.global ?? false;

  let ext: string;
  if (isGlobal) {
    ext = '.js';
  } else if (opts.defaults) {
    ext = (await detectTypeScript()) ? '.ts' : '.js';
  } else {
    const tsDetected = await detectTypeScript();
    ext = await select({
      message: 'Config file format',
      choices: [
        { value: '.ts', name: '.ts (TypeScript)' },
        { value: '.js', name: '.js (JavaScript)' },
      ],
      default: tsDetected ? '.ts' : '.js',
    });
  }

  const filePath = isGlobal ? getGlobalConfigPath() : path.resolve(`ktavi.config${ext}`);

  const exists = await fileExists(filePath);
  if (exists && !opts.force) {
    const overwrite = await confirm({
      message: `${filePath} already exists. Overwrite?`,
      default: false,
    });
    if (!overwrite) {
      logger.info('Aborted.');
      return;
    }
  }

  const existing = await loadExistingConfig(isGlobal);

  let config: Partial<KtaviConfig>;
  if (opts.defaults) {
    config = {
      ai: { ...SCHEMA_DEFAULTS.ai },
      writing: { ...SCHEMA_DEFAULTS.writing },
      image: { ...SCHEMA_DEFAULTS.image },
      markdown: { ...SCHEMA_DEFAULTS.markdown },
      storage: { ...SCHEMA_DEFAULTS.storage },
    };
  } else {
    config = await promptForConfig(existing);
  }

  const content = serializeConfig(config);

  if (!opts.force && !opts.defaults) {
    logger.blank();
    logger.heading('Preview');
    console.log(content);
    const confirmed = await confirm({
      message: 'Write this config?',
      default: true,
    });
    if (!confirmed) {
      logger.info('Aborted.');
      return;
    }
  }

  await writeFile(filePath, content);
  printNextSteps(filePath, config);
}
