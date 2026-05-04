import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
}));

import { input, select, confirm } from '@inquirer/prompts';
import { runConfigInit } from '../../src/cli/commands/configInit.js';

const mockedSelect = vi.mocked(select);
const mockedInput = vi.mocked(input);
const mockedConfirm = vi.mocked(confirm);

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'polira-config-init-'));
  vi.resetAllMocks();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function setupPromptMocks(
  overrides: {
    format?: string;
    provider?: string;
    textModel?: string;
    imageModel?: string;
    writingMode?: string;
    imageSize?: string;
    imageStyle?: string;
    coverField?: string;
    storageProvider?: string;
    outputDir?: string;
    publicPathPrefix?: string;
    cloudinaryFolder?: string;
    confirmWrite?: boolean;
  } = {},
) {
  const calls = {
    select: [
      overrides.format ?? '.ts',
      overrides.provider ?? 'openai',
      overrides.writingMode ?? 'medium',
      overrides.imageSize ?? '1792x1024',
      overrides.coverField ?? 'cover',
      overrides.storageProvider ?? 'local',
    ],
    input: [
      overrides.textModel ?? 'gpt-4o',
      overrides.imageModel ?? 'gpt-image-2',
      overrides.imageStyle ?? '',
      overrides.outputDir ?? './temp/images/blog',
      overrides.publicPathPrefix ?? '/images/blog',
    ],
  };

  let selectIdx = 0;
  let inputIdx = 0;

  mockedSelect.mockImplementation(async () => calls.select[selectIdx++] as never);
  mockedInput.mockImplementation(async () => calls.input[inputIdx++]);
  mockedConfirm.mockImplementation(async () => overrides.confirmWrite ?? true);
}

function setupCloudinaryPromptMocks(
  overrides: {
    format?: string;
    cloudinaryFolder?: string;
    confirmWrite?: boolean;
  } = {},
) {
  const selectCalls = [
    overrides.format ?? '.ts',
    'openai',
    'medium',
    '1792x1024',
    'cover',
    'cloudinary',
  ];

  const inputCalls = ['gpt-4o', 'gpt-image-2', '', overrides.cloudinaryFolder ?? 'blog-covers'];

  let selectIdx = 0;
  let inputIdx = 0;

  mockedSelect.mockImplementation(async () => selectCalls[selectIdx++] as never);
  mockedInput.mockImplementation(async () => inputCalls[inputIdx++]);
  mockedConfirm.mockImplementation(async () => overrides.confirmWrite ?? true);
}

describe('polira config init', () => {
  it('writes a .ts config file with --defaults --force', async () => {
    const configPath = path.join(tmpDir, 'polira.config.ts');
    await fs.writeFile(path.join(tmpDir, 'tsconfig.json'), '{}');

    const originalResolve = path.resolve;
    vi.spyOn(path, 'resolve').mockImplementation((...args: string[]) => {
      if (args.length === 1 && args[0] === 'polira.config.ts') return configPath;
      if (args.length === 1 && args[0] === 'tsconfig.json')
        return originalResolve(tmpDir, 'tsconfig.json');
      return originalResolve(...args);
    });

    await runConfigInit({ defaults: true, force: true });

    const content = await fs.readFile(configPath, 'utf-8');
    expect(content).toContain('export default {');
    expect(content).toContain('provider: "openai"');
    expect(content).toContain('textModel: "gpt-4o"');
    expect(content).toContain('defaultMode: "medium"');
    expect(content).toContain('size: "1792x1024"');
    expect(content).toContain('provider: "local"');

    expect(mockedSelect).not.toHaveBeenCalled();
    expect(mockedInput).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('writes all prompted fields including defaults and overrides', async () => {
    const configPath = path.join(tmpDir, 'polira.config.ts');

    const originalResolve = path.resolve;
    vi.spyOn(path, 'resolve').mockImplementation((...args: string[]) => {
      if (args.length === 1 && args[0] === 'polira.config.ts') return configPath;
      if (args.length === 1 && args[0].startsWith('polira.config.'))
        return path.join(tmpDir, args[0]);
      if (args.length === 1 && args[0] === 'tsconfig.json')
        return originalResolve(tmpDir, 'tsconfig.json');
      return originalResolve(...args);
    });

    setupPromptMocks({
      writingMode: 'strong',
      imageStyle: 'watercolor illustration',
    });

    await runConfigInit({});

    const content = await fs.readFile(configPath, 'utf-8');
    expect(content).toContain('defaultMode: "strong"');
    expect(content).toContain('style: "watercolor illustration"');
    expect(content).toContain('ai:');
    expect(content).toContain('provider: "openai"');
    expect(content).toContain('textModel: "gpt-4o"');
    expect(content).toContain('markdown:');
    expect(content).toContain('coverField: "cover"');
    expect(content).toContain('storage:');
    expect(content).toContain('provider: "local"');

    vi.restoreAllMocks();
  });

  it('writes cloudinary config when cloudinary storage is selected', async () => {
    const configPath = path.join(tmpDir, 'polira.config.ts');

    const originalResolve = path.resolve;
    vi.spyOn(path, 'resolve').mockImplementation((...args: string[]) => {
      if (args.length === 1 && args[0] === 'polira.config.ts') return configPath;
      if (args.length === 1 && args[0].startsWith('polira.config.'))
        return path.join(tmpDir, args[0]);
      if (args.length === 1 && args[0] === 'tsconfig.json')
        return originalResolve(tmpDir, 'tsconfig.json');
      return originalResolve(...args);
    });

    setupCloudinaryPromptMocks({ cloudinaryFolder: 'my-covers' });

    await runConfigInit({});

    const content = await fs.readFile(configPath, 'utf-8');
    expect(content).toContain('provider: "cloudinary"');
    expect(content).toContain('folder: "my-covers"');

    vi.restoreAllMocks();
  });

  it('aborts when user declines overwrite of existing file', async () => {
    const configPath = path.join(tmpDir, 'polira.config.ts');
    await fs.writeFile(configPath, 'existing content');

    const originalResolve = path.resolve;
    vi.spyOn(path, 'resolve').mockImplementation((...args: string[]) => {
      if (args.length === 1 && args[0] === 'polira.config.ts') return configPath;
      if (args.length === 1 && args[0].startsWith('polira.config.'))
        return path.join(tmpDir, args[0]);
      if (args.length === 1 && args[0] === 'tsconfig.json')
        return originalResolve(tmpDir, 'tsconfig.json');
      return originalResolve(...args);
    });

    let selectIdx = 0;
    mockedSelect.mockImplementation(async () => ['.ts'][selectIdx++] as never);
    mockedConfirm.mockResolvedValue(false);

    await runConfigInit({});

    const content = await fs.readFile(configPath, 'utf-8');
    expect(content).toBe('existing content');

    vi.restoreAllMocks();
  });

  it('overwrites existing file with --force', async () => {
    const configPath = path.join(tmpDir, 'polira.config.ts');
    await fs.writeFile(configPath, 'old content');
    await fs.writeFile(path.join(tmpDir, 'tsconfig.json'), '{}');

    const originalResolve = path.resolve;
    vi.spyOn(path, 'resolve').mockImplementation((...args: string[]) => {
      if (args.length === 1 && args[0] === 'polira.config.ts') return configPath;
      if (args.length === 1 && args[0].startsWith('polira.config.'))
        return path.join(tmpDir, args[0]);
      if (args.length === 1 && args[0] === 'tsconfig.json')
        return originalResolve(tmpDir, 'tsconfig.json');
      return originalResolve(...args);
    });

    await runConfigInit({ defaults: true, force: true });

    const content = await fs.readFile(configPath, 'utf-8');
    expect(content).toContain('export default {');
    expect(content).not.toBe('old content');

    vi.restoreAllMocks();
  });

  it('prompts for overwrite when --defaults is used without --force on existing file', async () => {
    const configPath = path.join(tmpDir, 'polira.config.ts');
    await fs.writeFile(configPath, 'old content');
    await fs.writeFile(path.join(tmpDir, 'tsconfig.json'), '{}');

    const originalResolve = path.resolve;
    vi.spyOn(path, 'resolve').mockImplementation((...args: string[]) => {
      if (args.length === 1 && args[0] === 'polira.config.ts') return configPath;
      if (args.length === 1 && args[0].startsWith('polira.config.'))
        return path.join(tmpDir, args[0]);
      if (args.length === 1 && args[0] === 'tsconfig.json')
        return originalResolve(tmpDir, 'tsconfig.json');
      return originalResolve(...args);
    });

    mockedConfirm.mockResolvedValue(false);

    await runConfigInit({ defaults: true });

    expect(mockedConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('already exists') }),
    );
    const content = await fs.readFile(configPath, 'utf-8');
    expect(content).toBe('old content');

    vi.restoreAllMocks();
  });

  it('overwrites existing file when --defaults confirms overwrite', async () => {
    const configPath = path.join(tmpDir, 'polira.config.ts');
    await fs.writeFile(configPath, 'old content');
    await fs.writeFile(path.join(tmpDir, 'tsconfig.json'), '{}');

    const originalResolve = path.resolve;
    vi.spyOn(path, 'resolve').mockImplementation((...args: string[]) => {
      if (args.length === 1 && args[0] === 'polira.config.ts') return configPath;
      if (args.length === 1 && args[0].startsWith('polira.config.'))
        return path.join(tmpDir, args[0]);
      if (args.length === 1 && args[0] === 'tsconfig.json')
        return originalResolve(tmpDir, 'tsconfig.json');
      return originalResolve(...args);
    });

    mockedConfirm.mockResolvedValue(true);

    await runConfigInit({ defaults: true });

    const content = await fs.readFile(configPath, 'utf-8');
    expect(content).toContain('export default {');
    expect(content).not.toBe('old content');

    vi.restoreAllMocks();
  });

  it('writes .js extension when user selects JavaScript format', async () => {
    const configPathTs = path.join(tmpDir, 'polira.config.ts');
    const configPathJs = path.join(tmpDir, 'polira.config.js');

    const originalResolve = path.resolve;
    vi.spyOn(path, 'resolve').mockImplementation((...args: string[]) => {
      if (args.length === 1 && args[0] === 'polira.config.ts') return configPathTs;
      if (args.length === 1 && args[0] === 'polira.config.js') return configPathJs;
      if (args.length === 1 && args[0].startsWith('polira.config.'))
        return path.join(tmpDir, args[0]);
      if (args.length === 1 && args[0] === 'tsconfig.json')
        return originalResolve(tmpDir, 'tsconfig.json');
      return originalResolve(...args);
    });

    setupPromptMocks({ format: '.js' });

    await runConfigInit({});

    const content = await fs.readFile(configPathJs, 'utf-8');
    expect(content).toContain('export default {');

    vi.restoreAllMocks();
  });

  it('aborts when user declines write confirmation', async () => {
    const configPath = path.join(tmpDir, 'polira.config.ts');

    const originalResolve = path.resolve;
    vi.spyOn(path, 'resolve').mockImplementation((...args: string[]) => {
      if (args.length === 1 && args[0] === 'polira.config.ts') return configPath;
      if (args.length === 1 && args[0].startsWith('polira.config.'))
        return path.join(tmpDir, args[0]);
      if (args.length === 1 && args[0] === 'tsconfig.json')
        return originalResolve(tmpDir, 'tsconfig.json');
      return originalResolve(...args);
    });

    setupPromptMocks({ confirmWrite: false });

    await runConfigInit({});

    const exists = await fs
      .access(configPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);

    vi.restoreAllMocks();
  });

  it('escapes special characters in string values', async () => {
    const configPath = path.join(tmpDir, 'polira.config.ts');

    const originalResolve = path.resolve;
    vi.spyOn(path, 'resolve').mockImplementation((...args: string[]) => {
      if (args.length === 1 && args[0] === 'polira.config.ts') return configPath;
      if (args.length === 1 && args[0].startsWith('polira.config.'))
        return path.join(tmpDir, args[0]);
      if (args.length === 1 && args[0] === 'tsconfig.json')
        return originalResolve(tmpDir, 'tsconfig.json');
      return originalResolve(...args);
    });

    setupPromptMocks({ imageStyle: 'it\'s a "test" style\nwith newline' });

    await runConfigInit({});

    const content = await fs.readFile(configPath, 'utf-8');
    // JSON.stringify produces a safely escaped double-quoted string literal
    expect(content).toContain('style: "it\'s a \\"test\\" style\\nwith newline"');

    vi.restoreAllMocks();
  });
});
