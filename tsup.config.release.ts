import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'csense',
  target: ['esnext'],
  outDir: 'dist',
  loader: {
    '.svg': 'dataurl',
    '.pem': 'text'
  },
  platform: 'browser',
  format: 'iife',
  minify: true,
  clean: true
})
