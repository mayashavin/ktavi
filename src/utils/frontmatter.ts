import matter from 'gray-matter';
import type { BlogFrontmatter } from '../core/types.js';
import { KtaviError } from '../core/errors.js';

export type ParsedFrontmatter = {
  frontmatter: BlogFrontmatter;
  body: string;
  rawContent: string;
};

export function parseFrontmatter(rawContent: string): ParsedFrontmatter {
  try {
    const parsed = matter(rawContent);
    return {
      frontmatter: parsed.data as BlogFrontmatter,
      body: parsed.content,
      rawContent,
    };
  } catch (err) {
    throw new KtaviError(
      'Could not parse frontmatter. Please check that the YAML block starts and ends with ---.',
      'INVALID_FRONTMATTER',
      err,
    );
  }
}

export function stringifyFrontmatter(frontmatter: BlogFrontmatter, body: string): string {
  return matter.stringify(body, frontmatter);
}
