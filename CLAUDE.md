# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ktavi is a CLI-first, workflow-driven AI assistant for preparing Markdown blog drafts for publishing. It reviews drafts for grammar, clarity, and SEO metadata, generates cover image concepts/prompts, optionally creates and uploads cover images, and updates Markdown frontmatter — all with reviewable diffs before applying changes.

The full project spec is in `project-plan.md`.

## Commands

```bash
npm run dev           # Run CLI locally via tsx (tsx src/cli/index.ts)
npm run build         # Build with Vite (vite build)
npm test              # Run tests (vitest run)
npm run test:watch    # Watch mode tests (vitest)
npm run lint          # Lint (eslint .)
npm run format        # Format (prettier --write .)
npm run typecheck     # Type check without emitting (tsc --noEmit)
```

The CLI binary is `ktavi`. During development, use `npm run dev -- <command> <args>` to invoke it.

## Build

Vite builds the project in library mode with `preserveModules` — each source file produces a corresponding output file in `dist/`. TypeScript declarations are generated via `vite-plugin-dts`. `tsconfig.json` is type-checking only (`noEmit: true`); Vite handles all compilation.

## Releases & Changelog

Uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog generation.

```bash
npx changeset              # Add a changeset (run after notable changes)
npm run version            # Bump version + update CHANGELOG.md
npm run release            # Build + publish to npm
```

Each PR with user-facing changes should include a changeset file (created by `npx changeset`).

## Architecture

Four-layer architecture — each layer only calls the layer below it:

```
CLI Commands  →  parse args, load config, call workflows, print output
Workflows     →  compose tools into product flows (e.g. prepareDraftWorkflow)
Tools         →  atomic capabilities (e.g. parseMarkdownTool, reviewSeoTool)
Providers     →  adapters for external systems (AI, image gen, storage)
```

**CLI commands must not contain business logic.** All logic lives in tools and workflows.

### Source layout

```
src/cli/commands/   — CLI command definitions (analyze, seo, review, fix, cover, prepare)
src/core/           — types, config, provider interfaces, errors
src/tools/          — each tool in its own directory (parse-markdown/, review-seo/, etc.)
src/workflows/      — workflow compositions (prepareDraftWorkflow, generateAndAttachCoverWorkflow, etc.)
src/providers/      — AI text, image generation, and storage provider implementations
src/utils/          — filesystem, frontmatter, markdown, slug, reading-time helpers
tests/fixtures/     — Markdown test files (valid-post.md, missing-meta.md, etc.)
tests/tools/        — tool unit tests
tests/workflows/    — workflow integration tests
```

## Key Design Principles

- **Review before apply**: never write files unless `--apply` is passed. Default is dry-run/diff mode.
- **Deterministic where possible**: use normal code for parsing, validation, diffing, file I/O. Use AI only for grammar/style review, SEO suggestions, cover concept generation.
- **Provider abstraction**: AI text, image generation, and asset storage are behind interfaces (`TextAIProvider`, `ImageGenerationProvider`, `AssetStorageProvider`). Don't hard-code OpenAI or Cloudinary into workflows.
- **Preserve writer voice**: grammar suggestions should improve quality without aggressive rewriting. Default writing mode is `medium`.
- **Structured AI output**: AI prompts request JSON; validate all AI responses with zod schemas.
- **Future-ready but MVP-scoped**: the architecture supports future `skills/` and `agents/` layers, but don't implement those in MVP.

## Tech Stack

- TypeScript (ES modules, `"type": "module"`)
- Commander (CLI framework)
- gray-matter + unified/remark (Markdown/frontmatter parsing)
- zod (validation, including AI output schemas)
- vitest (testing — mock external providers, never call real AI/Cloudinary in tests)
- diff/jsdiff (diff generation)
- cloudinary SDK (optional upload provider)
- dotenv (env var loading)

## Environment Variables

Required in `.env` (never committed):

```
OPENAI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Core Types

Central types are in `src/core/types.ts`. Key types: `BlogDraft`, `BlogFrontmatter`, `DraftMetadata`, `SeoSuggestion`, `WritingSuggestion`, `CoverPromptResult`, `GeneratedImage`, `UploadedAsset`, `DraftPatch`, `DraftChange`. Provider interfaces are in `src/core/providers.ts`.

## CLI Commands

```bash
ktavi analyze <file>                              # Parse and summarize Markdown structure
ktavi seo <file> [--json] [--apply]               # Review SEO metadata
ktavi review <file> [--mode light|medium|strong]  # Grammar/clarity review
ktavi fix <file> [--apply] [--mode ...]           # Show diff of suggested fixes
ktavi cover <file> [--prompt-only|--generate]     # Cover image workflow
       [--save local] [--upload cloudinary] [--apply] [--size 1792x1024]
ktavi prepare <file> [--generate-cover]           # Full publish-prep workflow
       [--upload cloudinary|none] [--apply] [--mode ...] [--json]
```
