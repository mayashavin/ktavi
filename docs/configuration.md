# Configuration

Ktavi uses a layered configuration system. You can configure it at the project level, global level, or rely on defaults.

## Config file

Create a config file with the interactive wizard:

```bash
ktavi config init
```

Or with defaults:

```bash
ktavi config init --defaults
```

This creates a `ktavi.config.ts` (or `.js`) in your project root.

### Example config

```typescript
export default {
  ai: {
    provider: 'openai',
    textModel: 'gpt-4o',
    imageModel: 'gpt-image-2',
  },
  writing: {
    defaultMode: 'medium',
  },
  image: {
    size: '1792x1024',
    style: 'modern editorial illustration',
  },
  markdown: {
    coverField: 'cover',
  },
  storage: {
    provider: 'local',
    local: {
      outputDir: './temp/images/blog',
      publicPathPrefix: '/images/blog',
    },
  },
};
```

## Config precedence

Configuration is loaded with the following priority (highest first):

1. **Project config** -- `ktavi.config.ts` or `ktavi.config.js` in the current working directory
2. **Global config** -- `~/.config/ktavi/config.js`
3. **Defaults** -- built-in defaults

Values are deep-merged: a project config only needs to specify the fields it overrides.

## Config reference

### ai

| Field        | Type       | Default         | Description                                                    |
| ------------ | ---------- | --------------- | -------------------------------------------------------------- |
| `provider`   | `'openai'` | `'openai'`      | AI provider                                                    |
| `textModel`  | `string`   | `'gpt-4o'`      | Model for text generation (review, SEO, summary, cover prompt) |
| `imageModel` | `string`   | `'gpt-image-2'` | Model for image generation                                     |

### writing

| Field         | Type                              | Default    | Description                      |
| ------------- | --------------------------------- | ---------- | -------------------------------- |
| `defaultMode` | `'light' \| 'medium' \| 'strong'` | `'medium'` | Default writing review intensity |

### image

| Field   | Type                                        | Default       | Description                                                                                              |
| ------- | ------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `size`  | `'1024x1024' \| '1536x1024' \| '1792x1024'` | `'1792x1024'` | Generated cover image dimensions                                                                         |
| `style` | `string`                                    | _(none)_      | Style hint passed to the cover prompt generator (e.g. `'watercolor illustration'`, `'modern editorial'`) |

### markdown

| Field                      | Type                                                                                      | Default   | Description                                                |
| -------------------------- | ----------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------- |
| `coverField`               | `'cover' \| 'image' \| 'heroImage' \| 'ogImage' \| 'thumbnail' \| 'img' \| 'cover_image'` | `'cover'` | Frontmatter field name used for the cover image URL        |
| `preserveFrontmatterOrder` | `boolean`                                                                                 | `true`    | Preserve original field ordering when updating frontmatter |

### storage

| Field      | Type                      | Default   | Description                                 |
| ---------- | ------------------------- | --------- | ------------------------------------------- |
| `provider` | `'local' \| 'cloudinary'` | `'local'` | Default storage target for generated images |

#### storage.local

| Field              | Type     | Default                | Description                             |
| ------------------ | -------- | ---------------------- | --------------------------------------- |
| `outputDir`        | `string` | `'./temp/images/blog'` | Directory where images are saved        |
| `publicPathPrefix` | `string` | `'/images/blog'`       | URL prefix for the image in frontmatter |

#### storage.cloudinary

| Field    | Type     | Default         | Description                           |
| -------- | -------- | --------------- | ------------------------------------- |
| `folder` | `string` | `'blog-covers'` | Cloudinary folder for uploaded images |

## Viewing resolved config

See the fully resolved configuration and where each value comes from:

```bash
ktavi config show
```

This displays every field, its value, and its source (`default`, `global`, or `project`).

```bash
ktavi config show --json    # Machine-readable output
```

## Global config

Create a global config that applies to all projects:

```bash
ktavi config init --global
```

This writes to `~/.config/ktavi/config.js`. Useful for setting your preferred AI model or writing mode across all projects. Project-level config always takes priority over global config.
