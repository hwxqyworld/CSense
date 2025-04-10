/**
 * @template T
 * @template {keyof T} Key
 * @param {T} obj
 * @param {Key} p
 * @param {(fn: T[Key]) => T[Key]} fn
 */
export function patch(obj, p, fn) {
  if (obj[p]) obj[p] = fn(obj[p])
}

export function addStyle(css) {
  if (css instanceof URL) {
    const style = document.createElement('link')
    style.rel = 'stylesheet'
    style.href = css.toString()
    document.documentElement.appendChild(style)
  } else {
    const style = document.createElement('style')
    style.textContent = css
    document.documentElement.appendChild(style)
  }
}

function trap(callback) {
  patch(Function.prototype, 'bind', _bind => {
    return function (self2, ...args) {
      if (
        typeof self2 === 'object' &&
        self2 !== null &&
        Object.prototype.hasOwnProperty.call(self2, 'editingTarget') &&
        Object.prototype.hasOwnProperty.call(self2, 'runtime')
      ) {
        Function.prototype.bind = _bind
        callback(self2)
        return _bind.call(this, self2, ...args)
      }
      return _bind.call(this, self2, ...args)
    }
  })
}

export const vm = globalThis.__CSense_vm_trap ?? new Promise(trap)
delete globalThis.__CSense_vm_trap

function patchXHR(callback) {
  const _XMLHttpRequest = window.XMLHttpRequest
  window.XMLHttpRequest = new Proxy(_XMLHttpRequest, {
    construct(target, args) {
      const xhr = new target(...args)
      let request = null
      patch(xhr, 'open', _open => {
        return function (method, url) {
          if (url === 'https://community-web.ccw.site/base/dateTime') {
            return _open.call(
              this,
              method,
              `data:application/json,{"body": ${Date.now()}, "code": "200", "msg": null, "status": 200}`
            )
          }
          if (url === 'https://community-web.ccw.site/project/v') {
            return _open.call(
              this,
              method,
              'data:application/json,{"body": true, "code": "200", "msg": null, "status": 200}'
            )
          }
          if (url.startsWith('https://mustang.xiguacity.cn/')) {
            return _open.call(this, method, 'data:application/json,{}')
          }
          return _open.call(this, method, url)
        }
      })
      patch(xhr, 'send', _send => {
        return function (data) {
          request = data
          return _send.call(this, data)
        }
      })
      xhr.addEventListener('load', () => {
        if (xhr.responseType === '' || xhr.responseType === 'text') {
          callback({
            url: xhr.responseURL,
            type: xhr.responseType,
            data: xhr.responseText,
            request
          })
        }
      })
      return xhr
    }
  })
}

export const XHR = new EventTarget()
patchXHR(v => {
  XHR.dispatchEvent(new CustomEvent('load', { detail: v }))
})
