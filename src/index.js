import { addStyle } from './util/inject'
import { SceneManager } from './base/scene'
import { IdentityWarningOverlay } from './overlay/identity'
import { HomeScene } from './scene/home'
import { createWindow } from './util/window'
import globalState from './base/state'
import { version as VERSION } from '../package.json'
import { getCookie, setCookie } from './util/cookie'
import { verify } from './util/encryption'
;(() => {
  const userId = getCookie('cookie-user-id')
  if (!userId) {
    return
  }
  const token = getCookie('csense-token')
  if (!token) {
    const newToken = prompt(
      '请输入您的 CSense 使用密钥。\n如果您没有密钥，请向 CSense 开发者申请。\n\n在输入密钥前，CSense 将不会运行。'
    )
    if (!newToken) {
      return
    }
    setCookie('csense-token', newToken)
    location.reload()
    return
  }
  if (!verify(String(userId), token)) {
    alert(
      '此 CSense 授权不属于您当前登录的账户。请输入匹配当前账户的授权密钥。'
    )
    setCookie('csense-token', '')
    location.reload()
    return
  }
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
