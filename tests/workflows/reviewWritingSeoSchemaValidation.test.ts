import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { reviewDraftWorkflow } from '../../src/workflows/reviewDraftWorkflow.js';
import { optimizeSeoWorkflow } from '../../src/workflows/optimizeSeoWorkflow.js';
import { generateAndAttachCoverWorkflow } from '../../src/workflows/generateAndAttachCoverWorkflow.js';
import { createMockTextAIProvider } from '../shared/createMockTextAIProvider.js';

const VALID_POST = path.resolve('tests/fixtures/valid-post.md');
const COVER_WORKFLOW_OPTIONS = {
  generate: false,
  apply: false,
  size: '1792x1024' as const,
  coverField: 'cover' as const,
  interactive: false,
};

describe('review, seo, and cover workflows schema validation', () => {
  it('accepts a valid writing review provider response', async () => {
    const aiResponse = {
      suggestions: [
        {
          original: 'This are bad grammar.',
          suggested: 'This is bad grammar.',
          reason: 'Fix subject-verb agreement.',
          category: 'grammar',
          confidence: 0.9,
        },
      ],
    };

    const result = await reviewDraftWorkflow(
      VALID_POST,
      'medium',
      createMockTextAIProvider(aiResponse),
    );
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].confidence).toBe(0.9);
  });

  it('throws when writing review provider returns invalid schema', async () => {
    const aiResponse = {
      suggestions: [
        {
          original: 'This are bad grammar.',
          suggested: 'This is bad grammar.',
          reason: 'Fix subject-verb agreement.',
          category: 'grammar',
          confidence: 2,
        },
      ],
    };

    await expect(
      reviewDraftWorkflow(VALID_POST, 'medium', createMockTextAIProvider(aiResponse)),
    ).rejects.toThrow();
  });

  it('accepts a valid seo provider response', async () => {
    const aiResponse = {
      suggestions: [
        {
          field: 'title',
          severity: 'warning',
          current: 'old title',
          suggested: 'Better title',
          reason: 'Improve relevance.',
          source: 'ai',
        },
      ],
    };

    const result = await optimizeSeoWorkflow(VALID_POST, {
      aiProvider: createMockTextAIProvider(aiResponse),
    });
    expect(result.suggestions.some((suggestion) => suggestion.source === 'ai')).toBe(true);
  });

  it('throws when seo provider returns invalid schema', async () => {
    const aiResponse = {
      suggestions: [
        {
          field: 'title',
          severity: 'invalid-severity',
          reason: 'Missing an informative title.',
          source: 'ai',
        },
      ],
    };

    await expect(
      optimizeSeoWorkflow(VALID_POST, { aiProvider: createMockTextAIProvider(aiResponse) }),
    ).rejects.toThrow();
  });

  it('accepts a valid cover prompt provider response', async () => {
    const aiResponse = {
      visualConcept: 'A mountain sunrise over a winding trail',
      prompt: 'Editorial illustration of a mountain sunrise over a winding trail',
      altText: 'Mountain sunrise over a winding trail',
      suggestedFilename: 'mountain-sunrise-trail',
    };

    const result = await generateAndAttachCoverWorkflow(VALID_POST, {
      ...COVER_WORKFLOW_OPTIONS,
      aiProvider: createMockTextAIProvider(aiResponse),
    });

    expect(result.coverPrompt.suggestedFilename).toBe('mountain-sunrise-trail');
  });

  it('throws when cover prompt provider returns invalid schema', async () => {
    const aiResponse = {
      visualConcept: 'A mountain sunrise over a winding trail',
      prompt: 'Editorial illustration of a mountain sunrise over a winding trail',
      altText: 'Mountain sunrise over a winding trail',
      suggestedFilename: 123,
    };

    await expect(
      generateAndAttachCoverWorkflow(VALID_POST, {
        ...COVER_WORKFLOW_OPTIONS,
        aiProvider: createMockTextAIProvider(aiResponse),
      }),
    ).rejects.toThrow();
  });
});
