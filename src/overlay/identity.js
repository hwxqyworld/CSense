import globalState from '../base/state'
import { XHR } from 'src/util/inject'

export class IdentityWarningOverlay {
  constructor(manager) {
    this.manager = manager
    this.showOverlay = false
    const selfCallback = e => {
      if (e.detail.url.endsWith('/students/self/detail')) {
        const json = JSON.parse(e.detail.data)
        if (json.body) {
          const { body } = json
          globalState.myInfo = body
          if (body.identitiyAuthRank === 'L2') {
            this.showOverlay = true
            globalState.isIdentified = true
            manager.requestUpdate()
          }
          XHR.removeEventListener('load', selfCallback)
        }
      }
    }
    XHR.addEventListener('load', selfCallback)
  }
  render() {
    const target = this.manager.target
    if (this.showOverlay) {
      const warningDiv = document.createElement('div')
      warningDiv.style.cursor = 'pointer'
      warningDiv.textContent = '账户已实名认证'
      warningDiv.title =
        '为防止您的行为遭到追踪，请登出账户或切换到未实名认证的账户。您可以点击此处立刻登出。'
      warningDiv.style.width = '100%'
      warningDiv.style.backgroundColor = 'yellow'
      warningDiv.style.color = 'black'
      warningDiv.style.textAlign = 'center'
      warningDiv.style.padding = '5px'
      warningDiv.style.fontSize = '12px'
      warningDiv.style.boxSizing = 'border-box'
      warningDiv.addEventListener('click', async () => {
        await fetch('https://sso.ccw.site/web/auth/logout', {
          headers: {
            'content-type': 'application/json'
          },
          body: '{}',
          method: 'POST',
          mode: 'cors',
          credentials: 'include'
        })
        document.cookie =
          'cookie-user-id=;domain=.ccw.site;path=/;max-age=-999999'
        window.location.reload()
      })
      target.appendChild(warningDiv)
    }
  }
  dispose() {}
}
