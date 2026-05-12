import matter from 'gray-matter';
import type { BlogFrontmatter } from '../core/types.js';
import { KtaviError } from '../core/errors.js';

export type ParsedFrontmatter = {
  frontmatter: BlogFrontmatter;
  body: string;
  rawContent: string;
};

type MatterOptions = Parameters<typeof matter>[1] & { strict?: boolean };

export function parseFrontmatter(rawContent: string): ParsedFrontmatter {
  try {
    const parsed = matter(rawContent, { strict: true } as MatterOptions);
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

function extractTopLevelFrontmatterKeys(rawContent: string): string[] {
  const parsed = matter(rawContent);
  const rawFrontmatter = (parsed as { matter?: string }).matter;
  if (!rawFrontmatter) {
    return [];
  }

  const keys: string[] = [];
  const seen = new Set<string>();

  for (const line of rawFrontmatter.split('\n')) {
    if (/^\s/.test(line)) {
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const match = line.match(/^([^:#][^:]*?):(?:\s|$)/);
    if (!match) {
      continue;
    }

    const key = match[1].trim().replace(/^['"]|['"]$/g, '');
    if (key && !seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }

  return keys;
}

function orderFrontmatterByOriginalKeys(
  frontmatter: BlogFrontmatter,
  originalKeys: string[],
): BlogFrontmatter {
  const ordered = Object.create(null) as BlogFrontmatter;

  for (const key of originalKeys) {
    if (Object.prototype.hasOwnProperty.call(frontmatter, key)) {
      ordered[key] = frontmatter[key];
    }
  }

  for (const [key, value] of Object.entries(frontmatter)) {
    if (!Object.prototype.hasOwnProperty.call(ordered, key)) {
      ordered[key] = value;
    }
  }

  return ordered;
}

export function stringifyFrontmatter(
  frontmatter: BlogFrontmatter,
  body: string,
  options?: { preserveFrontmatterOrder?: boolean; originalRawContent?: string },
): string {
  if (!options?.preserveFrontmatterOrder || !options.originalRawContent) {
    return matter.stringify(body, frontmatter);
  }

  const originalKeys = extractTopLevelFrontmatterKeys(options.originalRawContent);
  if (originalKeys.length === 0) {
    return matter.stringify(body, frontmatter);
  }

  return matter.stringify(body, orderFrontmatterByOriginalKeys(frontmatter, originalKeys));
}
