import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { analyzeDraftWorkflow } from '../../src/workflows/analyzeDraftWorkflow.js';
import type { TextAIProvider } from '../../src/core/providers.js';

const VALID_POST = path.resolve('tests/fixtures/valid-post.md');
const VALID_POST_BODY = `
# Using TanStack Query in Vue

TanStack Query brings powerful data fetching, caching, and synchronization to Vue applications.

## Why TanStack Query?

Managing loading states, errors, caching, and refetching manually can become complex. TanStack Query abstracts all of this into a simple, declarative API.

## Getting Started

First, install the package:

\`\`\`bash
npm install @tanstack/vue-query
\`\`\`

Then set up the query client in your app:

\`\`\`ts
import { VueQueryPlugin } from '@tanstack/vue-query';

app.use(VueQueryPlugin);
\`\`\`

## Fetching Data

Use the \`useQuery\` composable to fetch data:

\`\`\`ts
import { useQuery } from '@tanstack/vue-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
});
\`\`\`

## Conclusion

TanStack Query simplifies data management in Vue apps significantly. Give it a try in your next project.

Check out the [official documentation](https://tanstack.com/query) for more details.

![TanStack Query diagram](./images/query-diagram.png "Query flow diagram")
`;

function makeProvider(): TextAIProvider {
  return {
    async generateStructuredOutput() {
      return {
        shortSummary: 'A post about testing.',
        keyTopics: ['testing', 'vitest', 'TypeScript'],
        targetAudience: 'developers',
        suggestedDescription: 'Learn about testing with vitest.',
      };
    },
  };
}

describe('analyzeDraftWorkflow', () => {
  it('parses the fixture into the full BlogDraft structure without summary when no AI provider given', async () => {
    const rawContent = await fs.readFile(VALID_POST, 'utf8');
    const result = await analyzeDraftWorkflow(VALID_POST);

    expect(result.draft).toStrictEqual({
      filePath: VALID_POST,
      rawContent,
      frontmatter: {
        title: 'Using TanStack Query in Vue',
        description:
          'Learn how to simplify data fetching and caching in Vue apps with TanStack Query.',
        slug: 'tanstack-query-vue',
        tags: ['vue', 'tanstack-query', 'frontend'],
        cover: '/images/blog/tanstack-query-vue-cover.png',
        date: new Date('2025-01-15T00:00:00.000Z'),
      },
      markdownBody: VALID_POST_BODY,
      metadata: {
        title: 'Using TanStack Query in Vue',
        description:
          'Learn how to simplify data fetching and caching in Vue apps with TanStack Query.',
        slug: 'tanstack-query-vue',
        tags: ['vue', 'tanstack-query', 'frontend'],
        coverImage: '/images/blog/tanstack-query-vue-cover.png',
        headings: [
          { depth: 1, text: 'Using TanStack Query in Vue' },
          { depth: 2, text: 'Why TanStack Query?' },
          { depth: 2, text: 'Getting Started' },
          { depth: 2, text: 'Fetching Data' },
          { depth: 2, text: 'Conclusion' },
        ],
        links: [{ text: 'official documentation', url: 'https://tanstack.com/query' }],
        images: [
          {
            alt: 'TanStack Query diagram',
            url: './images/query-diagram.png',
            title: 'Query flow diagram',
          },
        ],
        wordCount: 102,
        estimatedReadingTimeMinutes: 1,
      },
    });
    expect(result.contentSummary).toBeUndefined();
  });

  it('returns draft without summary when options object has no provider', async () => {
    const result = await analyzeDraftWorkflow(VALID_POST, {});
    expect(result.draft).toBeDefined();
    expect(result.contentSummary).toBeUndefined();
  });

  it('returns content summary when AI provider is given', async () => {
    const result = await analyzeDraftWorkflow(VALID_POST, { aiProvider: makeProvider() });
    expect(result.draft).toBeDefined();
    expect(result.contentSummary).toBeDefined();
    expect(result.contentSummary!.shortSummary).toBe('A post about testing.');
    expect(result.contentSummary!.keyTopics).toEqual(['testing', 'vitest', 'TypeScript']);
    expect(result.contentSummary!.targetAudience).toBe('developers');
    expect(result.contentSummary!.suggestedDescription).toBe('Learn about testing with vitest.');
  });
});
