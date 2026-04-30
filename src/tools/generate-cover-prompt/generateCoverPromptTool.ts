import type { TextAIProvider } from '../../core/providers.js';
import type { BlogDraft, CoverPromptResult } from '../../core/types.js';
import { coverPromptResultSchema } from '../../core/schemas.js';
import { buildCoverPromptSystemPrompt } from './prompts.js';

export async function generateCoverPromptTool(
  input: { draft: BlogDraft; style?: string },
  aiProvider: TextAIProvider,
): Promise<CoverPromptResult> {
  const { draft, style } = input;
  const contentSummary = draft.markdownBody.slice(0, 1500);

  const result = await aiProvider.generateStructuredOutput<CoverPromptResult>({
    systemPrompt: buildCoverPromptSystemPrompt(style),
    userPrompt: `Generate a cover image concept for this blog post:

Title: ${draft.frontmatter.title ?? '(untitled)'}
Description: ${draft.frontmatter.description ?? '(none)'}
Tags: ${draft.metadata.tags.join(', ') || '(none)'}
Slug: ${draft.frontmatter.slug ?? '(none)'}

Content summary:
${contentSummary}`,
    schemaName: 'cover_prompt',
  });

  return coverPromptResultSchema.parse(result);
}
