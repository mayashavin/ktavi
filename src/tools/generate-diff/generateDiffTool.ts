import { createPatch } from 'diff';

export function generateDiffTool(input: {
  original: string;
  updated: string;
  filename?: string;
}): { diff: string } {
  const diff = createPatch(
    input.filename ?? 'file',
    input.original,
    input.updated,
    'original',
    'updated',
  );
  return { diff };
}
