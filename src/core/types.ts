export type BlogFrontmatter = {
  title?: string;
  description?: string;
  id?: string;
  slug?: string;
  tags?: string[] | string;
  date?: string;
  cover?: string;
  image?: string;
  heroImage?: string;
  ogImage?: string;
  thumbnail?: string;
  img?: string;
  cover_image?: string;
  canonical?: string;
  draft?: boolean;
  [key: string]: unknown;
};

export type MarkdownHeading = {
  depth: number;
  text: string;
};

export type MarkdownLink = {
  text: string;
  url: string;
};

export type MarkdownImage = {
  alt?: string;
  url: string;
  title?: string;
};

export type DraftMetadata = {
  title?: string;
  description?: string;
  slug?: string;
  tags: string[];
  coverImage?: string;
  headings: MarkdownHeading[];
  links: MarkdownLink[];
  images: MarkdownImage[];
  wordCount: number;
  estimatedReadingTimeMinutes: number;
};

export type BlogDraft = {
  filePath: string;
  rawContent: string;
  frontmatter: BlogFrontmatter;
  markdownBody: string;
  metadata: DraftMetadata;
};

export type SeoSuggestion = {
  field: 'title' | 'description' | 'slug' | 'tags' | 'headings' | 'cover' | 'content' | 'images';
  severity: 'info' | 'warning' | 'critical';
  current?: string | string[];
  suggested?: string | string[];
  reason: string;
  source: 'deterministic' | 'ai';
};

export type WritingSuggestion = {
  original: string;
  suggested: string;
  reason: string;
  category: 'grammar' | 'clarity' | 'tone' | 'structure' | 'diction';
  confidence: number;
};

export type CoverPromptResult = {
  visualConcept: string;
  prompt: string;
  altText: string;
  suggestedFilename: string;
};

export type GeneratedImage = {
  fileName: string;
  mimeType: string;
  buffer?: Buffer;
  base64?: string;
  localPath?: string;
  providerMetadata?: Record<string, unknown>;
};

export type UploadedAsset = {
  provider: 'cloudinary' | 'local';
  url: string;
  secureUrl?: string;
  publicId?: string;
  localPath?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  metadata?: Record<string, unknown>;
};

export type DraftChange = {
  type: 'frontmatter' | 'body';
  field?: string;
  original?: unknown;
  updated?: unknown;
  reason?: string;
};

export type DraftPatch = {
  filePath: string;
  originalContent: string;
  updatedContent: string;
  diff: string;
  changes: DraftChange[];
};

export type WritingMode = 'light' | 'medium' | 'strong';

export type ImageSize = '1024x1024' | '1536x1024' | '1792x1024';

export type StorageTarget = 'local' | 'cloudinary';

export type ContentSummary = {
  shortSummary: string;
  keyTopics: string[];
  targetAudience: string;
  suggestedDescription: string;
};

export type CoverFieldName =
  | 'cover'
  | 'image'
  | 'heroImage'
  | 'ogImage'
  | 'thumbnail'
  | 'img'
  | 'cover_image';
