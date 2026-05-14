# Environment Variables

Ktavi reads environment variables from a `.env` file in your project root (loaded via `dotenv`).

## AI keys

| Variable              | Description                                             |
| --------------------- | ------------------------------------------------------- |
| `KTAVI_TEXT_API_KEY`  | API key for text generation (review, SEO, cover prompt) |
| `KTAVI_IMAGE_API_KEY` | API key for image generation (cover images)             |

Set the key that matches your configured provider. For example, if `ai.provider` is `anthropic`, set `KTAVI_TEXT_API_KEY` to your Anthropic key. If you also use cover image generation (OpenAI), set `KTAVI_IMAGE_API_KEY` to your OpenAI key.

### Fallback keys

If the Ktavi-specific variables are not set, provider-specific keys are used as fallbacks:

| Ktavi variable        | Fallback                                                         |
| --------------------- | ---------------------------------------------------------------- |
| `KTAVI_TEXT_API_KEY`  | `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (based on `ai.provider`) |
| `KTAVI_IMAGE_API_KEY` | `OPENAI_API_KEY`                                                 |

This means existing setups with `OPENAI_API_KEY` continue to work without changes.

## Cloudinary (optional)

These are only needed if you use Cloudinary as your storage provider (`storage.provider: 'cloudinary'` in config, or `--upload cloudinary` flag).

| Variable                | Description                |
| ----------------------- | -------------------------- |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY`    | Cloudinary API key         |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret      |

## Setup

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

`.env.example` contents:

```
KTAVI_TEXT_API_KEY=
KTAVI_IMAGE_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Commands and their AI requirements

| Command   | Without AI key              | With AI key                                                  |
| --------- | --------------------------- | ------------------------------------------------------------ |
| `analyze` | Metadata and structure only | Adds content summary                                         |
| `seo`     | Deterministic checks only   | Adds AI-powered suggestions                                  |
| `fix`     | Deterministic fixes only    | Adds AI-powered fixes                                        |
| `review`  | **Does not run**            | Full writing review                                          |
| `cover`   | **Does not run**            | Full cover generation                                        |
| `prepare` | Deterministic SEO only      | Full workflow with summary, writing review, and cover prompt |
