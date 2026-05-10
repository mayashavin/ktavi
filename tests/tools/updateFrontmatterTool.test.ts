import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseMarkdownTool } from '../../src/tools/parse-markdown/index.js';
import { updateFrontmatterTool } from '../../src/tools/update-frontmatter/index.js';

const fixture = (name: string) => path.join(import.meta.dirname, '..', 'fixtures', name);

describe('updateFrontmatterTool', () => {
  it('generates a patch with updated fields', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('missing-meta.md') });

    const patch = await updateFrontmatterTool({
      draft,
      updates: {
        description: 'Learn how to use TanStack Query in Vue for data fetching.',
        slug: 'tanstack-query-in-vue',
      },
      apply: false,
    });

    expect(patch.changes.length).toBe(2);
    expect(patch.changes.some((c) => c.field === 'description')).toBe(true);
    expect(patch.changes.some((c) => c.field === 'slug')).toBe(true);
    expect(patch.updatedContent).toContain('description: Learn how to use TanStack Query');
    expect(patch.updatedContent).toContain('slug: tanstack-query-in-vue');
    expect(patch.diff).toContain('+');
  });

  it('does not modify file when apply is false', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('missing-meta.md') });

    const patch = await updateFrontmatterTool({
      draft,
      updates: { description: 'Test description' },
      apply: false,
    });

    expect(patch.changes.length).toBe(1);
    expect(patch.originalContent).toBe(draft.rawContent);
  });

  it('returns empty changes when no fields differ', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('missing-meta.md') });

    const patch = await updateFrontmatterTool({
      draft,
      updates: { title: 'TanStack Query in Vue' },
      apply: false,
    });

    expect(patch.changes.length).toBe(0);
  });

  it('preserves existing frontmatter fields', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('valid-post.md') });

    const patch = await updateFrontmatterTool({
      draft,
      updates: { description: 'Updated description.' },
      apply: false,
    });

    expect(patch.updatedContent).toContain('title: Using TanStack Query in Vue');
    expect(patch.updatedContent).toContain('slug: tanstack-query-vue');
    expect(patch.updatedContent).toContain('description: Updated description.');
  });
});

describe('updateFrontmatterTool — apply vs dry-run (disk I/O)', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ktavi-apply-test-'));
    tempFile = path.join(tempDir, 'test-post.md');
    await fs.copyFile(fixture('missing-meta.md'), tempFile);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('writes updated frontmatter to disk when apply is true', async () => {
    const draft = await parseMarkdownTool({ filePath: tempFile });
    const originalContent = await fs.readFile(tempFile, 'utf-8');

    await updateFrontmatterTool({
      draft,
      updates: {
        description: 'A new description for testing.',
        slug: 'tanstack-query-in-vue',
      },
      apply: true,
    });

    const updatedContent = await fs.readFile(tempFile, 'utf-8');
    expect(updatedContent).not.toBe(originalContent);
    expect(updatedContent).toContain('description: A new description for testing.');
    expect(updatedContent).toContain('slug: tanstack-query-in-vue');
  });

  it('does not write to disk when apply is false', async () => {
    const draft = await parseMarkdownTool({ filePath: tempFile });
    const originalContent = await fs.readFile(tempFile, 'utf-8');

    await updateFrontmatterTool({
      draft,
      updates: { description: 'This should not be written to disk.' },
      apply: false,
    });

    const afterContent = await fs.readFile(tempFile, 'utf-8');
    expect(afterContent).toBe(originalContent);
  });
});
