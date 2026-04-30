import type { BlogDraft, DraftChange, DraftPatch } from '../../core/types.js';
import { stringifyFrontmatter } from '../../utils/frontmatter.js';
import { writeFile } from '../../utils/fileSystem.js';
import { generateDiffTool } from '../generate-diff/generateDiffTool.js';

export async function updateFrontmatterTool(input: {
  draft: BlogDraft;
  updates: Record<string, unknown>;
  apply: boolean;
}): Promise<DraftPatch> {
  const { draft, updates, apply } = input;

  const updatedFrontmatter = { ...draft.frontmatter };
  const changes: DraftChange[] = [];

  for (const [field, value] of Object.entries(updates)) {
    const original = draft.frontmatter[field];
    if (original !== value) {
      updatedFrontmatter[field] = value;
      changes.push({
        type: 'frontmatter',
        field,
        original,
        updated: value,
        reason: `Updated ${field}`,
      });
    }
  }

  const updatedContent = stringifyFrontmatter(updatedFrontmatter, draft.markdownBody);
  const { diff } = generateDiffTool({
    original: draft.rawContent,
    updated: updatedContent,
  });

  if (apply && changes.length > 0) {
    await writeFile(draft.filePath, updatedContent);
  }

  return {
    filePath: draft.filePath,
    originalContent: draft.rawContent,
    updatedContent,
    diff,
    changes,
  };
}
