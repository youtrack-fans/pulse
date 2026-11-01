import {describe, expect, it} from 'vitest';
import sources from 'virtual:pulse-css';

const colors = sources['theme/colors.css'];
const dark = sources['theme/dark.css'];
const colorsShared = sources['theme/colors-shared.css'];
const sizes = sources['theme/sizes.css'];

const modules = Object.fromEntries(Object.entries(sources).filter(([file]) => file.endsWith('.module.css')));

const RING_ALLOWED = /^--ring-(unit|font-family(-monospace)?)$/;

function declared(css: string) {
  return [...css.matchAll(/^\s*(--pulse-[\w-]+)\s*:/gm)].map(match => match[1]);
}

function withoutMedia(css: string) {
  return css.replace(/@media[^{]+\{(?:[^{}]|\{[^{}]*\})*\}/g, '');
}

function usages(pattern: RegExp) {
  return Object.entries(modules).flatMap(([file, css]) => {
    const source = withoutMedia(css);
    return [...source.matchAll(pattern)].map(match => `${file}: ${match[0].trim()}`);
  });
}

describe('theme contract', () => {
  const defined = new Set([...declared(colors), ...declared(dark), ...declared(colorsShared), ...declared(sizes)]);

  it('keeps colors and dark colors in step', () => {
    const light = declared(colors);
    const darkTokens = declared(dark);

    expect(light.filter(token => !darkTokens.includes(token))).toEqual([]);
    expect(darkTokens.filter(token => !light.includes(token))).toEqual([]);
  });

  it('defines every token a module uses', () => {
    const used = Object.values(modules).flatMap(css => [...css.matchAll(/var\((--pulse-[\w-]+)/g)].map(match => match[1]));

    expect([...new Set(used)].filter(token => !defined.has(token))).toEqual([]);
  });

  it('keeps raw colors out of modules', () => {
    const raw = Object.entries(modules).flatMap(([file, css]) =>
      css
        .split('\n')
        .filter(line => /#[0-9a-fA-F]{3,8}\b|\brgba?\(/.test(line) && !line.includes('mask-image'))
        .map(line => `${file}: ${line.trim()}`)
    );

    expect(raw).toEqual([]);
  });

  it('reads Ring colors only through the theme aliases', () => {
    const ring = Object.entries(modules).flatMap(([file, css]) =>
      [...css.matchAll(/var\((--ring-[\w-]+)/g)]
        .filter(match => !RING_ALLOWED.test(match[1]))
        .map(match => `${file}: ${match[1]}`)
    );

    expect(ring).toEqual([]);
  });

  it('takes font size, line height and radius from the scale', () => {
    const literal = usages(/\b(font-size|line-height|border-radius):(?!\s*(?:var\(--pulse-|inherit|0\s*;|0\s+var|[\d.]+em\s*;))[^;]+;/g);

    expect(literal).toEqual([]);
  });
});
