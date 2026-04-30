import type { TextAIProvider } from '../core/providers.js';
import type { WritingMode, WritingSuggestion } from '../core/types.js';
import { parseMarkdownTool } from '../tools/parse-markdown/index.js';
import { reviewWritingTool } from '../tools/review-writing/index.js';

export type ReviewDraftResult = {
  suggestions: WritingSuggestion[];
};

export async function reviewDraftWorkflow(
  filePath: string,
  mode: WritingMode,
  aiProvider: TextAIProvider,
): Promise<ReviewDraftResult> {
  const draft = await parseMarkdownTool({ filePath });
  const { suggestions } = await reviewWritingTool({ draft, mode }, aiProvider);
  return { suggestions };
}
