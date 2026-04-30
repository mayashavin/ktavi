import type { TextAIProvider } from '../../core/providers.js';
import type { BlogDraft, SeoSuggestion } from '../../core/types.js';
import { aiSeoResponseSchema } from '../../core/schemas.js';

export async function runAiSeoReview(
  draft: BlogDraft,
  aiProvider: TextAIProvider,
): Promise<SeoSuggestion[]> {
  const result = await aiProvider.generateStructuredOutput<{ suggestions: SeoSuggestion[] }>({
    systemPrompt: `You are an SEO expert reviewing a blog post draft. Analyze the metadata and content and suggest improvements.

Rules:
- Review the draft as a blog post
- Suggest better metadata where applicable
- Explain why each suggestion improves discoverability or clarity
- Avoid clickbait suggestions
- Keep title and description aligned with actual content
- Return structured suggestions`,
    userPrompt: `Review this blog draft for SEO:

Title: ${draft.frontmatter.title ?? '(none)'}
Description: ${draft.frontmatter.description ?? '(none)'}
Slug: ${draft.frontmatter.slug ?? '(none)'}
Tags: ${draft.metadata.tags.join(', ') || '(none)'}
Word count: ${draft.metadata.wordCount}
Headings: ${draft.metadata.headings.map((h) => `${'#'.repeat(h.depth)} ${h.text}`).join('\n')}

Content:
${draft.markdownBody.slice(0, 2000)}`,
    schemaName: 'seo_suggestions',
  });

  const parsed = aiSeoResponseSchema.parse(result);
  return parsed.suggestions.map((s) => ({ ...s, source: 'ai' as const }));
}
