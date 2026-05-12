import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createLocalStorageProvider } from '../../../src/providers/storage/localStorageProvider.js';
import type { GeneratedImage } from '../../../src/core/types.js';
import { KtaviError } from '../../../src/core/errors.js';

describe('createLocalStorageProvider', () => {
  let tmpDir: string;

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  async function makeTmpDir(): Promise<string> {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ktavi-local-storage-'));
    return tmpDir;
  }

  it('saves image from buffer and writes correct file contents', async () => {
    const dir = await makeTmpDir();
    const provider = createLocalStorageProvider(dir, '/images');
    const content = Buffer.from('fake-png-data');
    const image: GeneratedImage = {
      fileName: 'hero.png',
      mimeType: 'image/png',
      buffer: content,
    };

    await provider.upload(image);

    const written = await fs.readFile(path.join(dir, 'hero.png'));
    expect(written).toEqual(content);
  });

  it('saves image from base64 when buffer is not provided', async () => {
    const dir = await makeTmpDir();
    const provider = createLocalStorageProvider(dir, '/images');
    const content = Buffer.from('base64-image-data');
    const image: GeneratedImage = {
      fileName: 'cover.png',
      mimeType: 'image/png',
      base64: content.toString('base64'),
    };

    await provider.upload(image);

    const written = await fs.readFile(path.join(dir, 'cover.png'));
    expect(written).toEqual(content);
  });

  it('prefers buffer over base64 when both are provided', async () => {
    const dir = await makeTmpDir();
    const provider = createLocalStorageProvider(dir, '/images');
    const bufferContent = Buffer.from('from-buffer');
    const image: GeneratedImage = {
      fileName: 'test.png',
      mimeType: 'image/png',
      buffer: bufferContent,
      base64: Buffer.from('from-base64').toString('base64'),
    };

    await provider.upload(image);

    const written = await fs.readFile(path.join(dir, 'test.png'));
    expect(written).toEqual(bufferContent);
  });

  it('returns url matching publicPathPrefix + filename', async () => {
    const dir = await makeTmpDir();
    const provider = createLocalStorageProvider(dir, '/assets/blog');
    const image: GeneratedImage = {
      fileName: 'my-post-cover.png',
      mimeType: 'image/png',
      buffer: Buffer.from('data'),
    };

    const result = await provider.upload(image);

    expect(result.url).toBe('/assets/blog/my-post-cover.png');
  });

  it('returns correct localPath', async () => {
    const dir = await makeTmpDir();
    const provider = createLocalStorageProvider(dir, '/images');
    const image: GeneratedImage = {
      fileName: 'photo.png',
      mimeType: 'image/png',
      buffer: Buffer.from('data'),
    };

    const result = await provider.upload(image);

    expect(result.localPath).toBe(path.join(dir, 'photo.png'));
  });

  it('returns correct byte count', async () => {
    const dir = await makeTmpDir();
    const provider = createLocalStorageProvider(dir, '/images');
    const content = Buffer.from('exactly-this-many-bytes');
    const image: GeneratedImage = {
      fileName: 'sized.png',
      mimeType: 'image/png',
      buffer: content,
    };

    const result = await provider.upload(image);

    expect(result.bytes).toBe(content.length);
  });

  it('returns provider as local', async () => {
    const dir = await makeTmpDir();
    const provider = createLocalStorageProvider(dir, '/images');
    const image: GeneratedImage = {
      fileName: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from('data'),
    };

    const result = await provider.upload(image);

    expect(result.provider).toBe('local');
  });

  it('creates missing parent directories', async () => {
    const dir = await makeTmpDir();
    const nestedDir = path.join(dir, 'deep', 'nested', 'dir');
    const provider = createLocalStorageProvider(nestedDir, '/images');
    const image: GeneratedImage = {
      fileName: 'nested.png',
      mimeType: 'image/png',
      buffer: Buffer.from('nested-data'),
    };

    const result = await provider.upload(image);

    const written = await fs.readFile(path.join(nestedDir, 'nested.png'));
    expect(written).toEqual(Buffer.from('nested-data'));
    expect(result.localPath).toBe(path.join(nestedDir, 'nested.png'));
  });

  it('throws KtaviError when image has no buffer or base64', async () => {
    const dir = await makeTmpDir();
    const provider = createLocalStorageProvider(dir, '/images');
    const image: GeneratedImage = {
      fileName: 'empty.png',
      mimeType: 'image/png',
    };

    let error: unknown;
    try {
      await provider.upload(image);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(KtaviError);
    expect((error as KtaviError).code).toBe('WRITE_FAILED');
    expect((error as KtaviError).message).toMatch(/no buffer or base64/i);
  });

  it('throws KtaviError with WRITE_FAILED when filesystem write fails', async () => {
    const dir = await makeTmpDir();
    const blockingFile = path.join(dir, 'not-a-dir');
    await fs.writeFile(blockingFile, 'block');
    // outputDir points to a path nested under a file, so mkdir will fail
    const provider = createLocalStorageProvider(path.join(blockingFile, 'sub'), '/images');
    const image: GeneratedImage = {
      fileName: 'fail.png',
      mimeType: 'image/png',
      buffer: Buffer.from('data'),
    };

    let error: unknown;
    try {
      await provider.upload(image);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(KtaviError);
    expect((error as KtaviError).code).toBe('WRITE_FAILED');
    expect((error as KtaviError).message).toMatch(/Could not write file/i);
  });

  it('normalizes filename by stripping original extension and using .png', async () => {
    const dir = await makeTmpDir();
    const provider = createLocalStorageProvider(dir, '/images');
    const image: GeneratedImage = {
      fileName: 'photo.jpg',
      mimeType: 'image/png',
      buffer: Buffer.from('data'),
    };

    const result = await provider.upload(image);

    expect(result.url).toBe('/images/photo.png');
    expect(result.localPath).toBe(path.join(dir, 'photo.png'));
    const exists = await fs.stat(path.join(dir, 'photo.png'));
    expect(exists.isFile()).toBe(true);
  });
});
