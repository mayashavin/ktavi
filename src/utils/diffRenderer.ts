import { diffWords } from 'diff';
import type { DraftChange } from '../core/types.js';

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

export function isColorSupported(): boolean {
  if (process.env.NO_COLOR !== undefined) return false;
  return process.stdout.isTTY === true;
}

function applyWordHighlights(removed: string, added: string, useColor: boolean): [string, string] {
  const changes = diffWords(removed, added);
  let removedLine = '';
  let addedLine = '';

  for (const part of changes) {
    if (part.added) {
      addedLine += useColor
        ? `${COLORS.bgGreen}${part.value}${COLORS.reset}${COLORS.green}`
        : part.value;
    } else if (part.removed) {
      removedLine += useColor
        ? `${COLORS.bgRed}${part.value}${COLORS.reset}${COLORS.red}`
        : part.value;
    } else {
      removedLine += part.value;
      addedLine += part.value;
    }
  }

  return [removedLine, addedLine];
}

export function renderColoredDiff(diffText: string): string {
  const useColor = isColorSupported();
  const lines = diffText.split('\n');
  const output: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('@@')) {
      output.push(useColor ? `${COLORS.cyan}${line}${COLORS.reset}` : line);
      i++;
      continue;
    }

    if (line.startsWith('---') || line.startsWith('+++')) {
      output.push(line);
      i++;
      continue;
    }

    if (line.startsWith('-')) {
      const removedLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('-') && !lines[i].startsWith('---')) {
        removedLines.push(lines[i].slice(1));
        i++;
      }
      const addedLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('+') && !lines[i].startsWith('+++')) {
        addedLines.push(lines[i].slice(1));
        i++;
      }

      const pairCount = Math.min(removedLines.length, addedLines.length);

      for (let j = 0; j < pairCount; j++) {
        const [highlightedRemoved, highlightedAdded] = applyWordHighlights(
          removedLines[j],
          addedLines[j],
          useColor,
        );
        output.push(
          useColor ? `${COLORS.red}-${highlightedRemoved}${COLORS.reset}` : `-${removedLines[j]}`,
        );
        output.push(
          useColor ? `${COLORS.green}+${highlightedAdded}${COLORS.reset}` : `+${addedLines[j]}`,
        );
      }

      for (let j = pairCount; j < removedLines.length; j++) {
        output.push(
          useColor ? `${COLORS.red}-${removedLines[j]}${COLORS.reset}` : `-${removedLines[j]}`,
        );
      }
      for (let j = pairCount; j < addedLines.length; j++) {
        output.push(
          useColor ? `${COLORS.green}+${addedLines[j]}${COLORS.reset}` : `+${addedLines[j]}`,
        );
      }

      continue;
    }

    if (line.startsWith('+')) {
      output.push(useColor ? `${COLORS.green}${line}${COLORS.reset}` : line);
      i++;
      continue;
    }

    output.push(line);
    i++;
  }

  return output.join('\n');
}

export function renderInlineSuggestion(original: string, suggested: string): string {
  const useColor = isColorSupported();
  const changes = diffWords(original, suggested);

  let originalLine = '';
  let suggestedLine = '';

  for (const part of changes) {
    if (part.added) {
      suggestedLine += useColor
        ? `${COLORS.bgGreen}${part.value}${COLORS.reset}${COLORS.dim}`
        : `[${part.value}]`;
    } else if (part.removed) {
      originalLine += useColor
        ? `${COLORS.bgRed}${part.value}${COLORS.reset}${COLORS.dim}`
        : `[${part.value}]`;
    } else {
      originalLine += part.value;
      suggestedLine += part.value;
    }
  }

  const prefix = useColor ? COLORS.dim : '';
  const suffix = useColor ? COLORS.reset : '';

  return [
    `${prefix}    - ${originalLine}${suffix}`,
    `${prefix}    + ${suggestedLine}${suffix}`,
  ].join('\n');
}

export function renderFrontmatterDiff(changes: DraftChange[]): string {
  const useColor = isColorSupported();
  const lines: string[] = [];

  for (const change of changes) {
    if (change.type !== 'frontmatter' || !change.field) continue;

    const oldVal = change.original != null ? String(change.original) : '(none)';
    const newVal = change.updated != null ? String(change.updated) : '(none)';

    if (useColor) {
      lines.push(
        `  ${COLORS.cyan}${change.field}:${COLORS.reset} ${COLORS.bgRed}${oldVal}${COLORS.reset} → ${COLORS.bgGreen}${newVal}${COLORS.reset}`,
      );
    } else {
      lines.push(`  ${change.field}: ${oldVal} → ${newVal}`);
    }
  }

  return lines.join('\n');
}

export function renderSideBySideDiff(diffText: string, terminalWidth?: number): string {
  const width = terminalWidth ?? process.stdout.columns ?? 80;
  const colWidth = Math.floor((width - 3) / 2);
  const useColor = isColorSupported();
  const lines = diffText.split('\n');
  const output: string[] = [];

  const separator = useColor ? `${COLORS.dim} │ ${COLORS.reset}` : ' | ';

  function pad(text: string, len: number): string {
    if (text.length >= len) return text.slice(0, len);
    return text + ' '.repeat(len - text.length);
  }

  function stripAnsi(str: string): string {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
  }

  function padAnsi(text: string, len: number): string {
    const visible = stripAnsi(text).length;
    if (visible >= len) return text;
    return text + ' '.repeat(len - visible);
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (
      line.startsWith('---') ||
      line.startsWith('+++') ||
      line.startsWith('Index:') ||
      line.startsWith('===')
    ) {
      i++;
      continue;
    }

    if (line.startsWith('@@')) {
      const hunkLine = useColor ? `${COLORS.cyan}${line}${COLORS.reset}` : line;
      output.push(hunkLine);
      i++;
      continue;
    }

    if (line.startsWith('-') && !line.startsWith('---')) {
      const removedLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('-') && !lines[i].startsWith('---')) {
        removedLines.push(lines[i].slice(1));
        i++;
      }
      const addedLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('+') && !lines[i].startsWith('+++')) {
        addedLines.push(lines[i].slice(1));
        i++;
      }

      const maxLen = Math.max(removedLines.length, addedLines.length);
      for (let j = 0; j < maxLen; j++) {
        const removed = removedLines[j] ?? '';
        const added = addedLines[j] ?? '';

        if (useColor && removed && added) {
          const [hlRemoved, hlAdded] = applyWordHighlights(removed, added, true);
          output.push(
            `${padAnsi(`${COLORS.red}${hlRemoved}${COLORS.reset}`, colWidth)}${separator}${padAnsi(`${COLORS.green}${hlAdded}${COLORS.reset}`, colWidth)}`,
          );
        } else if (useColor) {
          const left = removed ? `${COLORS.red}${removed}${COLORS.reset}` : '';
          const right = added ? `${COLORS.green}${added}${COLORS.reset}` : '';
          output.push(`${padAnsi(left, colWidth)}${separator}${padAnsi(right, colWidth)}`);
        } else {
          output.push(`${pad(removed, colWidth)} | ${pad(added, colWidth)}`);
        }
      }
      continue;
    }

    if (line.startsWith(' ') || line === '') {
      const content = line.startsWith(' ') ? line.slice(1) : line;
      if (useColor) {
        output.push(`${padAnsi(content, colWidth)}${separator}${content}`);
      } else {
        output.push(`${pad(content, colWidth)} | ${content}`);
      }
      i++;
      continue;
    }

    output.push(line);
    i++;
  }

  return output.join('\n');
}
