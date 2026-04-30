import type { BlogDraft } from '../core/types.js';
import { parseMarkdownTool } from '../tools/parse-markdown/index.js';

export type AnalyzeDraftResult = {
  draft: BlogDraft;
};

export async function analyzeDraftWorkflow(filePath: string): Promise<AnalyzeDraftResult> {
  const draft = await parseMarkdownTool({ filePath });
  return { draft };
}
