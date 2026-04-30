import type { TextAIProvider } from '../../core/providers.js';
import { PoliraError } from '../../core/errors.js';

export function createOpenAITextProvider(apiKey: string, model: string): TextAIProvider {
  if (!apiKey) {
    throw new PoliraError(
      'OPENAI_API_KEY is not set. Please add it to your .env file.',
      'AI_PROVIDER_ERROR',
    );
  }

  return {
    async generateStructuredOutput<TOutput>(input: {
      systemPrompt: string;
      userPrompt: string;
      schemaName: string;
    }): Promise<TOutput> {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey });

      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: input.systemPrompt },
          { role: 'user', content: input.userPrompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new PoliraError('Empty response from AI provider.', 'AI_PROVIDER_ERROR');
      }

      return JSON.parse(content) as TOutput;
    },
  };
}
