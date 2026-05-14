# Provider Setup

Ktavi uses a provider abstraction for AI text generation, image generation, and asset storage. This guide covers how to set up each provider.

## AI providers

Ktavi supports multiple AI providers for text generation. Set the provider in your `ktavi.config.ts`:

```typescript
export default {
  ai: {
    provider: 'openai', // or 'anthropic'
    textModel: 'gpt-4o',
  },
};
```

**Text model** is used by: `analyze` (summary), `seo` (AI suggestions), `review`, `fix` (AI suggestions), `cover` (prompt generation), and `prepare`.

**Image model** is used by: `cover --generate` and `prepare --generate-cover`. Image generation currently uses OpenAI regardless of the text provider setting.

Set your API keys in `.env`:

```
KTAVI_TEXT_API_KEY=sk-...        # for text generation (review, SEO, cover prompt)
KTAVI_IMAGE_API_KEY=sk-...      # for image generation (cover --generate)
```

Provider-specific keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) are also supported as fallbacks. `KTAVI_IMAGE_API_KEY` falls back to `OPENAI_API_KEY`.

### OpenAI

```typescript
export default {
  ai: {
    provider: 'openai',
    textModel: 'gpt-4o',
    imageModel: 'gpt-image-2',
  },
};
```

### Anthropic (Claude)

```typescript
export default {
  ai: {
    provider: 'anthropic',
    textModel: 'claude-sonnet-4-20250514',
  },
};
```

Note: Anthropic does not offer image generation, so cover image generation requires `KTAVI_IMAGE_API_KEY` set to an OpenAI key.

### Supported image sizes

| Size        | Aspect ratio  | Use case                           |
| ----------- | ------------- | ---------------------------------- |
| `1024x1024` | Square        | Social media thumbnails            |
| `1536x1024` | 3:2 landscape | Standard blog covers               |
| `1792x1024` | 16:9 wide     | Wide-format blog headers (default) |

## Local storage

Saves generated images to your local filesystem. This is the default storage provider.

### Configuration

```typescript
export default {
  storage: {
    provider: 'local',
    local: {
      outputDir: './temp/images/blog', // Where files are saved
      publicPathPrefix: '/images/blog', // URL prefix in frontmatter
    },
  },
};
```

When a cover image is generated and saved locally:

- The image file is written to `{outputDir}/{filename}.png`
- The frontmatter cover field is set to `{publicPathPrefix}/{filename}.png`

### CLI override

```bash
ktavi cover ./post.md --generate --save local
```

## Cloudinary

Uploads generated images to Cloudinary CDN.

### Setup

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Find your credentials in the Cloudinary dashboard
3. Add them to your `.env` file:

```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwx
```

### Configuration

```typescript
export default {
  storage: {
    provider: 'cloudinary',
    cloudinary: {
      folder: 'blog-covers', // Cloudinary folder for uploads
    },
  },
};
```

### CLI override

```bash
ktavi cover ./post.md --generate --upload cloudinary --apply
```

When a cover image is uploaded, the Cloudinary secure URL is written to the frontmatter cover field.
