import type { BlogFrontmatter, CoverFieldName, DraftMetadata } from '../../core/types.js';
import type { Root } from 'mdast';
import { extractHeadings, extractImages, extractLinks } from '../../utils/markdown.js';
import { countWords, estimateReadingTime } from '../../utils/readingTime.js';

const COVER_FIELDS: CoverFieldName[] = ['cover', 'image', 'heroImage', 'ogImage', 'thumbnail'];

function resolveCoverImage(frontmatter: BlogFrontmatter): string | undefined {
  for (const field of COVER_FIELDS) {
    const value = frontmatter[field];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

export function extractMetadata(
  frontmatter: BlogFrontmatter,
  markdownBody: string,
  tree: Root,
): DraftMetadata {
  const wordCount = countWords(markdownBody);

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    slug: frontmatter.slug,
    tags: frontmatter.tags ?? [],
    coverImage: resolveCoverImage(frontmatter),
    headings: extractHeadings(tree),
    links: extractLinks(tree),
    images: extractImages(tree),
    wordCount,
    estimatedReadingTimeMinutes: estimateReadingTime(wordCount),
  };
}
