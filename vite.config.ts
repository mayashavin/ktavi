import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    target: 'node18',
    lib: {
      entry: resolve(__dirname, 'src/cli/index.ts'),
      formats: ['es'],
      fileName: 'cli/index',
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        /^node:/,
        /^@inquirer\//,
        'commander',
        'gray-matter',
        'unified',
        'remark-parse',
        'remark-stringify',
        'zod',
        'diff',
        'cloudinary',
        'dotenv',
        'dotenv/config',
        'openai',
        'jiti',
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        banner: (chunk) => (chunk.fileName === 'cli/index.js' ? '#!/usr/bin/env node\n' : ''),
      },
    },
    minify: false,
    sourcemap: true,
  },
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      outDirs: ['dist'],
    }),
  ],
});
