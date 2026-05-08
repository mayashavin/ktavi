import fs from 'node:fs/promises';
import path from 'node:path';
import { KtaviError } from '../core/errors.js';

export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    throw new KtaviError(`Could not read file: ${filePath}`, 'FILE_NOT_FOUND', err);
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (err) {
    throw new KtaviError(`Could not write file: ${filePath}`, 'WRITE_FAILED', err);
  }
}

export async function writeBuffer(filePath: string, buffer: Buffer): Promise<void> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
  } catch (err) {
    throw new KtaviError(`Could not write file: ${filePath}`, 'WRITE_FAILED', err);
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore errors if the file doesn't exist or can't be deleted
  }
}
