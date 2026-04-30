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
};
