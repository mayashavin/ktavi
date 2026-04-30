import type { PoliraConfig } from './src/core/config.js';

const config: PoliraConfig = {
  ai: {
    provider: 'openai',
    textModel: 'gpt-4o',
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
      outputDir: './public/images/blog',
      publicPathPrefix: '/images/blog',
    },
    cloudinary: {
      folder: 'blog-covers',
    },
  },
};

export default config;
