import path from 'node:path';
import type { BlogFrontmatter, CoverFieldName, DraftMetadata } from '../../core/types.js';
import type { Root } from 'mdast';
import { extractHeadings, extractImages, extractLinks } from '../../utils/markdown.js';
import { countWords, estimateReadingTime } from '../../utils/readingTime.js';

// Fields are checked in order — the first matching field wins.
// Precedence: cover > image > cover_image > heroImage > ogImage > thumbnail > img
const COVER_FIELDS: CoverFieldName[] = [
  'cover',
  'image',
  'cover_image',
  'heroImage',
  'ogImage',
  'thumbnail',
  'img',
];

function resolveCoverImage(frontmatter: BlogFrontmatter): string | undefined {
  for (const field of COVER_FIELDS) {
    const value = frontmatter[field];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

// Supports both a YAML array and a comma-separated string.
// Note: tag values must not themselves contain commas when using the string format.
function resolveTags(frontmatter: BlogFrontmatter): string[] {
  const tags = frontmatter.tags;
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string')
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  return [];
}

function resolveSlug(frontmatter: BlogFrontmatter, filePath: string): string | undefined {
  if (typeof frontmatter.slug === 'string' && frontmatter.slug.length > 0) {
    return frontmatter.slug;
  }
  if (typeof frontmatter.id === 'string' && frontmatter.id.length > 0) {
    return frontmatter.id;
  }
  const basename = path.basename(filePath, '.md');
  return basename.length > 0 ? basename : undefined;
}

export function extractMetadata(
  frontmatter: BlogFrontmatter,
  markdownBody: string,
  tree: Root,
  filePath: string,
): DraftMetadata {
  const wordCount = countWords(markdownBody);

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    slug: resolveSlug(frontmatter, filePath),
    tags: resolveTags(frontmatter),
    coverImage: resolveCoverImage(frontmatter),
    headings: extractHeadings(tree),
    links: extractLinks(tree),
    images: extractImages(tree),
    wordCount,
    estimatedReadingTimeMinutes: estimateReadingTime(wordCount),
  };
}
