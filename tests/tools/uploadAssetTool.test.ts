import { describe, it, expect, vi } from 'vitest';
import { uploadAssetTool } from '../../src/tools/upload-asset/uploadAssetTool.js';
import type { AssetStorageProvider } from '../../src/core/providers.js';
import type { GeneratedImage, UploadedAsset } from '../../src/core/types.js';

describe('uploadAssetTool', () => {
  it('delegates upload to storage provider with the generated image', async () => {
    const image: GeneratedImage = {
      fileName: 'cover-image',
      mimeType: 'image/png',
      base64: 'abc123',
    };

    const uploadedAsset: UploadedAsset = {
      provider: 'local',
      url: '/images/blog/cover-image.png',
      localPath: '/tmp/ktavi-test/cover-image.png',
    };

    const upload = vi.fn(async () => uploadedAsset);
    const storageProvider: AssetStorageProvider = { upload };

    const result = await uploadAssetTool({ image }, storageProvider);

    expect(upload).toHaveBeenCalledOnce();
    expect(upload.mock.calls[0][0]).toBe(image);
    expect(result).toBe(uploadedAsset);
  });
});
