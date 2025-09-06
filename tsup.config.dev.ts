import { defineConfig } from 'tsup'
import header from './script/header.mjs'

export default defineConfig({
  name: 'csense',
  target: ['esnext'],
  outDir: 'dist',
  banner: {
    js: header
  },
  loader: {
    '.svg': 'dataurl',
    '.pem': 'text'
  },
  platform: 'browser',
  format: 'iife',
  clean: true
})
