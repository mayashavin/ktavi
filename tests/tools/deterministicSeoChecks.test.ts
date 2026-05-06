import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { parseMarkdownTool } from '../../src/tools/parse-markdown/index.js';
import { runDeterministicSeoChecks } from '../../src/tools/review-seo/index.js';

const fixture = (name: string) => path.join(import.meta.dirname, '..', 'fixtures', name);

describe('deterministicSeoChecks', () => {
  it('returns no critical issues for a valid post', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('valid-post.md') });
    const suggestions = runDeterministicSeoChecks(draft);

    const critical = suggestions.filter((s) => s.severity === 'critical');
    expect(critical.length).toBe(0);
  });

  it('detects missing description, tags, and cover (slug falls back to filename)', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('missing-meta.md') });
    const suggestions = runDeterministicSeoChecks(draft);

    const fields = suggestions.map((s) => s.field);
    expect(fields).toContain('description');
    expect(fields).not.toContain('slug');
    expect(fields).toContain('tags');
    expect(fields).toContain('cover');
  });

  it('all suggestions are deterministic', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('missing-meta.md') });
    const suggestions = runDeterministicSeoChecks(draft);

    for (const s of suggestions) {
      expect(s.source).toBe('deterministic');
    }
  });

  it('detects images without alt text', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('post-with-images.md') });
    const suggestions = runDeterministicSeoChecks(draft);

    const imageSuggestions = suggestions.filter((s) => s.field === 'images');
    expect(imageSuggestions.length).toBe(1);
    expect(imageSuggestions[0].reason).toContain('missing alt text');
  });

  it('detects missing headings in longer posts', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('post-with-no-headings.md') });
    const suggestions = runDeterministicSeoChecks(draft);

    const headingSuggestions = suggestions.filter((s) => s.field === 'headings');
    expect(headingSuggestions.length).toBeGreaterThan(0);
  });

  it('does not flag existing cover image', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('existing-cover.md') });
    const suggestions = runDeterministicSeoChecks(draft);

    const coverSuggestions = suggestions.filter((s) => s.field === 'cover');
    expect(coverSuggestions.length).toBe(0);
  });

  it('does not flag cover when cover_image field is used', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('post-with-cover-image-field.md') });
    const suggestions = runDeterministicSeoChecks(draft);

    const coverSuggestions = suggestions.filter((s) => s.field === 'cover');
    expect(coverSuggestions.length).toBe(0);
  });

  it('does not flag cover when img field is used', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('post-with-img-field.md') });
    const suggestions = runDeterministicSeoChecks(draft);

    const coverSuggestions = suggestions.filter((s) => s.field === 'cover');
    expect(coverSuggestions.length).toBe(0);
  });

  it('does not flag tags when comma-separated string is used', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('post-with-string-tags.md') });
    const suggestions = runDeterministicSeoChecks(draft);

    const tagSuggestions = suggestions.filter((s) => s.field === 'tags');
    expect(tagSuggestions.length).toBe(0);
  });

  it('uses id field as slug and does not flag it as missing', async () => {
    const draft = await parseMarkdownTool({ filePath: fixture('post-with-id-field.md') });
    const suggestions = runDeterministicSeoChecks(draft);

    const slugSuggestions = suggestions.filter((s) => s.field === 'slug');
    expect(slugSuggestions.length).toBe(0);
  });
});
