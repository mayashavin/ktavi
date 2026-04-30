const WORDS_PER_MINUTE = 200;

export function countWords(text: string): number {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function estimateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
