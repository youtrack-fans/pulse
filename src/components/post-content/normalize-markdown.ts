import {replaceEmojiShortcodes} from '../../lib/emoji';

const FENCED_CODE = /(```[\s\S]*?```)/;
const INLINE_CODE = /(`[^`\n]+`)/;
const BOLD_CODE = /\*\*`([^`\n]*)`\*\*/g;
const PLAIN_CODE = /`([^`\n]*)`/g;
const CODE_SYMBOLS = /[{}[\]<>=;_*/\\|$#@~^+]|--/;
const TRAILING_PUNCTUATION = /[.,:;!?)\]]/;
const PAIR = 2;
const PROSE_MIN_WORDS = 5;
const BOLD_MIN_WORDS = 2;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isProse(text: string, inBold: boolean): boolean {
  if (!text.trim()) {
    return true;
  }
  if (CODE_SYMBOLS.test(text)) {
    return false;
  }
  const words = wordCount(text);
  return words >= PROSE_MIN_WORDS || text.trim().endsWith(':') || (inBold && words >= BOLD_MIN_WORDS);
}

function unwrapBoldCode(match: string, text: string, offset: number, whole: string): string {
  if (!isProse(text, true)) {
    return match;
  }
  if (!text.trim()) {
    return ' ';
  }
  const next = whole.charAt(offset + match.length);
  return ` **${text.trim()}**${TRAILING_PUNCTUATION.test(next) ? '' : ' '}`;
}

function unwrapProseCode(markdown: string): string {
  return markdown
    .replace(BOLD_CODE, unwrapBoldCode)
    .replace(PLAIN_CODE, (match, text: string) => (isProse(text, false) ? text : match));
}

function replaceOutsideInlineCode(markdown: string): string {
  return markdown
    .split(INLINE_CODE)
    .map((part, index) => (index % PAIR === 0 ? replaceEmojiShortcodes(part) : part))
    .join('');
}

export function normalizeMarkdown(markdown: string): string {
  return markdown
    .split(FENCED_CODE)
    .map((part, index) => (index % PAIR === 0 ? replaceOutsideInlineCode(unwrapProseCode(part)) : part))
    .join('');
}
