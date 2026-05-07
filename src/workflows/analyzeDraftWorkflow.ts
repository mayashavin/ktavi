import type { TextAIProvider } from '../core/providers.js';
import type { BlogDraft, ContentSummary } from '../core/types.js';
import { parseMarkdownTool } from '../tools/parse-markdown/index.js';
import { summarizeContentTool } from '../tools/summarize-content/index.js';

export type AnalyzeDraftResult = {
  draft: BlogDraft;
  contentSummary?: ContentSummary;
};

export async function analyzeDraftWorkflow(
  filePath: string,
  options?: { aiProvider?: TextAIProvider },
): Promise<AnalyzeDraftResult> {
  const draft = await parseMarkdownTool({ filePath });

  let contentSummary: ContentSummary | undefined;
  if (options?.aiProvider) {
    try {
      contentSummary = await summarizeContentTool({ draft }, options.aiProvider);
    } catch {
      // summarization is best-effort; continue without it
    }
  }

  return { draft, contentSummary };
}
