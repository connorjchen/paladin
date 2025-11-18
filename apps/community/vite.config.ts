/// <reference types='vitest' />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const prismaClientPath = require
  .resolve('@prisma/client')
  .replace(/@prisma(\/|\\)client(\/|\\).*/, '.prisma/client')

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/community',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@paladin/shared': path.resolve(
        __dirname,
        '../../libs/shared/src/index.ts'
      ),
      '.prisma/client/index-browser': path.join(
        prismaClientPath,
        'index-browser.js'
      ),
    },
  },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}))
