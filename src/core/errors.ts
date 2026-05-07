export type KtaviErrorCode =
  | 'FILE_NOT_FOUND'
  | 'INVALID_MARKDOWN'
  | 'INVALID_FRONTMATTER'
  | 'AI_PROVIDER_ERROR'
  | 'IMAGE_GENERATION_FAILED'
  | 'CLOUDINARY_UPLOAD_FAILED'
  | 'CONFIG_NOT_FOUND'
  | 'CONFIG_INVALID'
  | 'PATCH_FAILED'
  | 'WRITE_FAILED';

export class KtaviError extends Error {
  constructor(
    message: string,
    public code: KtaviErrorCode,
    public cause?: unknown,
  ) {
    super(message);
    this.name = 'KtaviError';
  }
}

export function friendlyErrorMessage(code: KtaviErrorCode): string {
  switch (code) {
    case 'FILE_NOT_FOUND':
      return 'The specified file was not found. Check the path and try again.';
    case 'INVALID_MARKDOWN':
      return 'The file does not appear to be valid Markdown.';
    case 'INVALID_FRONTMATTER':
      return 'The YAML frontmatter in the file is invalid. Check for syntax errors.';
    case 'AI_PROVIDER_ERROR':
      return 'The AI provider returned an error. Check your API key and network connection.';
    case 'IMAGE_GENERATION_FAILED':
      return 'Image generation failed. Check your API key and try again.';
    case 'CLOUDINARY_UPLOAD_FAILED':
      return 'Upload to Cloudinary failed. Check your credentials and network connection.';
    case 'CONFIG_NOT_FOUND':
      return 'No configuration file found. Run `ktavi config init` to create one.';
    case 'CONFIG_INVALID':
      return 'The configuration file is invalid. Run `ktavi config init` to reset it.';
    case 'PATCH_FAILED':
      return 'Failed to apply changes to the file. Check file permissions and try again.';
    case 'WRITE_FAILED':
      return 'Failed to write changes to the file. Check file permissions and try again.';
    default:
      return 'An unexpected error occurred.';
  }
}
