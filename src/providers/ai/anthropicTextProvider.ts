import type { TextAIProvider } from '../../core/providers.js';
import { KtaviError } from '../../core/errors.js';

export function createAnthropicTextProvider(apiKey: string, model: string): TextAIProvider {
  if (!apiKey) {
    throw new KtaviError(
      'ANTHROPIC_API_KEY is not set. Please add it to your .env file.',
      'AI_PROVIDER_ERROR',
    );
  }

  return {
    async generateStructuredOutput<TOutput>(input: {
      systemPrompt: string;
      userPrompt: string;
      schemaName: string;
    }): Promise<TOutput> {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system: input.systemPrompt,
        messages: [{ role: 'user', content: input.userPrompt }],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new KtaviError('Empty response from AI provider.', 'AI_PROVIDER_ERROR');
      }

      const content = textBlock.text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new KtaviError(
          'AI provider did not return valid JSON. Response may need retry.',
          'AI_PROVIDER_ERROR',
        );
      }

      return JSON.parse(jsonMatch[0]) as TOutput;
    },
  };
}
