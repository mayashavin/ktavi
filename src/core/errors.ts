export type PoliraErrorCode =
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

export class PoliraError extends Error {
  constructor(
    message: string,
    public code: PoliraErrorCode,
    public cause?: unknown,
  ) {
    super(message);
    this.name = 'PoliraError';
  }
}
