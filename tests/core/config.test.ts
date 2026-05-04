import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import { getGlobalConfigPath, getProjectConfigPath } from '../../src/core/config.js';

const NONEXISTENT_PATH = '/nonexistent/path/config.ts';

describe('getGlobalConfigPath', () => {
  it('returns path under ~/.config/polira/', () => {
    const result = getGlobalConfigPath();
    expect(result).toBe(path.join(os.homedir(), '.config', 'polira', 'config.js'));
  });
});

describe('getProjectConfigPath', () => {
  it('returns polira.config.ts resolved from cwd', () => {
    const result = getProjectConfigPath();
    expect(result).toBe(path.resolve('polira.config.ts'));
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

  it('deep-merges storage.local without touching cloudinary', async () => {
    const { loadConfig, DEFAULT_CONFIG } = await import('../../src/core/config.js');
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
