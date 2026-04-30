import type { TextAIProvider } from '../core/providers.js';
import type { DraftPatch, SeoSuggestion } from '../core/types.js';
import { parseMarkdownTool } from '../tools/parse-markdown/index.js';
import { reviewSeoTool } from '../tools/review-seo/index.js';
import { updateFrontmatterTool } from '../tools/update-frontmatter/index.js';

export type OptimizeSeoResult = {
  suggestions: SeoSuggestion[];
  patch?: DraftPatch;
};

export async function optimizeSeoWorkflow(
  filePath: string,
  options: { apply?: boolean; aiProvider?: TextAIProvider },
): Promise<OptimizeSeoResult> {
  const draft = await parseMarkdownTool({ filePath });
  const { suggestions } = await reviewSeoTool({ draft }, options.aiProvider);

  let patch: DraftPatch | undefined;
  if (options.apply) {
    const updates: Record<string, unknown> = {};

    for (const suggestion of suggestions) {
      if (suggestion.suggested && suggestion.severity === 'critical') {
        if (typeof suggestion.suggested === 'string') {
          updates[suggestion.field] = suggestion.suggested;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      patch = await updateFrontmatterTool({ draft, updates, apply: true });
    }
  }

  return { suggestions, patch };
}
