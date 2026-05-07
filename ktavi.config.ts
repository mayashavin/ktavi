import type { KtaviConfig } from './src/core/config.js';

const config: KtaviConfig = {
  ai: {
    provider: 'openai',
    textModel: 'gpt-4o',
    imageModel: 'dall-e-3',
  },
  markdown: {
    coverField: 'cover',
    preserveFrontmatterOrder: true,
  },
  writing: {
    defaultMode: 'medium',
  },
  image: {
    size: '1792x1024',
    style: 'modern editorial illustration',
  },
  storage: {
    provider: 'local',
    local: {
      outputDir: './temp/images/blog',
      publicPathPrefix: '/images/blog',
    },
    cloudinary: {
      folder: 'blog-covers',
    },
  },
};

export default config;
