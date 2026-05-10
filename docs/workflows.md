# Workflows

This guide shows common usage patterns for preparing blog drafts with Ktavi.

## Analyze a draft

Start by understanding what your draft contains:

```bash
ktavi analyze ./posts/my-post.md
```

This gives you a quick overview: frontmatter completeness, word count, reading time, heading structure, images, and (with an API key) an AI-generated summary with suggested meta description.

## Review and fix SEO issues

### Check SEO

```bash
ktavi seo ./posts/my-post.md
```

This runs both deterministic checks (title length, slug format, missing fields) and AI-powered analysis. Issues are categorized by severity:

- **Critical** -- must fix before publishing (e.g. missing title)
- **Warning** -- should fix for better SEO (e.g. description too short)
- **Info** -- nice to have (e.g. could add more tags)

### Auto-fix critical issues

```bash
ktavi fix ./posts/my-post.md
```

Shows a diff of proposed fixes. When you're ready:

```bash
ktavi fix ./posts/my-post.md --apply
```

## Review writing quality

```bash
ktavi review ./posts/my-post.md
```

Each suggestion includes the original text, a suggested replacement, the reason, and a confidence score.

### Choosing a review mode

- `--mode light` -- grammar and spelling only. Good for polished drafts.
- `--mode medium` -- (default) grammar, clarity, and sentence flow.
- `--mode strong` -- thorough review with readability rewrites. Good for first drafts.

```bash
ktavi review ./posts/my-post.md --mode strong
```

## Generate a cover image

### Step 1: Generate a concept

```bash
ktavi cover ./posts/my-post.md --prompt-only
```

This analyzes your content and produces a visual concept, image prompt, alt text, and suggested filename -- without generating an actual image.

### Step 2: Generate the image

```bash
ktavi cover ./posts/my-post.md --generate
```

In interactive mode (the default), you can preview the generated image and choose to:

- **Accept** -- save the image
- **Regenerate** -- provide feedback and generate a new version
- **Cancel** -- discard the image

Use `--autosave` to skip the interactive prompt and accept the first result.

### Step 3: Save and apply

```bash
# Save locally and update frontmatter
ktavi cover ./posts/my-post.md --generate --save local --apply

# Upload to Cloudinary and update frontmatter
ktavi cover ./posts/my-post.md --generate --upload cloudinary --apply
```

## Full preparation pipeline

Run everything in one command:

```bash
ktavi prepare ./posts/my-post.md
```

This runs:

1. Content summary
2. SEO review (deterministic + AI)
3. Writing review
4. Cover prompt generation

To include image generation and apply all changes:

```bash
ktavi prepare ./posts/my-post.md --generate-cover --save local --apply --mode strong
```

## Dry-run first, apply later

All commands that modify files default to **dry-run mode**. They show you exactly what would change (as a unified diff) without writing anything. Add `--apply` only when you're satisfied with the proposed changes.

```bash
# Preview changes
ktavi seo ./posts/my-post.md

# Apply them
ktavi seo ./posts/my-post.md --apply
```

## JSON output for automation

Every command supports `--json` for integration with other tools:

```bash
ktavi analyze ./posts/my-post.md --json | jq '.draft.metadata.wordCount'
ktavi seo ./posts/my-post.md --json | jq '.suggestions[] | select(.severity == "critical")'
```
