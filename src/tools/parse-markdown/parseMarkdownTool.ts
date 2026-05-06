import type { BlogDraft } from '../../core/types.js';
import { readFile } from '../../utils/fileSystem.js';
import { parseFrontmatter } from '../../utils/frontmatter.js';
import { parseMarkdownAST } from '../../utils/markdown.js';
import { extractMetadata } from './extractMetadata.js';

export async function parseMarkdownTool(input: { filePath: string }): Promise<BlogDraft> {
  const rawContent = await readFile(input.filePath);
  const { frontmatter, body } = parseFrontmatter(rawContent);
  const tree = parseMarkdownAST(body);
  const metadata = extractMetadata(frontmatter, body, tree, input.filePath);

  return {
    filePath: input.filePath,
    rawContent,
    frontmatter,
    markdownBody: body,
    metadata,
  };
}
