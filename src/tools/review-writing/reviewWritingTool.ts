import type { TextAIProvider } from '../../core/providers.js';
import type { BlogDraft, WritingMode, WritingSuggestion } from '../../core/types.js';
import { aiWritingResponseSchema } from '../../core/schemas.js';
import { buildWritingReviewPrompt } from './prompts.js';

export async function reviewWritingTool(
  input: { draft: BlogDraft; mode: WritingMode },
  aiProvider: TextAIProvider,
): Promise<{ suggestions: WritingSuggestion[] }> {
  const result = await aiProvider.generateStructuredOutput<{
    suggestions: WritingSuggestion[];
  }>({
    systemPrompt: buildWritingReviewPrompt(input.mode),
    userPrompt: `Review the following blog post body for writing quality:\n\n${input.draft.markdownBody}`,
    schemaName: 'writing_suggestions',
  });

  const parsed = aiWritingResponseSchema.parse(result);
  return { suggestions: parsed.suggestions };
}
