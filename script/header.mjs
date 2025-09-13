import PackageJSON from '../package.json' with { type: 'json' }

export default `// ==UserScript==
// @name         CSense
// @namespace    CSense
// @version      ${PackageJSON.version}
// @license      AGPL-3.0
// @description  一个 CCW 安全审计工具
// @author       axolotl
// @match        https://www.ccw.site/*
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @grant        none
// @run-at       document-start
// ==/UserScript==`
