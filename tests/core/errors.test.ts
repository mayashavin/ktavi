import { describe, it, expect } from 'vitest';
import { KtaviError, friendlyErrorMessage, type KtaviErrorCode } from '../../src/core/errors.js';

describe('KtaviError', () => {
  it('sets name, message, and code', () => {
    const err = new KtaviError('something went wrong', 'FILE_NOT_FOUND');
    expect(err.name).toBe('KtaviError');
    expect(err.message).toBe('something went wrong');
    expect(err.code).toBe('FILE_NOT_FOUND');
  });

  it('is an instance of Error', () => {
    const err = new KtaviError('oops', 'WRITE_FAILED');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('friendlyErrorMessage', () => {
  const cases: [KtaviErrorCode, string][] = [
    ['FILE_NOT_FOUND', 'not found'],
    ['INVALID_MARKDOWN', 'valid Markdown'],
    ['INVALID_FRONTMATTER', 'YAML frontmatter'],
    ['AI_PROVIDER_ERROR', 'AI provider'],
    ['IMAGE_GENERATION_FAILED', 'Image generation'],
    ['CLOUDINARY_UPLOAD_FAILED', 'Cloudinary'],
    ['CONFIG_NOT_FOUND', 'ktavi config init'],
    ['CONFIG_INVALID', 'ktavi config init'],
    ['PATCH_FAILED', 'apply changes'],
    ['WRITE_FAILED', 'write changes'],
  ];

  for (const [code, expectedFragment] of cases) {
    it(`returns a friendly message for ${code}`, () => {
      const msg = friendlyErrorMessage(code);
      expect(msg).toContain(expectedFragment);
    });
  }

  it('returns a non-empty string for every defined code', () => {
    const codes: KtaviErrorCode[] = [
      'FILE_NOT_FOUND',
      'INVALID_MARKDOWN',
      'INVALID_FRONTMATTER',
      'AI_PROVIDER_ERROR',
      'IMAGE_GENERATION_FAILED',
      'CLOUDINARY_UPLOAD_FAILED',
      'CONFIG_NOT_FOUND',
      'CONFIG_INVALID',
      'PATCH_FAILED',
      'WRITE_FAILED',
    ];
    for (const code of codes) {
      expect(friendlyErrorMessage(code).length).toBeGreaterThan(0);
    }
  });
});
