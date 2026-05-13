import type {
  TextAIProvider,
  ImageGenerationProvider,
  AssetStorageProvider,
} from '../core/providers.js';
import type {
  SeoSuggestion,
  WritingSuggestion,
  CoverPromptResult,
  ContentSummary,
  DraftPatch,
  WritingMode,
  ImageSize,
  CoverFieldName,
  BlogDraft,
} from '../core/types.js';
import { parseMarkdownTool } from '../tools/parse-markdown/index.js';
import { reviewSeoTool } from '../tools/review-seo/index.js';
import { reviewWritingTool } from '../tools/review-writing/index.js';
import { summarizeContentTool } from '../tools/summarize-content/index.js';
import { generateCoverPromptTool } from '../tools/generate-cover-prompt/index.js';
import { generateImageTool } from '../tools/generate-image/index.js';
import { uploadAssetTool } from '../tools/upload-asset/index.js';
import { updateFrontmatterTool } from '../tools/update-frontmatter/index.js';

export type PrepareDraftResult = {
  draft: BlogDraft;
  contentSummary?: ContentSummary;
  seoSuggestions: SeoSuggestion[];
  writingSuggestions: WritingSuggestion[];
  coverPrompt?: CoverPromptResult;
  patch?: DraftPatch;
};

export type PrepareDraftOptions = {
  mode: WritingMode;
  apply: boolean;
  generateCover: boolean;
  size: ImageSize;
  style?: string;
  coverField: CoverFieldName;
  preserveFrontmatterOrder?: boolean;
  aiProvider?: TextAIProvider;
  imageProvider?: ImageGenerationProvider;
  storageProvider?: AssetStorageProvider;
};

export async function prepareDraftWorkflow(
  filePath: string,
  options: PrepareDraftOptions,
): Promise<PrepareDraftResult> {
  const draft = await parseMarkdownTool({ filePath });

  const { suggestions: seoSuggestions } = await reviewSeoTool({ draft }, options.aiProvider);

  let contentSummary: ContentSummary | undefined;
  if (options.aiProvider) {
    contentSummary = await summarizeContentTool({ draft }, options.aiProvider);
  }

  let writingSuggestions: WritingSuggestion[] = [];
  if (options.aiProvider) {
    const result = await reviewWritingTool({ draft, mode: options.mode }, options.aiProvider);
    writingSuggestions = result.suggestions;
  }

  let coverPrompt: CoverPromptResult | undefined;
  if (options.aiProvider) {
    coverPrompt = await generateCoverPromptTool(
      { draft, style: options.style },
      options.aiProvider,
    );
  }

  let patch: DraftPatch | undefined;
  if (options.generateCover && options.imageProvider && coverPrompt) {
    const generatedImage = await generateImageTool(
      { prompt: coverPrompt, size: options.size },
      options.imageProvider,
    );

    if (options.storageProvider) {
      const uploadedAsset = await uploadAssetTool(
        { image: generatedImage },
        options.storageProvider,
      );

      const coverUrl = uploadedAsset.secureUrl ?? uploadedAsset.url;
      patch = await updateFrontmatterTool({
        draft,
        updates: { [options.coverField]: coverUrl },
        apply: options.apply,
        preserveFrontmatterOrder: options.preserveFrontmatterOrder,
      });
    }
  }

  return { draft, contentSummary, seoSuggestions, writingSuggestions, coverPrompt, patch };
}
