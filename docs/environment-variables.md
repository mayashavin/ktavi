# Environment Variables

Ktavi reads environment variables from a `.env` file in your project root (loaded via `dotenv`).

## Required

| Variable         | Description    | Required for                                                                                                      |
| ---------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY` | OpenAI API key | `review`, `cover` (always required). `analyze`, `seo`, `fix`, `prepare` (optional -- enables AI-powered features) |

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
OPENAI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Commands and their AI requirements

| Command   | Without `OPENAI_API_KEY`    | With `OPENAI_API_KEY`                                        |
| --------- | --------------------------- | ------------------------------------------------------------ |
| `analyze` | Metadata and structure only | Adds content summary                                         |
| `seo`     | Deterministic checks only   | Adds AI-powered suggestions                                  |
| `fix`     | Deterministic fixes only    | Adds AI-powered fixes                                        |
| `review`  | **Does not run**            | Full writing review                                          |
| `cover`   | **Does not run**            | Full cover generation                                        |
| `prepare` | Deterministic SEO only      | Full workflow with summary, writing review, and cover prompt |
