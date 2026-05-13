import { describe, it, expect, vi } from 'vitest';
import { KtaviError } from '../../../src/core/errors.js';

vi.mock('@anthropic-ai/sdk', () => {
  const create = vi.fn();
  return {
    default: vi.fn(() => ({ messages: { create } })),
    __mockCreate: create,
  };
});

import { createAnthropicTextProvider } from '../../../src/providers/ai/anthropicTextProvider.js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { __mockCreate: mockCreate } = (await import('@anthropic-ai/sdk')) as any;

describe('createAnthropicTextProvider', () => {
  it('throws KtaviError when API key is empty', () => {
    expect(() => createAnthropicTextProvider('', 'claude-sonnet-4-20250514')).toThrow(KtaviError);
    expect(() => createAnthropicTextProvider('', 'claude-sonnet-4-20250514')).toThrow(
      'KTAVI_TEXT_API_KEY',
    );
  });

  it('returns parsed JSON from text response', async () => {
    const provider = createAnthropicTextProvider('test-key', 'claude-sonnet-4-20250514');
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"suggestions": []}' }],
    });

    const result = await provider.generateStructuredOutput<{ suggestions: unknown[] }>({
      systemPrompt: 'You are helpful.',
      userPrompt: 'Review this.',
      schemaName: 'test',
    });

    expect(result).toEqual({ suggestions: [] });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-20250514',
        system: 'You are helpful.',
        messages: [{ role: 'user', content: 'Review this.' }],
      }),
    );
  });

  it('extracts JSON from response with surrounding text', async () => {
    const provider = createAnthropicTextProvider('test-key', 'claude-sonnet-4-20250514');
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Here is the result:\n{"data": "value"}\nDone.' }],
    });

    const result = await provider.generateStructuredOutput<{ data: string }>({
      systemPrompt: 'system',
      userPrompt: 'user',
      schemaName: 'test',
    });

    expect(result).toEqual({ data: 'value' });
  });

  it('throws KtaviError when response has no text block', async () => {
    const provider = createAnthropicTextProvider('test-key', 'claude-sonnet-4-20250514');
    mockCreate.mockResolvedValueOnce({ content: [] });

    await expect(
      provider.generateStructuredOutput({
        systemPrompt: 'system',
        userPrompt: 'user',
        schemaName: 'test',
      }),
    ).rejects.toThrow('Empty response');
  });

  it('throws KtaviError when response contains no JSON', async () => {
    const provider = createAnthropicTextProvider('test-key', 'claude-sonnet-4-20250514');
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'No JSON here at all.' }],
    });

    await expect(
      provider.generateStructuredOutput({
        systemPrompt: 'system',
        userPrompt: 'user',
        schemaName: 'test',
      }),
    ).rejects.toThrow('did not return valid JSON');
  });

  it('extracts JSON from fenced code block', async () => {
    const provider = createAnthropicTextProvider('test-key', 'claude-sonnet-4-20250514');
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: 'Here is the result:\n```json\n{"key": "value"}\n```\nDone.',
        },
      ],
    });

    const result = await provider.generateStructuredOutput<{ key: string }>({
      systemPrompt: 'system',
      userPrompt: 'user',
      schemaName: 'test',
    });

    expect(result).toEqual({ key: 'value' });
  });

  it('extracts only first balanced JSON object, not greedy match', async () => {
    const provider = createAnthropicTextProvider('test-key', 'claude-sonnet-4-20250514');
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: 'Result: {"first": true} and also {"second": true}',
        },
      ],
    });

    const result = await provider.generateStructuredOutput<{ first: boolean }>({
      systemPrompt: 'system',
      userPrompt: 'user',
      schemaName: 'test',
    });

    expect(result).toEqual({ first: true });
  });

  it('skips non-JSON brace pairs in explanatory text', async () => {
    const provider = createAnthropicTextProvider('test-key', 'claude-sonnet-4-20250514');
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: 'Use {field} to configure. Here is the result: {"data": "value"}',
        },
      ],
    });

    const result = await provider.generateStructuredOutput<{ data: string }>({
      systemPrompt: 'system',
      userPrompt: 'user',
      schemaName: 'test',
    });

    expect(result).toEqual({ data: 'value' });
  });

  it('handles braces inside JSON string values correctly', async () => {
    const provider = createAnthropicTextProvider('test-key', 'claude-sonnet-4-20250514');
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: 'Result: {"text": "use {braces} and \\"quotes\\"", "valid": true}',
        },
      ],
    });

    const result = await provider.generateStructuredOutput<{ text: string; valid: boolean }>({
      systemPrompt: 'system',
      userPrompt: 'user',
      schemaName: 'test',
    });

    expect(result).toEqual({ text: 'use {braces} and "quotes"', valid: true });
  });

  it('throws KtaviError when no parseable JSON object exists', async () => {
    const provider = createAnthropicTextProvider('test-key', 'claude-sonnet-4-20250514');
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{invalid json}' }],
    });

    await expect(
      provider.generateStructuredOutput({
        systemPrompt: 'system',
        userPrompt: 'user',
        schemaName: 'test',
      }),
    ).rejects.toThrow('did not return valid JSON');
  });

  it('throws KtaviError with cause when code block JSON is malformed', async () => {
    const provider = createAnthropicTextProvider('test-key', 'claude-sonnet-4-20250514');
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: '```json\n{invalid json}\n```',
        },
      ],
    });

    await expect(
      provider.generateStructuredOutput({
        systemPrompt: 'system',
        userPrompt: 'user',
        schemaName: 'test',
      }),
    ).rejects.toThrow('malformed JSON');
  });
});
