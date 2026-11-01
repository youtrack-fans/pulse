import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react';
import {pruneUnusedRingCss} from './tools/vite/prune-ring-css';
import {youtrackAutoUpload, youtrackDevHtml, backendReloadPlugin} from '@jetbrains/youtrack-apps-tools/dx';

const isServing = process.argv.includes('--mode') === false && !process.argv.includes('build');

export default defineConfig({
  optimizeDeps: {
    exclude: ['@jetbrains/youtrack-apps-tools']
  },
  ssr: {
    noExternal: [],
    external: ['@jetbrains/youtrack-apps-tools']
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {target: '19'}]],
      },
    }),
    pruneUnusedRingCss(),
    ...(isServing ? [backendReloadPlugin()] : []),
    youtrackDevHtml({enabled: process.env.DEV_MODE === 'true', devServerPort: 9000}),
    youtrackAutoUpload({enabled: process.env.AUTOUPLOAD === 'true', buildName: 'frontend'}),
    viteStaticCopy({
      targets: [
        {
          src: '../manifest.json',
          dest: '.'
        },
        {
          src: '*.json',
          dest: '.'
        },
        {
          src: 'icons/*.svg',
          dest: 'icons'
        },
        {
          src: '../public/*.*',
          dest: '.',
          errorOnEmpty: false
        }
      ]
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'widgets/**/*.{svg,png,jpg,json}',
          dest: '.'
        }
      ],
      structured: true
    })
  ],
  root: './src',
  base: '',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: false,
    copyPublicDir: false,
    target: ['es2022'],
    assetsDir: 'widgets/assets',
    rollupOptions: {
      input: {
        feed: resolve(__dirname, 'src/widgets/feed/index.html'),
      }
    }
  }
});
