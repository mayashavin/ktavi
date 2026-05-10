# Getting Started

## Installation

```bash
npm install -g ktavi
```

Or use it locally in a project:

```bash
npm install --save-dev ktavi
```

## Setup

### 1. Set your API key

Create a `.env` file in your project root:

```bash
OPENAI_API_KEY=sk-...
```

The API key is required for AI-powered features (writing review, content summarization, cover image generation). Deterministic features like SEO checks and draft analysis work without it.

### 2. Create a config file (optional)

```bash
ktavi config init
```

This launches an interactive wizard that walks you through AI provider, models, writing mode, image settings, and storage configuration. The result is a `ktavi.config.ts` (or `.js`) file in your project root.

To skip the prompts and use defaults:

```bash
ktavi config init --defaults
```

See [Configuration](./configuration.md) for full details.

## First run

Analyze a Markdown blog draft:

```bash
ktavi analyze ./posts/my-post.md
```

This parses the file and shows:

- Frontmatter fields (title, description, slug, tags, cover, draft status)
- Content metrics (word count, reading time, headings, links, images)
- AI-generated content summary (when `OPENAI_API_KEY` is set)

## Common workflows

### Review SEO metadata

```bash
ktavi seo ./posts/my-post.md
```

Checks title length, description presence, slug format, tags, heading structure, image alt text, and more. Add `--apply` to auto-fix critical issues in frontmatter.

### Review writing quality

```bash
ktavi review ./posts/my-post.md
```

Returns grammar, clarity, tone, and structure suggestions with confidence scores. Use `--mode light` for minimal suggestions or `--mode strong` for thorough review.

### Generate a cover image

```bash
ktavi cover ./posts/my-post.md --prompt-only    # Just the concept
ktavi cover ./posts/my-post.md --generate       # Generate the actual image
```

### Full publish preparation

```bash
ktavi prepare ./posts/my-post.md
```

Runs SEO review, writing review, content summary, and cover prompt generation in one pass. Add `--generate-cover` and `--apply` to generate images and write changes.

## Next steps

- [CLI Commands](./commands.md) -- full flag reference for every command
- [Configuration](./configuration.md) -- all config fields and defaults
- [Environment Variables](./environment-variables.md) -- API keys and optional settings
- [Provider Setup](./providers.md) -- OpenAI and Cloudinary configuration
- [Workflows](./workflows.md) -- usage patterns and examples
