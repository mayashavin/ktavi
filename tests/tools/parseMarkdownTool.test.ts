import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { parseMarkdownTool } from '../../src/tools/parse-markdown/index.js';

const fixture = (name: string) => path.join(import.meta.dirname, '..', 'fixtures', name);

describe('parseMarkdownTool', () => {
  it('parses a valid post with full frontmatter', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('valid-post.md') });

    expect(draft.frontmatter.title).toBe('Using TanStack Query in Vue');
    expect(draft.frontmatter.description).toContain('data fetching');
    expect(draft.frontmatter.slug).toBe('tanstack-query-vue');
    expect(draft.frontmatter.tags).toEqual(['vue', 'tanstack-query', 'frontend']);
    expect(draft.frontmatter.cover).toBe('/images/blog/tanstack-query-vue-cover.png');
  });

  it('extracts metadata correctly', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('valid-post.md') });

    expect(draft.metadata.title).toBe('Using TanStack Query in Vue');
    expect(draft.metadata.tags).toEqual(['vue', 'tanstack-query', 'frontend']);
    expect(draft.metadata.coverImage).toBe('/images/blog/tanstack-query-vue-cover.png');
    expect(draft.metadata.wordCount).toBeGreaterThan(50);
    expect(draft.metadata.estimatedReadingTimeMinutes).toBeGreaterThanOrEqual(1);
  });

  it('extracts headings', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('valid-post.md') });

    expect(draft.metadata.headings.length).toBeGreaterThan(0);
    expect(draft.metadata.headings[0]).toEqual({ depth: 1, text: 'Using TanStack Query in Vue' });
    expect(draft.metadata.headings.some((h) => h.depth === 2)).toBe(true);
  });

  it('extracts links', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('valid-post.md') });

    expect(draft.metadata.links.length).toBeGreaterThan(0);
    expect(draft.metadata.links.some((l) => l.url === 'https://tanstack.com/query')).toBe(true);
  });

  it('extracts images', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('valid-post.md') });

    expect(draft.metadata.images.length).toBe(1);
    expect(draft.metadata.images[0].url).toBe('./images/query-diagram.png');
    expect(draft.metadata.images[0].alt).toBe('TanStack Query diagram');
  });

  it('handles missing metadata fields', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('missing-meta.md') });

    expect(draft.frontmatter.title).toBe('TanStack Query in Vue');
    expect(draft.frontmatter.description).toBeUndefined();
    expect(draft.frontmatter.slug).toBeUndefined();
    expect(draft.frontmatter.tags).toBeUndefined();
    expect(draft.metadata.coverImage).toBeUndefined();
  });

  it('extracts images with and without alt text', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('post-with-images.md') });

    expect(draft.metadata.images.length).toBe(7);
    const noAlt = draft.metadata.images.filter((img) => !img.alt || img.alt.trim() === '');
    expect(noAlt.length).toBe(2);
  });

  it('extracts HTML img elements with correct attributes', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('post-with-images.md') });

    const htmlImg = draft.metadata.images.find((img) => img.url === './images/grid-html.png');
    expect(htmlImg).toBeDefined();
    expect(htmlImg?.alt).toBe('HTML grid example');
    expect(htmlImg?.title).toBe('HTML title');

    const htmlImgNoAlt = draft.metadata.images.find(
      (img) => img.url === './images/grid-html-no-alt.png',
    );
    expect(htmlImgNoAlt).toBeDefined();
    expect(htmlImgNoAlt?.alt).toBeUndefined();

    const htmlImgSelfClosing = draft.metadata.images.find(
      (img) => img.url === './images/grid-html-self-closing.png',
    );
    expect(htmlImgSelfClosing).toBeDefined();
    expect(htmlImgSelfClosing?.alt).toBe('Self-closing HTML image');
  });

  it('handles posts with no headings in body', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('post-with-no-headings.md') });

    expect(draft.metadata.headings.length).toBe(0);
  });

  it('throws on non-existent file', async () => {
    await expect(parseMarkdownTool({ filePath: '/nonexistent/file.md' })).rejects.toThrow(
      'Could not read file',
    );
  });
});
