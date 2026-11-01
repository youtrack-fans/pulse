import {readdirSync, readFileSync} from 'node:fs';
import {join, relative} from 'node:path';

import react from '@vitejs/plugin-react';
import {defineConfig} from 'vitest/config';

const SOURCE_ROOT = join(import.meta.dirname, 'src');
const VIRTUAL_ID = 'virtual:pulse-css';

function collectCss(dir: string): Record<string, string> {
  return Object.fromEntries(
    readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        return Object.entries(collectCss(path));
      }
      return entry.name.endsWith('.css') ? [[relative(SOURCE_ROOT, path), readFileSync(path, 'utf8')]] : [];
    })
  );
}

export default defineConfig({
  plugins: [
    {
      name: 'pulse-css-source',
      resolveId: id => (id === VIRTUAL_ID ? `\0${VIRTUAL_ID}` : null),
      load: id => (id === `\0${VIRTUAL_ID}` ? `export default ${JSON.stringify(collectCss(SOURCE_ROOT))};` : null),
    },
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {target: '19'}]],
      },
    }),
  ],
  test: {
    server: {
      deps: {
        inline: [/@jetbrains\/ring-ui-built/],
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts', 'tools/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'bundle',
          environment: 'node',
          include: ['src/**/*.spec.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['src/test/dom-setup.ts'],
        },
      },
    ],
  },
});
