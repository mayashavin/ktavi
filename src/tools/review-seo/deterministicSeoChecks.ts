import type { BlogDraft, SeoSuggestion } from '../../core/types.js';
import { isValidSlug } from '../../utils/slug.js';

export function runDeterministicSeoChecks(draft: BlogDraft): SeoSuggestion[] {
  const suggestions: SeoSuggestion[] = [];
  const { frontmatter, metadata } = draft;

  if (!frontmatter.title) {
    suggestions.push({
      field: 'title',
      severity: 'critical',
      reason: 'Missing title. Every blog post needs a title for SEO and discoverability.',
      source: 'deterministic',
    });
  } else if (frontmatter.title.length < 10) {
    suggestions.push({
      field: 'title',
      severity: 'warning',
      current: frontmatter.title,
      reason: 'Title is very short. Consider making it more descriptive for better SEO.',
      source: 'deterministic',
    });
  } else if (frontmatter.title.length > 70) {
    suggestions.push({
      field: 'title',
      severity: 'info',
      current: frontmatter.title,
      reason: 'Title exceeds 70 characters and may be truncated in search results.',
      source: 'deterministic',
    });
  }

  if (!frontmatter.description) {
    suggestions.push({
      field: 'description',
      severity: 'critical',
      reason: 'Missing description. A meta description improves search result click-through rates.',
      source: 'deterministic',
    });
  } else if (frontmatter.description.length < 50) {
    suggestions.push({
      field: 'description',
      severity: 'warning',
      current: frontmatter.description,
      reason: 'Description is very short. Aim for 50–160 characters for optimal SEO.',
      source: 'deterministic',
    });
  } else if (frontmatter.description.length > 160) {
    suggestions.push({
      field: 'description',
      severity: 'info',
      current: frontmatter.description,
      reason: 'Description exceeds 160 characters and may be truncated in search results.',
      source: 'deterministic',
    });
  }

  if (!metadata.slug) {
    suggestions.push({
      field: 'slug',
      severity: 'warning',
      reason: 'Missing slug. A clean URL slug improves SEO and shareability.',
      source: 'deterministic',
    });
  } else if (!isValidSlug(metadata.slug)) {
    suggestions.push({
      field: 'slug',
      severity: 'warning',
      current: metadata.slug,
      reason: 'Slug contains invalid characters. Use lowercase letters, numbers, and hyphens only.',
      source: 'deterministic',
    });
  }

  if (metadata.tags.length === 0) {
    suggestions.push({
      field: 'tags',
      severity: 'warning',
      reason: 'Missing tags. Tags help with categorization and discoverability.',
      source: 'deterministic',
    });
  }

  if (!metadata.coverImage) {
    suggestions.push({
      field: 'cover',
      severity: 'warning',
      reason:
        'Missing cover image. A cover image improves visual appeal on social media and blog listings.',
      source: 'deterministic',
    });
  }

  const h1s = metadata.headings.filter((h) => h.depth === 1);
  if (h1s.length === 0) {
    suggestions.push({
      field: 'headings',
      severity: 'info',
      reason: 'No H1 heading found in the body. Consider adding a main heading.',
      source: 'deterministic',
    });
  }

  const h2s = metadata.headings.filter((h) => h.depth === 2);
  if (h2s.length === 0 && metadata.wordCount > 300) {
    suggestions.push({
      field: 'headings',
      severity: 'info',
      reason:
        'No H2 headings found. Longer articles benefit from section headings for readability and SEO.',
      source: 'deterministic',
    });
  }

  const imagesWithoutAlt = metadata.images.filter((img) => !img.alt || img.alt.trim().length === 0);
  if (imagesWithoutAlt.length > 0) {
    suggestions.push({
      field: 'images',
      severity: 'warning',
      current: imagesWithoutAlt.map((img) => img.url),
      reason: `${imagesWithoutAlt.length} image(s) missing alt text. Alt text improves accessibility and SEO.`,
      source: 'deterministic',
    });
  }

  return suggestions;
}
