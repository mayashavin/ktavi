import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import { getGlobalConfigPath, getProjectConfigPath } from '../../src/core/config.js';

describe('getGlobalConfigPath', () => {
  it('returns path under ~/.config/polira/', () => {
    const result = getGlobalConfigPath();
    expect(result).toBe(path.join(os.homedir(), '.config', 'polira', 'config.ts'));
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
    const config = await loadConfig('/nonexistent/path/config.ts');
    expect(config.ai.provider).toBe(DEFAULT_CONFIG.ai.provider);
    expect(config.ai.textModel).toBe(DEFAULT_CONFIG.ai.textModel);
    expect(config.writing.defaultMode).toBe(DEFAULT_CONFIG.writing.defaultMode);
  });

  it('loads and merges a project config file', async () => {
    const { loadConfig } = await import('../../src/core/config.js');
    const fixturePath = path.resolve('tests/fixtures/test-config.ts');
    const config = await loadConfig(fixturePath);
    expect(config.ai.textModel).toBe('gpt-4o-mini');
    expect(config.ai.provider).toBe('openai');
    expect(config.writing.defaultMode).toBe('strong');
  });

  it('preserves defaults for fields not overridden by project config', async () => {
    const { loadConfig, DEFAULT_CONFIG } = await import('../../src/core/config.js');
    const fixturePath = path.resolve('tests/fixtures/test-config.ts');
    const config = await loadConfig(fixturePath);
    expect(config.image.size).toBe(DEFAULT_CONFIG.image.size);
    expect(config.markdown.coverField).toBe(DEFAULT_CONFIG.markdown.coverField);
  });

  it('deep-merges nested storage config', async () => {
    const { loadConfig, DEFAULT_CONFIG } = await import('../../src/core/config.js');
    const fixturePath = path.resolve('tests/fixtures/test-config-storage.ts');
    const config = await loadConfig(fixturePath);
    expect(config.storage.provider).toBe('cloudinary');
    expect(config.storage.cloudinary?.folder).toBe('my-covers');
    expect(config.storage.local?.outputDir).toBe(DEFAULT_CONFIG.storage.local?.outputDir);
  });
});
