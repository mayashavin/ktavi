import { afterAll, describe, expect, it } from 'vitest';
import { createCloudinaryStorageProvider } from '../../../src/providers/storage/cloudinaryStorageProvider.js';

const RUN_CLOUDINARY_INTEGRATION_TESTS = process.env.RUN_CLOUDINARY_INTEGRATION_TESTS === 'true';

const describeCloudinary = RUN_CLOUDINARY_INTEGRATION_TESTS ? describe : describe.skip;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? '';
const apiKey = process.env.CLOUDINARY_API_KEY ?? '';
const apiSecret = process.env.CLOUDINARY_API_SECRET ?? '';

const uploadedPublicIds: string[] = [];

afterAll(async () => {
  if (!RUN_CLOUDINARY_INTEGRATION_TESTS || uploadedPublicIds.length === 0) {
    return;
  }

  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  await Promise.all(
    uploadedPublicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: 'image' }),
    ),
  );
});

describeCloudinary('createCloudinaryStorageProvider integration', () => {
  it('uploads an image to Cloudinary when credentials are provided', async () => {
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Cloudinary integration test requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }

    const provider = createCloudinaryStorageProvider({
      cloudName,
      apiKey,
      apiSecret,
      folder: 'ktavi-integration-tests',
    });

    const fileName = `ktavi-cloudinary-integration-${Date.now()}.png`;

    const result = await provider.upload({
      fileName,
      mimeType: 'image/png',
      base64:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9f2foAAAAASUVORK5CYII=',
    });

    expect(result.provider).toBe('cloudinary');
    expect(result.url).toBeTruthy();
    expect(result.secureUrl).toContain('https://');
    expect(result.publicId).toBeTruthy();

    if (result.publicId) {
      uploadedPublicIds.push(result.publicId);
    }
  });
});
