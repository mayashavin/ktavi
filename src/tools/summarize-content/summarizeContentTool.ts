import type { TextAIProvider } from '../../core/providers.js';
import type { BlogDraft, ContentSummary } from '../../core/types.js';
import { contentSummarySchema } from '../../core/schemas.js';
import { buildSummaryPrompt } from './prompts.js';

export async function summarizeContentTool(
  input: { draft: BlogDraft },
  aiProvider: TextAIProvider,
): Promise<ContentSummary> {
  const { draft } = input;

  const titleLine = draft.frontmatter.title ? `Title: ${draft.frontmatter.title}\n\n` : '';

  const result = await aiProvider.generateStructuredOutput<ContentSummary>({
    systemPrompt: buildSummaryPrompt(),
    userPrompt: `Summarize the following blog post:\n\n${titleLine}${draft.markdownBody}`,
    schemaName: 'content_summary',
  });

  return contentSummarySchema.parse(result);
}
