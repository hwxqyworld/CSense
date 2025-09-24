import { addStyle } from './util/inject'
import { SceneManager } from './base/scene'
import { IdentityWarningOverlay } from './overlay/identity'
import { HomeScene } from './scene/home'
import { createWindow } from './util/window'
import globalState from './base/state'
import { version as VERSION } from '../package.json'
;(() => {
  addStyle(`
  .csense-window input, textarea !important {
    font-family: unset;
  }
`)
  const content = document.createElement('div')
  const manager = new SceneManager(content)
  manager.addOverlay(new IdentityWarningOverlay(manager))
  manager.open(new HomeScene(manager))
  const win = createWindow(content, () => {
    return !manager.back()
  })
  manager._doSetTitle = win.setTitle
  globalState.button = win.button
  manager._updateTitle()
  globalThis.manager = manager
  // Anti-detection designed for "some" tricky projects
  const querySelectorAll = Document.prototype.querySelectorAll
  Document.prototype.querySelectorAll = asNativeFunc(function (selectors) {
    if (this !== document) {
      return querySelectorAll.call(this, selectors)
    }
    const elements = Array.from(querySelectorAll.call(this, selectors))
    const result = elements.filter(
      el => !(el === win.button || el === win.window)
    )
    return Object.assign(result, {
      item(nth) {
        return result[nth]
      }
    })
  })
})()
