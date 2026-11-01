import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';

import {beforeAll, describe, expect, it} from 'vitest';

const DIST = join(import.meta.dirname, '..', '..', 'dist');
const ASSETS = join(DIST, 'widgets', 'assets');
const KB = 1024;

const FEED_JS_GZIP_BUDGET = 110 * KB;
const POST_PAGE_JS_GZIP_BUDGET = 37 * KB;
const CSS_GZIP_BUDGET = 17 * KB;
const ALL_ASSETS_GZIP_BUDGET = 163 * KB;
const DIST_RAW_BUDGET = 700 * KB;

interface Asset {
  name: string;
  text: string;
  raw: number;
  gzip: number;
}

function readAsset(name: string): Asset {
  const buffer = readFileSync(join(ASSETS, name));
  return {name, text: buffer.toString('utf8'), raw: buffer.length, gzip: gzipSync(buffer, {level: 9}).length};
}

function listFiles(dir: string): string[] {
  return readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

describe('bundle budget', () => {
  let assets: Asset[] = [];
  let feedJs: Asset;
  let postPageJs: Asset;

  beforeAll(() => {
    if (!existsSync(ASSETS)) {
      throw new Error('dist is missing: run npm run test:bundle, it builds first');
    }
    assets = readdirSync(ASSETS).map(readAsset);
    feedJs = assets.find(asset => /^feed-.*\.js$/.test(asset.name)) as Asset;
    postPageJs = assets.find(asset => /^post-page-.*\.js$/.test(asset.name)) as Asset;
  });

  it('ships the feed and the post page as the only two scripts', () => {
    const scripts = assets.filter(asset => asset.name.endsWith('.js')).map(asset => asset.name.replace(/-[A-Za-z0-9_-]{8}\.js$/, ''));
    expect(scripts.sort()).toEqual(['feed', 'post-page']);
  });

  it('keeps the first load script of the feed within its budget', () => {
    expect(feedJs.gzip).toBeLessThanOrEqual(FEED_JS_GZIP_BUDGET);
  });

  it('keeps the post page chunk within its budget', () => {
    expect(postPageJs.gzip).toBeLessThanOrEqual(POST_PAGE_JS_GZIP_BUDGET);
  });

  it('keeps the stylesheets within their budget', () => {
    const css = assets.filter(asset => asset.name.endsWith('.css')).reduce((sum, asset) => sum + asset.gzip, 0);
    expect(css).toBeLessThanOrEqual(CSS_GZIP_BUDGET);
  });

  it('keeps everything the page downloads within the total budget', () => {
    const total = assets.reduce((sum, asset) => sum + asset.gzip, 0);
    expect(total).toBeLessThanOrEqual(ALL_ASSETS_GZIP_BUDGET);
  });

  it('keeps the Markdown and sanitizing libraries out of the first load script', () => {
    expect(feedJs.text).not.toContain('DOMPurify');
    expect(postPageJs.text).toContain('DOMPurify');
  });

  it('keeps the virtualized list library out of every script', () => {
    expect(feedJs.text).not.toContain('WindowScroller');
    expect(postPageJs.text).not.toContain('WindowScroller');
  });

  it('ships the Ring UI styles of the components in use and not the rest of the library', () => {
    const css = assets.filter(asset => asset.name.endsWith('.css')).map(asset => asset.text).join('\n');
    expect(css).toContain('.ring-button-button');
    expect(css).toContain('.ring-ui-theme-dark');
    expect(css).not.toContain('.ring-select-');
    expect(css).not.toContain('.ring-grid-');
    expect(css).not.toContain('.ring-table-');
  });

  it('ships no source maps', () => {
    expect(listFiles(DIST).filter(file => file.endsWith('.map'))).toEqual([]);
    expect(assets.filter(asset => asset.text.includes('sourceMappingURL')).map(asset => asset.name)).toEqual([]);
  });

  it('keeps the whole package within the raw size budget', () => {
    const total = listFiles(DIST).reduce((sum, file) => sum + statSync(file).size, 0);
    expect(total).toBeLessThanOrEqual(DIST_RAW_BUDGET);
  });
});
