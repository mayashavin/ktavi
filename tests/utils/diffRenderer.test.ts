import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  renderColoredDiff,
  renderInlineSuggestion,
  renderFrontmatterDiff,
  renderSideBySideDiff,
  isColorSupported,
} from '../../src/utils/diffRenderer.js';
import type { DraftChange } from '../../src/core/types.js';

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

describe('isColorSupported', () => {
  const originalEnv = process.env;
  const originalIsTTY = process.stdout.isTTY;

  afterEach(() => {
    process.env = originalEnv;
    Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true });
  });

  it('returns false when NO_COLOR is set', () => {
    process.env = { ...originalEnv, NO_COLOR: '1' };
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    expect(isColorSupported()).toBe(false);
  });

  it('returns false when stdout is not a TTY', () => {
    process.env = { ...originalEnv };
    delete process.env.NO_COLOR;
    Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
    expect(isColorSupported()).toBe(false);
  });

  it('returns true when TTY and NO_COLOR not set', () => {
    process.env = { ...originalEnv };
    delete process.env.NO_COLOR;
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    expect(isColorSupported()).toBe(true);
  });
});

describe('renderColoredDiff', () => {
  beforeEach(() => {
    process.env = { ...process.env };
    delete process.env.NO_COLOR;
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
  });

  it('applies red and green colors to removed and added lines', () => {
    const diff = ['--- a/file', '+++ b/file', '@@ -1,2 +1,2 @@', '-old line', '+new line'].join(
      '\n',
    );

    const result = renderColoredDiff(diff);
    expect(result).toContain('\x1b[31m');
    expect(result).toContain('\x1b[32m');
    expect(result).toContain('\x1b[36m');
  });

  it('applies word-level background highlighting on adjacent changed lines', () => {
    const diff = ['@@ -1 +1 @@', '-Their are problems', '+There are problems'].join('\n');

    const result = renderColoredDiff(diff);
    expect(result).toContain('\x1b[41m');
    expect(result).toContain('\x1b[42m');
  });

  it('produces plain text when color is not supported', () => {
    process.env.NO_COLOR = '1';
    const diff = ['@@ -1 +1 @@', '-old', '+new'].join('\n');

    const result = renderColoredDiff(diff);
    expect(result).not.toContain('\x1b[');
    expect(stripAnsi(result)).toContain('-old');
    expect(stripAnsi(result)).toContain('+new');
  });

  it('handles unpaired removed lines', () => {
    const diff = ['@@ -1,2 +1 @@', '-first line', '-second line', '+combined line'].join('\n');

    const result = stripAnsi(renderColoredDiff(diff));
    expect(result).toContain('-first line');
    expect(result).toContain('-second line');
    expect(result).toContain('+combined line');
  });

  it('preserves context lines unchanged', () => {
    const diff = ['@@ -1,3 +1,3 @@', ' context', '-old', '+new', ' more context'].join('\n');

    const result = stripAnsi(renderColoredDiff(diff));
    expect(result).toContain(' context');
    expect(result).toContain(' more context');
  });
});

describe('renderInlineSuggestion', () => {
  beforeEach(() => {
    process.env = { ...process.env };
    delete process.env.NO_COLOR;
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
  });

  it('highlights changed words with background colors', () => {
    const result = renderInlineSuggestion('Their are problems', 'There are problems');
    expect(result).toContain('\x1b[41m');
    expect(result).toContain('\x1b[42m');
    expect(result).toContain('    -');
    expect(result).toContain('    +');
  });

  it('shows brackets in plain mode when color not supported', () => {
    process.env.NO_COLOR = '1';
    const result = renderInlineSuggestion('Their are', 'There are');
    expect(result).not.toContain('\x1b[');
    const stripped = stripAnsi(result);
    expect(stripped).toContain('[Their]');
    expect(stripped).toContain('[There]');
  });

  it('produces two lines (original and suggested)', () => {
    const result = renderInlineSuggestion('old text', 'new text');
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(stripAnsi(lines[0])).toContain('    -');
    expect(stripAnsi(lines[1])).toContain('    +');
  });
});

describe('renderFrontmatterDiff', () => {
  beforeEach(() => {
    process.env = { ...process.env };
    delete process.env.NO_COLOR;
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
  });

  it('renders field changes with background-highlighted old and new values', () => {
    const changes: DraftChange[] = [
      {
        type: 'frontmatter',
        field: 'description',
        original: 'old desc',
        updated: 'new desc',
      },
    ];

    const result = renderFrontmatterDiff(changes);
    expect(result).toContain('description:');
    expect(result).toContain('\x1b[41m');
    expect(result).toContain('\x1b[42m');
    expect(result).toContain('→');
  });

  it('shows (none) for missing values', () => {
    const changes: DraftChange[] = [
      {
        type: 'frontmatter',
        field: 'cover',
        original: undefined,
        updated: '/images/cover.png',
      },
    ];

    const result = stripAnsi(renderFrontmatterDiff(changes));
    expect(result).toContain('(none)');
    expect(result).toContain('/images/cover.png');
  });

  it('skips non-frontmatter changes', () => {
    const changes: DraftChange[] = [{ type: 'body', original: 'old', updated: 'new' }];

    const result = renderFrontmatterDiff(changes);
    expect(result).toBe('');
  });

  it('renders plain text when color not supported', () => {
    process.env.NO_COLOR = '1';
    const changes: DraftChange[] = [
      {
        type: 'frontmatter',
        field: 'title',
        original: 'Old Title',
        updated: 'New Title',
      },
    ];

    const result = renderFrontmatterDiff(changes);
    expect(result).not.toContain('\x1b[');
    expect(result).toContain('title: Old Title → New Title');
  });
});

describe('renderSideBySideDiff', () => {
  beforeEach(() => {
    process.env = { ...process.env };
    delete process.env.NO_COLOR;
    Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
  });

  it('renders removed and added lines side by side', () => {
    const diff = ['@@ -1 +1 @@', '-old text', '+new text'].join('\n');

    const result = stripAnsi(renderSideBySideDiff(diff, 80));
    expect(result).toContain('old text');
    expect(result).toContain('new text');
  });

  it('renders context lines on both sides', () => {
    const diff = ['@@ -1,3 +1,3 @@', ' context line', '-removed', '+added'].join('\n');

    const result = stripAnsi(renderSideBySideDiff(diff, 80));
    const contextLines = result.split('\n').filter((l) => l.includes('context line'));
    expect(contextLines.length).toBeGreaterThan(0);
  });

  it('skips header lines', () => {
    const diff = ['--- a/file', '+++ b/file', '@@ -1 +1 @@', '-old', '+new'].join('\n');

    const result = stripAnsi(renderSideBySideDiff(diff, 80));
    expect(result).not.toContain('--- a/file');
    expect(result).not.toContain('+++ b/file');
  });

  it('uses separator between columns', () => {
    const diff = ['@@ -1 +1 @@', '-left', '+right'].join('\n');

    const result = stripAnsi(renderSideBySideDiff(diff, 80));
    expect(result).toContain('│');
  });

  it('renders plain text when color not supported', () => {
    process.env.NO_COLOR = '1';
    const diff = ['@@ -1 +1 @@', '-old', '+new'].join('\n');

    const result = renderSideBySideDiff(diff, 60);
    expect(result).not.toContain('\x1b[');
  });
});
