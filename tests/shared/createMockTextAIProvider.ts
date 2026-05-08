import type { TextAIProvider } from '../../src/core/providers.js';

export function createMockTextAIProvider(response: unknown): TextAIProvider {
  return {
    generateStructuredOutput: async () => response,
  };
}
