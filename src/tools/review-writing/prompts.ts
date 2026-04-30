import type { WritingMode } from '../../core/types.js';

const MODE_INSTRUCTIONS: Record<WritingMode, string> = {
  light: 'Focus only on grammar, spelling, and punctuation errors. Do not suggest stylistic changes.',
  medium:
    'Focus on grammar, spelling, clarity, and sentence flow. Suggest improvements to awkward phrasing but avoid rewriting entire paragraphs.',
  strong:
    'Suggest grammar fixes, clarity improvements, and larger readability rewrites where beneficial. Still preserve the writer\'s voice.',
};

export function buildWritingReviewPrompt(mode: WritingMode): string {
  return `You are an expert writing reviewer for technical blog posts.

Rules:
- Preserve the writer's tone and voice
- Avoid rewriting entire paragraphs unless necessary
- Focus on: ${MODE_INSTRUCTIONS[mode]}
- Return precise suggestions with original text, suggested replacement, reason, and category
- Avoid generic feedback
- Do NOT change code blocks
- Do NOT change quoted text unless clearly wrong
- Each suggestion must include a confidence score from 0 to 1`;
}
