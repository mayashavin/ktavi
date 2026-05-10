import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCloudinaryStorageProvider } from '../../../src/providers/storage/cloudinaryStorageProvider.js';
import { KtaviError } from '../../../src/core/errors.js';
import type { GeneratedImage } from '../../../src/core/types.js';

const { mockCloudinaryConfig, mockCloudinaryUpload } = vi.hoisted(() => ({
  mockCloudinaryConfig: vi.fn(),
  mockCloudinaryUpload: vi.fn(),
}));

vi.mock('cloudinary', () => ({
  v2: {
    config: mockCloudinaryConfig,
    uploader: {
      upload: mockCloudinaryUpload,
    },
  },
}));

const validConfig = {
  cloudName: 'test-cloud',
  apiKey: 'test-api-key',
  apiSecret: 'test-api-secret',
  folder: 'blog-covers',
};

const validImage: GeneratedImage = {
  fileName: 'cover-image.png',
  mimeType: 'image/png',
  base64: 'abc123',
};

const cloudinarySuccessResult = {
  url: 'http://res.cloudinary.com/test-cloud/image/upload/blog-covers/cover-image.png',
  secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/blog-covers/cover-image.png',
  public_id: 'blog-covers/cover-image',
  width: 1792,
  height: 1024,
  format: 'png',
  bytes: 12345,
};

describe('createCloudinaryStorageProvider', () => {
  describe('credential validation', () => {
    it('throws KtaviError when cloudName is empty', () => {
      expect(() => createCloudinaryStorageProvider({ ...validConfig, cloudName: '' })).toThrow(
        KtaviError,
      );
    });

    it('throws KtaviError when apiKey is empty', () => {
      expect(() => createCloudinaryStorageProvider({ ...validConfig, apiKey: '' })).toThrow(
        KtaviError,
      );
    });

    it('throws KtaviError when apiSecret is empty', () => {
      expect(() => createCloudinaryStorageProvider({ ...validConfig, apiSecret: '' })).toThrow(
        KtaviError,
      );
    });

    it('throws with CLOUDINARY_UPLOAD_FAILED code for missing cloudName', () => {
      try {
        createCloudinaryStorageProvider({ ...validConfig, cloudName: '' });
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(KtaviError);
        expect((err as KtaviError).code).toBe('CLOUDINARY_UPLOAD_FAILED');
      }
    });

    it('throws with CLOUDINARY_UPLOAD_FAILED code for missing apiKey', () => {
      try {
        createCloudinaryStorageProvider({ ...validConfig, apiKey: '' });
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(KtaviError);
        expect((err as KtaviError).code).toBe('CLOUDINARY_UPLOAD_FAILED');
      }
    });

    it('throws with CLOUDINARY_UPLOAD_FAILED code for missing apiSecret', () => {
      try {
        createCloudinaryStorageProvider({ ...validConfig, apiSecret: '' });
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(KtaviError);
        expect((err as KtaviError).code).toBe('CLOUDINARY_UPLOAD_FAILED');
      }
    });

    it('returns an AssetStorageProvider when all credentials are valid', () => {
      const provider = createCloudinaryStorageProvider(validConfig);
      expect(provider).toBeDefined();
      expect(typeof provider.upload).toBe('function');
    });
  });

  describe('upload', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('throws KtaviError when image has no base64 and no buffer', async () => {
      const provider = createCloudinaryStorageProvider(validConfig);
      const imageWithNoData: GeneratedImage = {
        fileName: 'cover-image.png',
        mimeType: 'image/png',
      };

      await expect(provider.upload(imageWithNoData)).rejects.toThrow(KtaviError);
    });

    it('throws with CLOUDINARY_UPLOAD_FAILED code when image has no data', async () => {
      const provider = createCloudinaryStorageProvider(validConfig);
      const imageWithNoData: GeneratedImage = {
        fileName: 'cover-image.png',
        mimeType: 'image/png',
      };

      await expect(provider.upload(imageWithNoData)).rejects.toMatchObject({
        code: 'CLOUDINARY_UPLOAD_FAILED',
      });
    });

    it('configures cloudinary with the provider credentials', async () => {
      mockCloudinaryUpload.mockResolvedValueOnce(cloudinarySuccessResult);

      const provider = createCloudinaryStorageProvider(validConfig);
      await provider.upload(validImage);

      expect(mockCloudinaryConfig).toHaveBeenCalledWith({
        cloud_name: validConfig.cloudName,
        api_key: validConfig.apiKey,
        api_secret: validConfig.apiSecret,
      });
    });

    it('uploads using a base64 data URI built from image.base64', async () => {
      mockCloudinaryUpload.mockResolvedValueOnce(cloudinarySuccessResult);

      const provider = createCloudinaryStorageProvider(validConfig);
      await provider.upload(validImage);

      expect(mockCloudinaryUpload).toHaveBeenCalledWith(
        `data:image/png;base64,abc123`,
        expect.objectContaining({
          folder: validConfig.folder,
          public_id: 'cover-image',
        }),
      );
    });

    it('uses image.buffer when base64 is not available', async () => {
      const testBuffer = Buffer.from('test-buffer-data');
      const imageWithBuffer: GeneratedImage = {
        fileName: 'cover-image.png',
        mimeType: 'image/png',
        buffer: testBuffer,
      };

      mockCloudinaryUpload.mockResolvedValueOnce(cloudinarySuccessResult);

      const provider = createCloudinaryStorageProvider(validConfig);
      await provider.upload(imageWithBuffer);

      const expectedBase64 = testBuffer.toString('base64');
      expect(mockCloudinaryUpload).toHaveBeenCalledWith(
        `data:image/png;base64,${expectedBase64}`,
        expect.anything(),
      );
    });

    it('strips the file extension to derive the public_id', async () => {
      mockCloudinaryUpload.mockResolvedValueOnce(cloudinarySuccessResult);

      const provider = createCloudinaryStorageProvider(validConfig);
      await provider.upload({ ...validImage, fileName: 'my-cover-image.png' });

      expect(mockCloudinaryUpload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ public_id: 'my-cover-image' }),
      );
    });

    it('returns a correctly shaped UploadedAsset', async () => {
      mockCloudinaryUpload.mockResolvedValueOnce(cloudinarySuccessResult);

      const provider = createCloudinaryStorageProvider(validConfig);
      const result = await provider.upload(validImage);

      expect(result).toEqual({
        provider: 'cloudinary',
        url: cloudinarySuccessResult.url,
        secureUrl: cloudinarySuccessResult.secure_url,
        publicId: cloudinarySuccessResult.public_id,
        width: cloudinarySuccessResult.width,
        height: cloudinarySuccessResult.height,
        format: cloudinarySuccessResult.format,
        bytes: cloudinarySuccessResult.bytes,
      });
    });

    it('propagates errors thrown by the Cloudinary SDK', async () => {
      const sdkError = new Error('Cloudinary API error: authentication failed');
      mockCloudinaryUpload.mockRejectedValueOnce(sdkError);

      const provider = createCloudinaryStorageProvider(validConfig);

      await expect(provider.upload(validImage)).rejects.toThrow(
        'Cloudinary API error: authentication failed',
      );
    });
  });
});
