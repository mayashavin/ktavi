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

### OpenAI

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Add it to your `.env` file:

```
OPENAI_API_KEY=sk-...
```

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

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Add it to your `.env` file:

```
ANTHROPIC_API_KEY=sk-ant-...
```

```typescript
export default {
  ai: {
    provider: 'anthropic',
    textModel: 'claude-sonnet-4-20250514',
  },
};
```

Note: Anthropic does not offer image generation, so cover image generation still requires an `OPENAI_API_KEY`.

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
