import {defineConfig} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import {
  youtrackApiGenerator,
  youtrackRouter,
  youtrackExtensionProperties,
  youtrackAppSettings,
  youtrackAutoUpload
} from '@jetbrains/youtrack-apps-tools/dx';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@jetbrains/youtrack-apps-tools']
  },
  ssr: {
    noExternal: [],
    external: ['@jetbrains/youtrack-apps-tools']
  },
  plugins: [
    tsconfigPaths(),
    youtrackAppSettings(),
    youtrackApiGenerator(),
    youtrackRouter(),
    youtrackExtensionProperties(),
    youtrackAutoUpload({enabled: process.env.AUTOUPLOAD === 'true', buildName: 'backend'})
  ],
  build: {
    outDir: './dist',
    emptyOutDir: !process.argv.includes('--watch'),
    minify: false,
    lib: {
      entry: [],
      name: 'router',
      fileName: 'router',
      formats: ['cjs']
    },
    rollupOptions: {
      external: [
        /^@jetbrains\/youtrack-scripting-api\//,
        /^node:/,
        'child_process',
        'fs-extra',
        'fast-glob',
        'ts-morph',
        'path',
        'fs',
        'os',
        'stream',
        'util',
        'assert',
        'constants',
        'events',
        'perf_hooks'
      ],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        manualChunks: (id) => {
          if (id.includes('/backend/router/')) {
            return null;
          }

          const backendMatch = id.match(/\/backend\/([^/]+)\//);
          if (backendMatch) {
            return `backend-${backendMatch[1]}`;
          }

          return null;
        }
      }
    }
  }
});
