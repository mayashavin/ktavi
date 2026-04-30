import type { TextAIProvider } from '../../core/providers.js';
import type { BlogDraft, SeoSuggestion } from '../../core/types.js';
import { runDeterministicSeoChecks } from './deterministicSeoChecks.js';
import { runAiSeoReview } from './aiSeoReview.js';

export async function reviewSeoTool(
  input: { draft: BlogDraft },
  aiProvider?: TextAIProvider,
): Promise<{ suggestions: SeoSuggestion[] }> {
  const deterministicSuggestions = runDeterministicSeoChecks(input.draft);

  let aiSuggestions: SeoSuggestion[] = [];
  if (aiProvider) {
    aiSuggestions = await runAiSeoReview(input.draft, aiProvider);
  }

  return {
    suggestions: [...deterministicSuggestions, ...aiSuggestions],
  };
}
