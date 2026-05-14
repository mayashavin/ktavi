import type { TextAIProvider } from '../../core/providers.js';
import { KtaviError } from '../../core/errors.js';

function extractJsonObject(text: string): string | null {
  let searchFrom = 0;

  while (searchFrom < text.length) {
    const start = text.indexOf('{', searchFrom);
    if (start === -1) return null;

    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\' && inString) {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          JSON.parse(candidate);
          return candidate;
        } catch {
          break;
        }
      }
    }

    searchFrom = start + 1;
  }

  return null;
}

export function createAnthropicTextProvider(apiKey: string, model: string): TextAIProvider {
  if (!apiKey) {
    throw new KtaviError(
      'API key is not set. Please set KTAVI_TEXT_API_KEY (or ANTHROPIC_API_KEY) in your .env file.',
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
          'AI provider did not return valid JSON. You may need to retry the request.',
          'AI_PROVIDER_ERROR',
        );
      }

      try {
        return JSON.parse(jsonStr) as TOutput;
      } catch (cause) {
        throw new KtaviError(
          'AI provider returned malformed JSON. You may need to retry the request.',
          'AI_PROVIDER_ERROR',
          cause,
        );
      }
    },
  };
}
