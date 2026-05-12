import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { BlogDraft, BlogFrontmatter } from '../../src/core/types.js';
import { parseMarkdownTool } from '../../src/tools/parse-markdown/index.js';
import { updateFrontmatterTool } from '../../src/tools/update-frontmatter/index.js';

const fixture = (name: string) => path.join(import.meta.dirname, '..', 'fixtures', name);
const extractFrontmatterKeys = (content: string): string[] => {
  const block = content.match(/^---\n([\s\S]*?)\n---/)?.[1];
  if (!block) return [];

  const keys: string[] = [];
  for (const line of block.split('\n')) {
    if (/^\s/.test(line)) continue;
    if (!line.trim()) continue;
    const key = line.match(/^([^:#][^:]*?):(?:\s|$)/)?.[1]?.trim();
    if (key) keys.push(key);
  }
  return keys;
};

const createDraft = (frontmatter: BlogFrontmatter, rawContent: string): BlogDraft => ({
  filePath: '/tmp/test-post.md',
  rawContent,
  frontmatter,
  markdownBody: '\nBody\n',
  metadata: {
    tags: [],
    headings: [],
    links: [],
    images: [],
    wordCount: 1,
    estimatedReadingTimeMinutes: 1,
  },
});

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

  it('preserves original key order by default even when frontmatter object order differs', async () => {
    const rawContent = `---
title: My title
description: My description
slug: my-slug
---
Body`;
    const draft = createDraft(
      { slug: 'my-slug', title: 'My title', description: 'My description' },
      rawContent,
    );

    const patch = await updateFrontmatterTool({
      draft,
      updates: { canonical: 'https://example.com/my-slug' },
      apply: false,
    });

    expect(extractFrontmatterKeys(patch.updatedContent)).toEqual([
      'title',
      'description',
      'slug',
      'canonical',
    ]);
  });

  it('uses current object key order when preserveFrontmatterOrder is false', async () => {
    const rawContent = `---
title: My title
description: My description
slug: my-slug
---
Body`;
    const draft = createDraft(
      { slug: 'my-slug', title: 'My title', description: 'My description' },
      rawContent,
    );

    const patch = await updateFrontmatterTool({
      draft,
      updates: { canonical: 'https://example.com/my-slug' },
      apply: false,
      preserveFrontmatterOrder: false,
    });

    expect(extractFrontmatterKeys(patch.updatedContent)).toEqual([
      'slug',
      'title',
      'description',
      'canonical',
    ]);
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
    const updatedDraft = await parseMarkdownTool({ filePath: tempFile });
    expect(updatedContent).not.toBe(originalContent);
    expect(updatedDraft.frontmatter.description).toBe('A new description for testing.');
    expect(updatedDraft.frontmatter.slug).toBe('tanstack-query-in-vue');
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
