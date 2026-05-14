import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import { getGlobalConfigPath, getProjectConfigPath } from '../../src/core/config.js';

const NONEXISTENT_PATH = '/nonexistent/path/config.ts';

describe('getGlobalConfigPath', () => {
  it('returns path under ~/.config/ktavi/', () => {
    const result = getGlobalConfigPath();
    expect(result).toBe(path.join(os.homedir(), '.config', 'ktavi', 'config.js'));
  });
});

describe('getProjectConfigPath', () => {
  it('returns ktavi.config.ts resolved from cwd', () => {
    const result = getProjectConfigPath();
    expect(result).toBe(path.resolve('ktavi.config.ts'));
  });
});

describe('loadConfig', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns defaults when no config files exist', async () => {
    const { loadConfig, DEFAULT_CONFIG } = await import('../../src/core/config.js');
    const config = await loadConfig(NONEXISTENT_PATH, NONEXISTENT_PATH);
    expect(config.ai.provider).toBe(DEFAULT_CONFIG.ai.provider);
    expect(config.ai.textModel).toBe(DEFAULT_CONFIG.ai.textModel);
    expect(config.writing.defaultMode).toBe(DEFAULT_CONFIG.writing.defaultMode);
  });

  it('loads and merges a project config file', async () => {
    const { loadConfig } = await import('../../src/core/config.js');
    const fixturePath = path.resolve('tests/fixtures/test-config.ts');
    const config = await loadConfig(fixturePath, NONEXISTENT_PATH);
    expect(config.ai.textModel).toBe('gpt-4o-mini');
    expect(config.ai.provider).toBe('openai');
    expect(config.writing.defaultMode).toBe('strong');
  });

  it('preserves defaults for fields not overridden by project config', async () => {
    const { loadConfig, DEFAULT_CONFIG } = await import('../../src/core/config.js');
    const fixturePath = path.resolve('tests/fixtures/test-config.ts');
    const config = await loadConfig(fixturePath, NONEXISTENT_PATH);
    expect(config.image.size).toBe(DEFAULT_CONFIG.image.size);
    expect(config.markdown.coverField).toBe(DEFAULT_CONFIG.markdown.coverField);
  });

  it('deep-merges nested storage config', async () => {
    const { loadConfig, DEFAULT_CONFIG } = await import('../../src/core/config.js');
    const fixturePath = path.resolve('tests/fixtures/test-config-storage.ts');
    const config = await loadConfig(fixturePath, NONEXISTENT_PATH);
    expect(config.storage.provider).toBe('cloudinary');
    expect(config.storage.cloudinary?.folder).toBe('my-covers');
    expect(config.storage.local?.outputDir).toBe(DEFAULT_CONFIG.storage.local?.outputDir);
  });

  it('global config overrides defaults', async () => {
    const { loadConfig, DEFAULT_CONFIG } = await import('../../src/core/config.js');
    const globalFixture = path.resolve('tests/fixtures/test-config-global.ts');
    const config = await loadConfig(NONEXISTENT_PATH, globalFixture);
    expect(config.ai.textModel).toBe('gpt-3.5-turbo');
    expect(config.writing.defaultMode).toBe('light');
    // Fields not in global config should still be defaults
    expect(config.ai.provider).toBe(DEFAULT_CONFIG.ai.provider);
    expect(config.image.size).toBe(DEFAULT_CONFIG.image.size);
  });

  it('project config wins over global config', async () => {
    const { loadConfig } = await import('../../src/core/config.js');
    const globalFixture = path.resolve('tests/fixtures/test-config-global.ts');
    const projectFixture = path.resolve('tests/fixtures/test-config.ts');
    const config = await loadConfig(projectFixture, globalFixture);
    // project config sets textModel to 'gpt-4o-mini', overriding global 'gpt-3.5-turbo'
    expect(config.ai.textModel).toBe('gpt-4o-mini');
    // project config sets defaultMode to 'strong', overriding global 'light'
    expect(config.writing.defaultMode).toBe('strong');
  });

  it('falls back to .js config when .ts path does not exist (production support)', async () => {
    const { loadConfig } = await import('../../src/core/config.js');
    // Pass the .ts path — only the .js sibling exists on disk
    const jsOnlyFixtureTsPath = path.resolve('tests/fixtures/test-config-js-only.ts');
    const config = await loadConfig(jsOnlyFixtureTsPath, NONEXISTENT_PATH);
    expect(config.ai.textModel).toBe('gpt-4o-mini');
    expect(config.writing.defaultMode).toBe('light');
  });

  it('defaults textModel to Claude model when provider is anthropic', async () => {
    const { loadConfig, DEFAULT_TEXT_MODEL } = await import('../../src/core/config.js');
    const fixturePath = path.resolve('tests/fixtures/test-config-anthropic.ts');
    const config = await loadConfig(fixturePath, NONEXISTENT_PATH);
    expect(config.ai.provider).toBe('anthropic');
    expect(config.ai.textModel).toBe(DEFAULT_TEXT_MODEL.anthropic);
  });

  it('deep-merges storage.local without touching cloudinary', async () => {
    const { loadConfig } = await import('../../src/core/config.js');
    const fixturePath = path.resolve('tests/fixtures/test-config-local-storage.ts');
    const config = await loadConfig(fixturePath, NONEXISTENT_PATH);
    expect(config.storage.provider).toBe('local');
    expect(config.storage.local?.outputDir).toBe('./custom/output');
    expect(config.storage.local?.publicPathPrefix).toBe('/custom');
    expect(config.storage.cloudinary).toBeUndefined();
  });

  it('deep-merges storage.cloudinary without touching local', async () => {
    const { loadConfig, DEFAULT_CONFIG } = await import('../../src/core/config.js');
    const fixturePath = path.resolve('tests/fixtures/test-config-storage.ts');
    const config = await loadConfig(fixturePath, NONEXISTENT_PATH);
    expect(config.storage.cloudinary?.folder).toBe('my-covers');
    expect(config.storage.local?.outputDir).toBe(DEFAULT_CONFIG.storage.local?.outputDir);
    expect(config.storage.local?.publicPathPrefix).toBe(
      DEFAULT_CONFIG.storage.local?.publicPathPrefix,
    );
  });

  it('deep-merges markdown and image config', async () => {
    const { loadConfig, DEFAULT_CONFIG } = await import('../../src/core/config.js');
    const fixturePath = path.resolve('tests/fixtures/test-config-image-markdown.ts');
    const config = await loadConfig(fixturePath, NONEXISTENT_PATH);
    expect(config.markdown.coverField).toBe('heroImage');
    expect(config.markdown.preserveFrontmatterOrder).toBe(
      DEFAULT_CONFIG.markdown.preserveFrontmatterOrder,
    );
    expect(config.image.size).toBe('1024x1024');
    expect(config.image.style).toBe('watercolor illustration');
  });

  it('loads .ts project config directly when it exists', async () => {
    const { loadConfig } = await import('../../src/core/config.js');
    const tsFixture = path.resolve('tests/fixtures/test-config.ts');
    const config = await loadConfig(tsFixture, NONEXISTENT_PATH);
    expect(config.ai.textModel).toBe('gpt-4o-mini');
  });

  it('loads global .js config directly', async () => {
    const { loadConfig, DEFAULT_CONFIG } = await import('../../src/core/config.js');
    const globalJsPath = path.resolve('tests/fixtures/test-config-js-only.js');
    const config = await loadConfig(NONEXISTENT_PATH, globalJsPath);
    expect(config.ai.textModel).toBe('gpt-4o-mini');
    expect(config.writing.defaultMode).toBe('light');
    expect(config.image.size).toBe(DEFAULT_CONFIG.image.size);
  });

  it('re-throws non-file-not-found errors from config loading', async () => {
    const { loadConfig } = await import('../../src/core/config.js');
    const brokenPath = path.resolve('tests/fixtures/test-config-broken.js');
    await expect(loadConfig(brokenPath, NONEXISTENT_PATH)).rejects.toThrow('config file is broken');
  });
});

describe('resolveConfigWithSources', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('marks all values as default when no config files exist', async () => {
    const { resolveConfigWithSources } = await import('../../src/core/config.js');
    const resolved = await resolveConfigWithSources(NONEXISTENT_PATH, NONEXISTENT_PATH);
    expect(resolved.sources['ai.provider'].source).toBe('default');
    expect(resolved.sources['ai.textModel'].source).toBe('default');
    expect(resolved.sources['writing.defaultMode'].source).toBe('default');
    expect(resolved.paths.global.loaded).toBe(false);
    expect(resolved.paths.project.loaded).toBe(false);
  });

  it('marks overridden values as project source', async () => {
    const { resolveConfigWithSources } = await import('../../src/core/config.js');
    const projectFixture = path.resolve('tests/fixtures/test-config.ts');
    const resolved = await resolveConfigWithSources(projectFixture, NONEXISTENT_PATH);
    expect(resolved.sources['ai.textModel'].source).toBe('project');
    expect(resolved.sources['ai.textModel'].value).toBe('gpt-4o-mini');
    expect(resolved.sources['writing.defaultMode'].source).toBe('project');
    expect(resolved.sources['ai.provider'].source).toBe('default');
    expect(resolved.paths.project.loaded).toBe(true);
  });

  it('marks overridden values as global source', async () => {
    const { resolveConfigWithSources } = await import('../../src/core/config.js');
    const globalFixture = path.resolve('tests/fixtures/test-config-global.ts');
    const resolved = await resolveConfigWithSources(NONEXISTENT_PATH, globalFixture);
    expect(resolved.sources['ai.textModel'].source).toBe('global');
    expect(resolved.sources['ai.textModel'].value).toBe('gpt-3.5-turbo');
    expect(resolved.sources['writing.defaultMode'].source).toBe('global');
    expect(resolved.sources['image.size'].source).toBe('default');
  });

  it('project source wins over global for the same key', async () => {
    const { resolveConfigWithSources } = await import('../../src/core/config.js');
    const globalFixture = path.resolve('tests/fixtures/test-config-global.ts');
    const projectFixture = path.resolve('tests/fixtures/test-config.ts');
    const resolved = await resolveConfigWithSources(projectFixture, globalFixture);
    expect(resolved.sources['ai.textModel'].source).toBe('project');
    expect(resolved.sources['ai.textModel'].value).toBe('gpt-4o-mini');
  });

  it('includes all resolved flat keys', async () => {
    const { resolveConfigWithSources } = await import('../../src/core/config.js');
    const resolved = await resolveConfigWithSources(NONEXISTENT_PATH, NONEXISTENT_PATH);
    expect(resolved.sources).toHaveProperty('ai.provider');
    expect(resolved.sources).toHaveProperty('ai.textModel');
    expect(resolved.sources).toHaveProperty('markdown.coverField');
    expect(resolved.sources).toHaveProperty('writing.defaultMode');
    expect(resolved.sources).toHaveProperty('image.size');
    expect(resolved.sources).toHaveProperty('storage.provider');
    expect(resolved.sources).toHaveProperty('storage.local.outputDir');
  });

  it('reports the .js path when only .js config exists (no .ts sibling)', async () => {
    const { resolveConfigWithSources } = await import('../../src/core/config.js');
    const jsOnlyFixtureTsPath = path.resolve('tests/fixtures/test-config-js-only.ts');
    const resolved = await resolveConfigWithSources(jsOnlyFixtureTsPath, NONEXISTENT_PATH);
    expect(resolved.paths.project.loaded).toBe(true);
    expect(resolved.paths.project.path).toBe(jsOnlyFixtureTsPath.replace(/\.ts$/, '.js'));
  });

  it('reports the .ts path when .ts config exists', async () => {
    const { resolveConfigWithSources } = await import('../../src/core/config.js');
    const projectFixture = path.resolve('tests/fixtures/test-config.ts');
    const resolved = await resolveConfigWithSources(projectFixture, NONEXISTENT_PATH);
    expect(resolved.paths.project.loaded).toBe(true);
    expect(resolved.paths.project.path).toBe(projectFixture);
  });
});
