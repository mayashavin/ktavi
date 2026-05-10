import { renderColoredDiff, renderSideBySideDiff } from '../utils/diffRenderer.js';

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const SEVERITY_ICONS = {
  critical: '✖',
  warning: '⚠',
  info: 'ℹ',
} as const;

const SEVERITY_COLORS = {
  critical: COLORS.red,
  warning: COLORS.yellow,
  info: COLORS.cyan,
} as const;

export const logger = {
  info(message: string) {
    console.log(`${COLORS.blue}info${COLORS.reset}  ${message}`);
  },

  success(message: string) {
    console.log(`${COLORS.green}done${COLORS.reset}  ${message}`);
  },

  warn(message: string) {
    console.log(`${COLORS.yellow}warn${COLORS.reset}  ${message}`);
  },

  error(message: string) {
    console.error(`${COLORS.red}error${COLORS.reset} ${message}`);
  },

  heading(message: string) {
    console.log(`\n${COLORS.bold}${message}${COLORS.reset}`);
  },

  dim(message: string) {
    console.log(`${COLORS.dim}${message}${COLORS.reset}`);
  },

  label(label: string, value: string) {
    console.log(`  ${COLORS.cyan}${label}:${COLORS.reset} ${value}`);
  },

  blank() {
    console.log();
  },

  severity(severity: 'info' | 'warning' | 'critical', label: string, message: string) {
    const icon = SEVERITY_ICONS[severity];
    const color = SEVERITY_COLORS[severity];
    console.log(
      `  ${color}${icon}${COLORS.reset} ${COLORS.bold}${label}:${COLORS.reset} ${message}`,
    );
  },

  diff(diffText: string, options?: { sideBySide?: boolean }) {
    const rendered = options?.sideBySide
      ? renderSideBySideDiff(diffText)
      : renderColoredDiff(diffText);
    console.log(rendered);
  },

  summary(counts: { info?: number; warning?: number; critical?: number }) {
    const parts: string[] = [];
    if (counts.critical) {
      parts.push(`${COLORS.red}${counts.critical} critical${COLORS.reset}`);
    }
    if (counts.warning) {
      const label = counts.warning === 1 ? 'warning' : 'warnings';
      parts.push(`${COLORS.yellow}${counts.warning} ${label}${COLORS.reset}`);
    }
    if (counts.info) {
      parts.push(`${COLORS.cyan}${counts.info} info${COLORS.reset}`);
    }
    if (parts.length === 0) {
      console.log(`\n${COLORS.green}✔ No issues found.${COLORS.reset}`);
    } else {
      console.log(`\n${COLORS.dim}Summary:${COLORS.reset} ${parts.join(', ')}`);
    }
  },
};
