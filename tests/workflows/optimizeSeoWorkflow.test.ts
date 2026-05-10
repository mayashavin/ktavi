import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { optimizeSeoWorkflow } from '../../src/workflows/optimizeSeoWorkflow.js';
import { createMockTextAIProvider } from '../shared/createMockTextAIProvider.js';

const MISSING_META_FIXTURE = path.resolve('tests/fixtures/missing-meta.md');

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

describe('optimizeSeoWorkflow — dry-run (no apply)', () => {
  it('does not modify the file on disk when apply is false', async () => {
    const tmpDir = path.join('/tmp', 'ktavi-dry-run-test');
    await fs.mkdir(tmpDir, { recursive: true });
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
    const result = await optimizeSeoWorkflow(MISSING_META_FIXTURE, {
      apply: false,
      aiProvider: createMockTextAIProvider(AI_RESPONSE_WITH_CRITICAL),
    });

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.patch).toBeUndefined();
  });
});

describe('optimizeSeoWorkflow — apply mode', () => {
  it('writes updated frontmatter to disk when apply is true', async () => {
    const tmpDir = path.join('/tmp', 'ktavi-apply-test');
    await fs.mkdir(tmpDir, { recursive: true });
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
    const tmpDir = path.join('/tmp', 'ktavi-apply-patch-test');
    await fs.mkdir(tmpDir, { recursive: true });
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
