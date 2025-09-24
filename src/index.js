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

  manager._doSetTitle = createWindow(content, () => {
    return !manager.back()
  })
  manager._updateTitle()
})()
