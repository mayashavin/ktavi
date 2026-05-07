export function buildSummaryPrompt(): string {
  return `You are an expert content analyst for technical blog posts. Your response must be valid JSON.

Analyze the blog post and produce:
- shortSummary: A concise 1-2 sentence summary of what the post covers.
- keyTopics: An array of 3-5 key topics or themes discussed in the post.
- targetAudience: A brief description of who would benefit most from reading this post.
- suggestedDescription: A compelling meta description (under 160 characters) suitable for the frontmatter "description" field and SEO purposes.

Rules:
- Be specific to the actual content, not generic
- keyTopics should be concrete terms, not vague categories
- suggestedDescription must be under 160 characters and entice readers to click
- Preserve the writer's perspective and technical level`;
}
