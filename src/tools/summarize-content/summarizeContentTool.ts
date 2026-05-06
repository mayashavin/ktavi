import type { TextAIProvider } from '../../core/providers.js';
import type { BlogDraft, ContentSummary } from '../../core/types.js';
import { contentSummarySchema } from '../../core/schemas.js';
import { buildSummaryPrompt } from './prompts.js';

const MAX_BODY_CHARS = 3000;

export async function summarizeContentTool(
  input: { draft: BlogDraft },
  aiProvider: TextAIProvider,
): Promise<ContentSummary> {
  const { draft } = input;

  const titleLine = draft.frontmatter.title ? `Title: ${draft.frontmatter.title}\n\n` : '';
  const body = draft.markdownBody.slice(0, MAX_BODY_CHARS);

  const result = await aiProvider.generateStructuredOutput<ContentSummary>({
    systemPrompt: buildSummaryPrompt(),
    userPrompt: `Summarize the following blog post:\n\n${titleLine}${body}`,
    schemaName: 'content_summary',
  });

  return contentSummarySchema.parse(result);
}
