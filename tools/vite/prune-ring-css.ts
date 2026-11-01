import postcss from 'postcss';
import type {Plugin} from 'vite';

const RING_CLASS = /\.(ring-[A-Za-z0-9_-]+)/g;
const RING_TOKEN = /ring-[A-Za-z0-9_-]+/g;
const ALWAYS_KEPT_PREFIXES = ['ring-ui-theme', 'ring-global'];

function ringClassesOf(selector: string): string[] {
  const positive = selector.replace(/:not\([^)]*\)/g, '');
  return [...positive.matchAll(RING_CLASS)].map(match => match[1]);
}

function isUsed(ringClass: string, used: ReadonlySet<string>): boolean {
  return used.has(ringClass) || ALWAYS_KEPT_PREFIXES.some(prefix => ringClass.startsWith(prefix));
}

export function collectRingTokens(...sources: readonly string[]): Set<string> {
  return new Set(sources.flatMap(source => source.match(RING_TOKEN) ?? []));
}

export function pruneRingCss(css: string, used: ReadonlySet<string>): string {
  const root = postcss.parse(css);
  root.walkRules(rule => {
    const parent = rule.parent;
    if (parent && parent.type === 'atrule' && 'name' in parent && /keyframes$/.test(String(parent.name))) {
      return;
    }
    const keep = rule.selectors.some(selector => ringClassesOf(selector).every(ringClass => isUsed(ringClass, used)));
    if (!keep) {
      rule.remove();
    }
  });
  root.walkAtRules(atRule => {
    if (atRule.nodes && atRule.nodes.length === 0) {
      atRule.remove();
    }
  });
  return root.toString();
}

export function pruneUnusedRingCss(): Plugin {
  return {
    name: 'prune-unused-ring-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const scripts = Object.values(bundle).flatMap(item => (item.type === 'chunk' ? [item.code] : []));
      const used = collectRingTokens(...scripts);
      Object.values(bundle).forEach(item => {
        if (item.type === 'asset' && item.fileName.endsWith('.css') && typeof item.source === 'string') {
          item.source = pruneRingCss(item.source, used);
        }
      });
    },
  };
}
