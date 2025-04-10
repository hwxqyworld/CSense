import { defineConfig } from 'tsup'
import { version } from './package.json'

export default defineConfig({
  name: 'csense',
  target: ['esnext'],
  outDir: 'dist',
  banner: {
    js: `// ==UserScript==
// @name         CSense
// @namespace    CSense
// @version      ${version}
// @license      CC0-1.0
// @downloadURL  https://axolotltfgs.github.io/CSense/csense.js
// @updateURL    https://axolotltfgs.github.io/CSense/csense.js
// @description  一个 CCW 安全审计工具
// @author       axolotl
// @match        https://www.ccw.site/*
// @iconURL      https://m.ccw.site/community/images/logo-ccw.png
// @grant        none
// @run-at       document-start
// ==/UserScript==
`
  },
  loader: {
    '.svg': 'dataurl'
  },
  platform: 'browser',
  format: 'iife',
  clean: true
})
