# CLI Commands

All commands accept a Markdown file as their first argument. Use `--json` on any command to get machine-readable JSON output.

## analyze

Parse a Markdown file and print a metadata summary.

```bash
ktavi analyze <file> [options]
```

| Flag     | Description            |
| -------- | ---------------------- |
| `--json` | Output results as JSON |

**What it shows:** frontmatter fields, content metrics (word count, reading time, headings, links, images), heading hierarchy, image list, and an AI-generated content summary (when `OPENAI_API_KEY` is set).

**AI provider:** optional. Without it, summary is skipped.

```bash
ktavi analyze ./posts/my-post.md
ktavi analyze ./posts/my-post.md --json
```

## seo

Review SEO metadata and suggest improvements.

```bash
ktavi seo <file> [options]
```

| Flag      | Description                         |
| --------- | ----------------------------------- |
| `--apply` | Apply critical fixes to frontmatter |
| `--json`  | Output results as JSON              |

**What it checks:** title length, description presence and length, slug format, tags, heading structure, cover image, image alt text. Runs deterministic checks always; adds AI-powered suggestions when `OPENAI_API_KEY` is set.

**Severity levels:** `critical` (must fix), `warning` (should fix), `info` (nice to have).

```bash
ktavi seo ./posts/my-post.md
ktavi seo ./posts/my-post.md --apply
```

## review

Review writing quality and suggest improvements.

```bash
ktavi review <file> [options]
```

| Flag            | Description                                                     |
| --------------- | --------------------------------------------------------------- |
| `--mode <mode>` | Review mode: `light`, `medium`, or `strong` (default: `medium`) |
| `--json`        | Output results as JSON                                          |

**Requires:** `OPENAI_API_KEY`.

**Modes:**

- `light` -- grammar, spelling, and punctuation only
- `medium` -- grammar, spelling, clarity, and sentence flow
- `strong` -- thorough review including readability rewrites, while preserving writer's voice

Each suggestion includes the original text, suggested replacement, reason, category (`grammar`, `clarity`, `tone`, `structure`, `diction`), and a confidence score (0--1).

```bash
ktavi review ./posts/my-post.md
ktavi review ./posts/my-post.md --mode strong
ktavi review ./posts/my-post.md --mode light --json
```

## fix

Generate and show suggested fixes with diffs.

```bash
ktavi fix <file> [options]
```

| Flag            | Description                                                     |
| --------------- | --------------------------------------------------------------- |
| `--apply`       | Apply the fixes                                                 |
| `--mode <mode>` | Review mode: `light`, `medium`, or `strong` (default: `medium`) |
| `--json`        | Output results as JSON                                          |

Runs SEO review and auto-generates fixes for critical issues. Shows a unified diff of proposed frontmatter changes before applying.

**AI provider:** optional. Without it, only deterministic SEO checks are used.

```bash
ktavi fix ./posts/my-post.md
ktavi fix ./posts/my-post.md --apply
```

## cover

Generate a cover image concept, prompt, and optionally create the image.

```bash
ktavi cover <file> [options]
```

| Flag                | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `--prompt-only`     | Only generate the image prompt (no image generation)                        |
| `--generate`        | Generate the actual cover image                                             |
| `--save <target>`   | Save target: `local`                                                        |
| `--upload <target>` | Upload target: `cloudinary`                                                 |
| `--apply`           | Apply cover image URL to frontmatter                                        |
| `--size <size>`     | Image size: `1024x1024`, `1536x1024`, or `1792x1024` (default: `1792x1024`) |
| `--autosave`        | Auto-accept generated image without interactive prompts                     |
| `--json`            | Output results as JSON                                                      |

**Requires:** `OPENAI_API_KEY`.

When `--generate` is used without `--autosave`, the command enters an interactive mode where you can preview the image and choose to accept, regenerate with feedback, or cancel.

```bash
ktavi cover ./posts/my-post.md --prompt-only
ktavi cover ./posts/my-post.md --generate --save local --apply
ktavi cover ./posts/my-post.md --generate --upload cloudinary --apply
ktavi cover ./posts/my-post.md --generate --autosave --apply
```

## prepare

Run the full publish-preparation workflow.

```bash
ktavi prepare <file> [options]
```

| Flag                | Description                                                             |
| ------------------- | ----------------------------------------------------------------------- |
| `--generate-cover`  | Generate a cover image                                                  |
| `--upload <target>` | Upload target: `cloudinary` or `none` (default: `none`)                 |
| `--save <target>`   | Save target: `local` or `none` (default: `none`)                        |
| `--apply`           | Apply safe changes                                                      |
| `--mode <mode>`     | Writing review mode: `light`, `medium`, or `strong` (default: `medium`) |
| `--json`            | Output results as JSON                                                  |

Runs all steps in one pass: SEO review, content summary, writing review, and cover prompt generation. Optionally generates a cover image and applies changes.

**AI provider:** optional. Without it, only deterministic SEO checks run; writing review, summary, and cover prompt are skipped.

```bash
ktavi prepare ./posts/my-post.md
ktavi prepare ./posts/my-post.md --apply --mode strong
ktavi prepare ./posts/my-post.md --generate-cover --save local --apply
ktavi prepare ./posts/my-post.md --json
```

## config

View and manage Ktavi configuration.

### config show

Display the fully resolved configuration with source attribution.

```bash
ktavi config show [options]
```

| Flag     | Description    |
| -------- | -------------- |
| `--json` | Output as JSON |

Shows every config field, its current value, and where it came from (`default`, `global`, or `project`).

```bash
ktavi config show
ktavi config show --json
```

### config init

Interactively create a ktavi config file.

```bash
ktavi config init [options]
```

| Flag         | Description                                         |
| ------------ | --------------------------------------------------- |
| `--global`   | Create global config at `~/.config/ktavi/config.js` |
| `--force`    | Overwrite existing config without confirmation      |
| `--defaults` | Skip prompts and write default config               |

```bash
ktavi config init                    # Interactive wizard
ktavi config init --defaults         # Write defaults without prompts
ktavi config init --global           # Create global config
ktavi config init --defaults --force # Overwrite without asking
```
