import DOMPurify from 'dompurify';
import {Marked} from 'marked';

import {hasLoadedBefore, readImageSize} from '../../lib/image-loading';
import {normalizeMarkdown} from './normalize-markdown';

import smoothImageStyles from '../smooth-image/smooth-image.module.css';
import styles from './post-content.module.css';

export interface RenderedPostContent {
  html: string;
}

function stripLeadingTitle(markdown: string): string {
  return markdown.replace(/^\s*#\s+[^\n]+\n*/, '');
}

function splitBoldAcrossParagraphs(markdown: string): string {
  const closed: string[] = [];
  const masked = markdown.replace(/\*\*[^\n]+?\*\*/g, match => {
    closed.push(match);
    return `\uE000${closed.length - 1}\uE000`;
  });
  const split = masked.replace(/\*\*([^*]*?\n[ \t]*\n[^*]*?)\*\*/g, (_match, text: string) =>
    text.split('\n').map(line => (line.trim() ? `**${line.trim()}**` : line)).join('\n'));
  return split.replace(/\uE000(\d+)\uE000/g, (_match, index: string) => closed[Number(index)]);
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .trim();
}

function createHeadingId(title: string, usedIds: Set<string>): string {
  const normalized = title
    .toLowerCase()
    .replace(/&[a-z]+;/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  const baseId = normalized || 'section';

  let id = baseId;
  let index = 1;
  while (usedIds.has(id)) {
    index += 1;
    id = `${baseId}-${index}`;
  }
  usedIds.add(id);
  return id;
}

let sanitizerReady = false;
let linkContextPath = '';

function underContextPath(href: string): string {
  if (!href.startsWith('/') || href.startsWith('//') || !linkContextPath) {
    return href;
  }
  if (href === linkContextPath || href.startsWith(`${linkContextPath}/`)) {
    return href;
  }
  return `${linkContextPath}${href}`;
}

function setupSanitizer(): void {
  if (sanitizerReady) {
    return;
  }
  sanitizerReady = true;
  DOMPurify.addHook('afterSanitizeAttributes', node => {
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') ?? '';
      node.setAttribute('loading', hasLoadedBefore(src) ? 'eager' : 'lazy');
      node.setAttribute('decoding', 'async');
      node.setAttribute('class', smoothImageStyles.image);
      const size = readImageSize(src);
      if (size) {
        node.setAttribute('width', size.width);
        node.setAttribute('height', size.height);
      }
      if (!node.parentElement?.classList.contains(smoothImageStyles.frame)) {
        const frame = node.ownerDocument.createElement('span');
        frame.className = `${smoothImageStyles.frame} ${styles.figure}`;
        node.replaceWith(frame);
        frame.append(node);
      }
      return;
    }
    if (node.tagName !== 'A') {
      return;
    }
    const href = node.getAttribute('href') ?? '';
    if (href.startsWith('#')) {
      node.removeAttribute('target');
      node.removeAttribute('rel');
    } else {
      node.setAttribute('href', underContextPath(href));
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

export function renderPostContent(content: string, contextPath: string): RenderedPostContent {
  setupSanitizer();
  linkContextPath = contextPath;
  const markdown = splitBoldAcrossParagraphs(normalizeMarkdown(stripLeadingTitle(content)));
  const usedIds = new Set<string>();

  const marked = new Marked({
    gfm: true,
    breaks: true,
    renderer: {
      heading({tokens, depth, text}) {
        const title = stripInlineMarkdown(text);
        const id = createHeadingId(title, usedIds);
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
    },
  });

  const html = DOMPurify.sanitize(marked.parse(markdown, {async: false}), {ADD_ATTR: ['target']});
  return {html};
}
