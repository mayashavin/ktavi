import { z } from 'zod';

export const seoSuggestionSchema = z.object({
  field: z.enum(['title', 'description', 'slug', 'tags', 'headings', 'cover', 'content', 'images']),
  severity: z.enum(['info', 'warning', 'critical']),
  current: z.union([z.string(), z.array(z.string())]).optional(),
  suggested: z.union([z.string(), z.array(z.string())]).optional(),
  reason: z.string(),
  source: z.enum(['deterministic', 'ai']),
});

export const writingSuggestionSchema = z.object({
  original: z.string(),
  suggestion: z.string(),
  reason: z.string(),
  category: z.enum(['grammar', 'clarity', 'tone', 'structure', 'diction']),
  confidence: z.number().min(0).max(1),
});

export const coverPromptResultSchema = z.object({
  visualConcept: z.string(),
  prompt: z.string(),
  altText: z.string(),
  suggestedFilename: z.string(),
});

export const aiSeoResponseSchema = z.object({
  suggestions: z.array(seoSuggestionSchema),
});

export const aiWritingResponseSchema = z.object({
  suggestions: z.array(writingSuggestionSchema),
});
