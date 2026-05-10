import { describe, expect, it, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { optimizeSeoWorkflow } from '../../src/workflows/optimizeSeoWorkflow.js';
import { createMockTextAIProvider } from '../shared/createMockTextAIProvider.js';
import type { TextAIProvider } from '../../src/core/providers.js';
import type { SeoSuggestion } from '../../src/core/types.js';

const MISSING_META_FIXTURE = path.resolve('tests/fixtures/missing-meta.md');

const AI_SUGGESTIONS: SeoSuggestion[] = [
  {
    field: 'description',
    severity: 'critical',
    suggested: 'Learn how TanStack Query simplifies data fetching and caching in Vue apps.',
    reason: 'A specific meta description improves relevance for search queries.',
    source: 'ai',
  },
  {
    field: 'tags',
    severity: 'info',
    suggested: ['vue', 'tanstack-query', 'data-fetching'],
    reason: 'Relevant tags improve categorization and discoverability.',
    source: 'ai',
  },
];

function makeProvider(
  calls: Array<{ systemPrompt: string; userPrompt: string; schemaName: string }>,
): TextAIProvider {
  return {
    async generateStructuredOutput(input) {
      calls.push(input);
      return { suggestions: AI_SUGGESTIONS };
    },
  };
}

// AI response with a critical suggestion that includes a `suggested` value so
// that optimizeSeoWorkflow would write to disk when apply=true.
const AI_RESPONSE_WITH_CRITICAL = {
  suggestions: [
    {
      field: 'description',
      severity: 'critical',
      suggested: 'A comprehensive guide to TanStack Query in Vue.',
      reason: 'Missing description lowers click-through rate.',
      source: 'ai',
    },
  ],
};

describe('optimizeSeoWorkflow', () => {
  it('merges deterministic SEO checks with mocked AI suggestions', async () => {
    const calls: Array<{ systemPrompt: string; userPrompt: string; schemaName: string }> = [];

    const result = await optimizeSeoWorkflow(MISSING_META_FIXTURE, {
      aiProvider: makeProvider(calls),
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].schemaName).toBe('seo_suggestions');
    expect(calls[0].userPrompt).toContain('Title: TanStack Query in Vue');
    expect(calls[0].userPrompt).toContain('TanStack Query can make data fetching');
    expect(calls[0].userPrompt).toContain('## Why it matters');

    expect(result.patch).toBeUndefined();
    expect(result.suggestions).toEqual([
      expect.objectContaining({
        field: 'description',
        severity: 'critical',
        source: 'deterministic',
      }),
      expect.objectContaining({
        field: 'tags',
        severity: 'warning',
        source: 'deterministic',
      }),
      expect.objectContaining({
        field: 'cover',
        severity: 'warning',
        source: 'deterministic',
      }),
      ...AI_SUGGESTIONS,
    ]);
  });
});

describe('optimizeSeoWorkflow — dry-run (no apply)', () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('does not modify the file on disk when apply is false', async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ktavi-dry-run-'));
    const tmpFile = path.join(tmpDir, 'missing-meta.md');
    await fs.copyFile(MISSING_META_FIXTURE, tmpFile);

    const originalContent = await fs.readFile(tmpFile, 'utf-8');

    await optimizeSeoWorkflow(tmpFile, {
      apply: false,
      aiProvider: createMockTextAIProvider(AI_RESPONSE_WITH_CRITICAL),
    });

    const contentAfter = await fs.readFile(tmpFile, 'utf-8');
    expect(contentAfter).toBe(originalContent);
  });

  it('returns suggestions but no patch when apply is false', async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ktavi-dry-run-'));
    const tmpFile = path.join(tmpDir, 'missing-meta.md');
    await fs.copyFile(MISSING_META_FIXTURE, tmpFile);

    const result = await optimizeSeoWorkflow(tmpFile, {
      apply: false,
      aiProvider: createMockTextAIProvider(AI_RESPONSE_WITH_CRITICAL),
    });

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.patch).toBeUndefined();
  });
});

describe('optimizeSeoWorkflow — apply mode', () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('writes updated frontmatter to disk when apply is true', async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ktavi-apply-'));
    const tmpFile = path.join(tmpDir, 'missing-meta.md');
    await fs.copyFile(MISSING_META_FIXTURE, tmpFile);

    const originalContent = await fs.readFile(tmpFile, 'utf-8');

    await optimizeSeoWorkflow(tmpFile, {
      apply: true,
      aiProvider: createMockTextAIProvider(AI_RESPONSE_WITH_CRITICAL),
    });

    const contentAfter = await fs.readFile(tmpFile, 'utf-8');
    expect(contentAfter).not.toBe(originalContent);
    expect(contentAfter).toContain('A comprehensive guide to TanStack Query in Vue.');
  });

  it('returns a patch with changes when apply is true and critical suggestions exist', async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ktavi-apply-'));
    const tmpFile = path.join(tmpDir, 'missing-meta.md');
    await fs.copyFile(MISSING_META_FIXTURE, tmpFile);

    const result = await optimizeSeoWorkflow(tmpFile, {
      apply: true,
      aiProvider: createMockTextAIProvider(AI_RESPONSE_WITH_CRITICAL),
    });

    expect(result.patch).toBeDefined();
    expect(result.patch!.changes.length).toBeGreaterThan(0);
    expect(result.patch!.changes.some((c) => c.field === 'description')).toBe(true);
  });
});
