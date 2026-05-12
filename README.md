# Ktavi

[![npm version](https://img.shields.io/npm/v/ktavi.svg)](https://www.npmjs.com/package/ktavi)
[![CI](https://github.com/mayashavin/polira/actions/workflows/ci.yml/badge.svg)](https://github.com/mayashavin/polira/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/mayashavin/polira/branch/main/graph/badge.svg)](https://codecov.io/gh/mayashavin/polira)
[![license](https://img.shields.io/npm/l/ktavi.svg)](./LICENSE)

A CLI-first, workflow-driven AI assistant for preparing Markdown blog drafts for publishing.

Ktavi reviews your draft for grammar, clarity, and SEO metadata, generates a matching cover image concept, optionally creates and uploads the image, and updates your Markdown frontmatter -- all with a reviewable diff before any changes are written.

## Features

- **Analyze** -- parse Markdown structure, frontmatter, and content metrics
- **SEO review** -- deterministic checks plus AI-powered suggestions for title, description, slug, tags, headings, and images
- **Writing review** -- grammar, clarity, tone, and structure suggestions with configurable intensity
- **Content summary** -- AI-generated summary, key topics, target audience, and suggested meta description
- **Cover images** -- generate a visual concept and prompt, create the image, save locally or upload to Cloudinary
- **Interactive feedback** -- preview generated images and regenerate with feedback before accepting
- **Diff before apply** -- every change is shown as a unified diff; nothing is written without `--apply`
- **Layered config** -- project, global, and default settings with `ktavi config init` and `ktavi config show`

## Quickstart

```bash
npm install -g ktavi
```

Set your OpenAI API key:

```bash
echo "OPENAI_API_KEY=sk-..." >> .env
```

Run your first analysis:

```bash
ktavi analyze ./posts/my-post.md
```

## Commands

```bash
ktavi analyze <file>              # Metadata summary and content analysis
ktavi seo <file> [--apply]        # SEO review with optional auto-fix
ktavi review <file> [--mode ...]  # Writing quality review
ktavi fix <file> [--apply]        # Auto-fix critical SEO issues
ktavi cover <file> [--generate]   # Cover image generation
ktavi prepare <file> [--apply]    # Full publish-preparation workflow
ktavi config show                 # View resolved config with sources
ktavi config init                 # Interactive config wizard
```

Use `--json` on any command for machine-readable output.

## Documentation

- [Getting Started](./docs/getting-started.md)
- [CLI Commands](./docs/commands.md) -- full flag reference
- [Configuration](./docs/configuration.md) -- all config fields and defaults
- [Environment Variables](./docs/environment-variables.md) -- API keys and setup
- [Provider Setup](./docs/providers.md) -- OpenAI and Cloudinary guides
- [Workflows](./docs/workflows.md) -- usage patterns and examples
- [Contributing](./CONTRIBUTING.md) -- development setup and guidelines

## Privacy

Markdown content is sent to the configured AI provider (e.g. OpenAI) for grammar review, SEO suggestions, content summarization, and cover image generation. No data is stored by Ktavi itself.
