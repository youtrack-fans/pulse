import {describe, expect, it} from 'vitest';

import {collectRingTokens, pruneRingCss} from './prune-ring-css';

const used = (...names: string[]) => new Set(names);

describe('pruneRingCss', () => {
  it('keeps rules without any Ring class', () => {
    const css = ':root{--ring-unit:8px}body{margin:0}.app-card{color:red}';
    expect(pruneRingCss(css, used())).toBe(css);
  });

  it('drops a rule of a component that is not in the bundle', () => {
    const css = '.ring-select-select{color:red}.ring-button-button{color:blue}';
    expect(pruneRingCss(css, used('ring-button-button'))).toBe('.ring-button-button{color:blue}');
  });

  it('keeps a combined selector only when every Ring class is in the bundle', () => {
    const css = '.ring-button-button.ring-button-active{a:1}.ring-button-button.ring-select-open{b:2}';
    expect(pruneRingCss(css, used('ring-button-button', 'ring-button-active'))).toBe('.ring-button-button.ring-button-active{a:1}');
  });

  it('keeps a rule when one selector of its list is used', () => {
    const css = '.ring-select-a,.ring-button-button{a:1}';
    expect(pruneRingCss(css, used('ring-button-button'))).toBe(css);
  });

  it('ignores classes inside :not() because they need not exist', () => {
    const css = '.ring-button-button:not(.ring-select-open){a:1}';
    expect(pruneRingCss(css, used('ring-button-button'))).toBe(css);
  });

  it('keeps the theme and global classes without a mention in the bundle', () => {
    const css = '.ring-ui-theme-dark{--x:1}.ring-global-font{font:inherit}';
    expect(pruneRingCss(css, used())).toBe(css);
  });

  it('removes an at-rule that became empty and keeps one that still has rules', () => {
    const css = '@media (max-width:600px){.ring-select-a{a:1}}@media (max-width:900px){.ring-button-button{b:2}}';
    expect(pruneRingCss(css, used('ring-button-button'))).toBe('@media (max-width:900px){.ring-button-button{b:2}}');
  });

  it('never touches keyframes', () => {
    const css = '@keyframes ring-spin{0%{opacity:0}100%{opacity:1}}';
    expect(pruneRingCss(css, used())).toBe(css);
  });
});

describe('collectRingTokens', () => {
  it('finds Ring class names in script text', () => {
    const tokens = collectRingTokens('const a={"button":"ring-button-button","x":"ring-icon-glyph"}', 'other ring-text-text');
    expect([...tokens].sort()).toEqual(['ring-button-button', 'ring-icon-glyph', 'ring-text-text']);
  });
});
