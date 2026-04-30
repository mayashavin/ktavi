# Polira

A CLI-first, workflow-driven AI assistant for preparing Markdown blog drafts for publishing.

It reviews your draft for grammar, clarity, and SEO metadata, generates a matching cover image concept, optionally creates and uploads the image, and updates your Markdown frontmatter with a reviewable diff.

## Features

- Parse Markdown and YAML frontmatter
- Review SEO metadata
- Suggest grammar and clarity improvements
- Generate blog cover image prompts
- Generate cover images
- Save images locally or upload to Cloudinary
- Update Markdown frontmatter
- Show diffs before applying changes

## Setup

```bash
npm install
cp .env.example .env
# Add your API keys to .env
```

## Usage

```bash
polira analyze ./posts/my-post.md
polira seo ./posts/my-post.md
polira review ./posts/my-post.md
polira cover ./posts/my-post.md --prompt-only
polira prepare ./posts/my-post.md
```

Use `--apply` to write changes.

## Development

```bash
npm run dev -- analyze ./posts/my-post.md   # Run locally via tsx
npm run build                                # Build with Vite
npm test                                     # Run tests
npm run typecheck                            # Type check
npm run lint                                 # Lint
npm run format                               # Format
```

## Releasing

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and changelogs.

```bash
npx changeset           # Add a changeset after making notable changes
npm run version          # Bump version and update CHANGELOG.md
npm run release          # Build and publish to npm
```

## Privacy

Markdown content may be sent to the configured AI provider (e.g. OpenAI) for grammar review, SEO suggestions, and cover image generation.
