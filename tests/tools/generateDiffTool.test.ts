import { describe, it, expect } from 'vitest';
import { generateDiffTool } from '../../src/tools/generate-diff/index.js';

describe('generateDiffTool', () => {
  it('generates a diff for changed content', () => {
    const original = 'Hello world\nThis is a test\n';
    const updated = 'Hello world\nThis is an updated test\n';

    const { diff } = generateDiffTool({ original, updated });

    expect(diff).toContain('-This is a test');
    expect(diff).toContain('+This is an updated test');
  });

  it('generates no change hunks for identical content', () => {
    const content = 'Hello world\n';

    const { diff } = generateDiffTool({ original: content, updated: content });

    expect(diff).not.toContain('@@');
  });

  it('handles multiline changes', () => {
    const original = 'line 1\nline 2\nline 3\n';
    const updated = 'line 1\nmodified line 2\nline 3\nnew line 4\n';

    const { diff } = generateDiffTool({ original, updated });

    expect(diff).toContain('-line 2');
    expect(diff).toContain('+modified line 2');
    expect(diff).toContain('+new line 4');
  });

  it('uses provided filename', () => {
    const { diff } = generateDiffTool({
      original: 'a\n',
      updated: 'b\n',
      filename: 'test.md',
    });

    expect(diff).toContain('test.md');
  });
});
