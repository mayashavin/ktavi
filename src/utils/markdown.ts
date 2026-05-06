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

function extractHtmlAttr(attrs: string, attrName: string): string | undefined {
  const match = new RegExp(`\\b${attrName}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(attrs);
  return match ? (match[1] ?? match[2] ?? match[3]) : undefined;
}

function extractHtmlImages(html: string): MarkdownImage[] {
  const results: MarkdownImage[] = [];
  // remark-parse emits `html` nodes as single-line blocks, so [^>]*? is safe here.
  // Note: attribute values containing literal `>` (e.g. alt="a > b") are not supported.
  const imgTagRegex = /<img([^>]*?)(?:\/>|>(?:<\/img>)?)/gi;
  let match;
  while ((match = imgTagRegex.exec(html)) !== null) {
    const attrs = match[1];
    const url = extractHtmlAttr(attrs, 'src');
    if (url) {
      results.push({
        url,
        alt: extractHtmlAttr(attrs, 'alt'),
        title: extractHtmlAttr(attrs, 'title'),
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
