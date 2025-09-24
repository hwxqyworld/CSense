import PackageJSON from '../package.json' with { type: 'json' }

export default `// ==UserScript==
// @name         CSense-clear
// @namespace    CSense-clear
// @version      ${PackageJSON.version}
// @license      AGPL-3.0
// @description  无害的 CCW 安全审计工具
// @author       HelloWorld
// @match        https://www.ccw.site/*
// @icon         https://m.ccw.site/community/images/logo-ccw.png
// @grant        none
// @run-at       document-start
// ==/UserScript==`
