import type { TextAIProvider } from '../../core/providers.js';
import { KtaviError } from '../../core/errors.js';

function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    if (depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

export function createAnthropicTextProvider(apiKey: string, model: string): TextAIProvider {
  if (!apiKey) {
    throw new KtaviError(
      'API key is not set. Please set KTAVI_TEXT_API_KEY in your .env file.',
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

      const codeBlockMatch = content.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
      const jsonStr = codeBlockMatch?.[1]?.trim() ?? extractJsonObject(content);

      if (!jsonStr) {
        throw new KtaviError(
          'AI provider did not return valid JSON. Response may need retry.',
          'AI_PROVIDER_ERROR',
        );
      }

      try {
        return JSON.parse(jsonStr) as TOutput;
      } catch (cause) {
        throw new KtaviError(
          'AI provider returned malformed JSON. Response may need retry.',
          'AI_PROVIDER_ERROR',
          cause,
        );
      }
    },
  };
}
