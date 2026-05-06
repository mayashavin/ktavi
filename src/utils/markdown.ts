import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root, Heading, Link, Image, Text, PhrasingContent, Html } from 'mdast';
import type { MarkdownHeading, MarkdownImage, MarkdownLink } from '../core/types.js';

function extractText(children: PhrasingContent[]): string {
  return children
    .map((child) => {
      if (child.type === 'text') return (child as Text).value;
      if ('children' in child) return extractText(child.children as PhrasingContent[]);
      return '';
    })
    .join('');
}

function collectNodes<T>(tree: Root, type: string): T[] {
  const nodes: T[] = [];
  function walk(node: { type: string; children?: unknown[] }) {
    if (node.type === type) {
      nodes.push(node as T);
    }
    if (node.children) {
      for (const child of node.children) {
        walk(child as { type: string; children?: unknown[] });
      }
    }
  }
  walk(tree);
  return nodes;
}

export function parseMarkdownAST(markdownBody: string): Root {
  const processor = unified().use(remarkParse);
  return processor.parse(markdownBody);
}

export function extractHeadings(tree: Root): MarkdownHeading[] {
  return collectNodes<Heading>(tree, 'heading').map((node) => ({
    depth: node.depth,
    text: extractText(node.children),
  }));
}

export function extractLinks(tree: Root): MarkdownLink[] {
  return collectNodes<Link>(tree, 'link').map((node) => ({
    text: extractText(node.children),
    url: node.url,
  }));
}

function extractHtmlImages(html: string): MarkdownImage[] {
  const results: MarkdownImage[] = [];
  const imgTagRegex = /<img([^>]*?)(?:\/>|>(?:<\/img>)?)/gi;
  let match;
  while ((match = imgTagRegex.exec(html)) !== null) {
    const attrs = match[1];
    // Support double-quoted, single-quoted, and unquoted attribute values
    const srcMatch = /\bsrc=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
    const altMatch = /\balt=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
    const titleMatch = /\btitle=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
    const url = srcMatch?.[1] ?? srcMatch?.[2] ?? srcMatch?.[3];
    if (url) {
      results.push({
        url,
        alt: altMatch ? (altMatch[1] ?? altMatch[2] ?? altMatch[3]) : undefined,
        title: titleMatch ? (titleMatch[1] ?? titleMatch[2] ?? titleMatch[3]) : undefined,
      });
    }
  }
  return results;
}

export function extractImages(tree: Root): MarkdownImage[] {
  const markdownImages = collectNodes<Image>(tree, 'image').map((node) => ({
    alt: node.alt ?? undefined,
    url: node.url,
    title: node.title ?? undefined,
  }));

  const htmlImages = collectNodes<Html>(tree, 'html').flatMap((node) =>
    extractHtmlImages(node.value),
  );

  return [...markdownImages, ...htmlImages];
}
