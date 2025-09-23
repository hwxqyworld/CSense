import globalState from '../base/state'
import { XHR, vm, patch } from 'src/util/inject'
import { ProjectScene } from './project'
import { AchievementScene } from './achievement'
import { EconomyScene } from './economy'
import { MMOScene } from './mmo'
import { ScriptScene } from './script'
import { AboutScene } from './about'
import { CCWDataScene } from './ccwdata'
import { createScrollable } from 'src/util/window'
import LOGO_IMG from 'src/asset/logo.svg'
import { version as VERSION } from '../../package.json'
import { getExtensionInfo } from 'src/sandbox'
import { Monaco } from 'src/base/monaco'
import { ExtensionOverlay } from 'src/overlay/extension'
import { vm as SecureVM } from 'secure-vm'
import withResolvers from 'src/util/withResolvers'

export class HomeScene {
  static title = '主页'
  /**
   * @param {Set<[string, Function]>} featureList
   * @param {string[]} order
   */
  static orderBy(featureList, order) {
    return Array.from(featureList.entries()).sort((a, b) => {
      return order.indexOf(a[0]) - order.indexOf(b[0])
    })
  }
  /**
   *
   * @param {import('../base/scene').SceneManager} manager
   */
  constructor(manager) {
    globalState.userInfo = null
    const selfCallback = e => {
      if (e.detail.url.endsWith('/students/self/detail')) {
        const json = JSON.parse(e.detail.data)
        if (json.body) {
          const { body } = json
          if (!this.isProfilePage) {
            globalState.userInfo = {
              userId: body.studentNumber,
              userName: body.name,
              uuid: body.oid,
              oid: body.oid,
              avatar: body.avatar,
              constellation: -1,
              following: 0,
              followers: 0,
              liked: 0,
              gender: ['MALE', 'FEMALE'].indexOf(body.gender),
              pendant: '',
              reputationScore: body.reputationScore
            }
            manager.requestUpdate()
          }
          XHR.removeEventListener('load', selfCallback)
        }
      }
    }
    XHR.addEventListener('load', selfCallback)
    if (window.location.pathname.startsWith('/student/')) {
      this.isProfilePage = true
      const callback = e => {
        if (e.detail.url.endsWith('/students/profile')) {
          const json = JSON.parse(e.detail.data)
          if (json.body) {
            const { body } = json
            globalState.userInfo = {
              userId: body.studentNumber,
              userName: body.name,
              uuid: body.studentOid,
              oid: body.studentOid,
              avatar: body.avatar,
              constellation: -1,
              following: 0,
              followers: 0,
              liked: 0,
              gender: ['MALE', 'FEMALE'].indexOf(body.gender),
              pendant: '',
              reputationScore: body.reputationScore
            }
            manager.requestUpdate()
            XHR.removeEventListener('load', callback)
          }
        }
      }
      XHR.addEventListener('load', callback)
    } else {
      this.isProfilePage = false
      vm.then(vm => {
        globalState.vm = vm
        patch(vm, 'loadProject', loadProject => {
          return async input => {
            /** @type {import('jszip')} */
            const JSZip = vm.exports.JSZip
            this.featureList.set('📝 作品数据', () =>
              this.manager.open(new ProjectScene(this.manager, JSZip, input))
            )
            this.manager.requestUpdate()
            let projectZip = null
            let projectJson = null
            if (
              typeof input === 'string' ||
              (typeof input === 'object' &&
                !(input instanceof ArrayBuffer) &&
                !(input instanceof Uint8Array))
            ) {
              projectZip = new JSZip()
              projectZip.file('project.json', input)
              projectJson =
                typeof input === 'string' ? JSON.parse(input) : input
            } else {
              projectZip = await JSZip.loadAsync(input)
              const file = projectZip.file('project.json')
              if (file) {
                const content = await file.async('string')
                projectJson = JSON.parse(content)
              }
            }
            if (projectJson.extensions.length > 0) {
              // Detected extensions.
              /** @type {PromiseWithResolvers<import('jszip')>} */
              const resolver = withResolvers()
              this.manager.addOverlay(
                new ExtensionOverlay(
                  this.manager,
                  projectZip,
                  projectJson,
                  resolver
                )
              )
              input = await (
                await resolver.promise
              ).generateAsync({
                type: 'arraybuffer'
              })
            }
            return loadProject.call(vm, input)
          }
        })
        // Account Hack
        const patchCCWAPI = ccwAPI => {
          const _getUserInfo = ccwAPI.getUserInfo
          ccwAPI.getUserInfo = async function () {
            if (globalState.userInfo) return globalState.userInfo
            return await _getUserInfo.call(this)
          }
        }
        if (vm.runtime.ccwAPI) patchCCWAPI(vm.runtime.ccwAPI)
        const _setCCWAPI = vm.runtime.setCCWAPI
        vm.runtime.setCCWAPI = function (api) {
          _setCCWAPI.call(this, api)
          patchCCWAPI(api)
        }
        let userName = vm.runtime.ioDevices.userData._username
        Object.defineProperty(vm.runtime.ioDevices.userData, '_username', {
          get: () => {
            if (globalState.userInfo) return globalState.userInfo.userName
            return userName
          },
          set(value) {
            userName = value
          }
        })
        // Extension hack
        const _compilerRegisterExtension =
          vm.runtime.constructor.prototype.compilerRegisterExtension
        const patchUUID = extensionObject => {
          Object.defineProperties(extensionObject, {
            UserId: {
              get() {
                return globalState.userInfo?.userId
              },
              set() {}
            },
            ccwUserNickname: {
              get() {
                return globalState.userInfo?.userName
              },
              set() {}
            },
            ccwUserUUID: {
              get() {
                return globalState.userInfo?.userId
              },
              set() {}
            }
          })
        }
        patch(
          vm.extensionManager,
          'isValidExtensionURL',
          isValidExtensionURL => {
            return function (extensionURL) {
              if (extensionURL.startsWith('blob:')) return true
              return isValidExtensionURL.call(this, extensionURL)
            }
          }
        )
        vm.runtime.compilerRegisterExtension = (name, extensionObject) => {
          switch (name) {
            case 'community': {
              extensionObject.getCoinCount = () => Infinity
              extensionObject.isUserLikedOtherProject =
                extensionObject.isLiked =
                extensionObject.isMyFans =
                extensionObject.isFanOfSomeone =
                extensionObject.requestFollow =
                extensionObject.isUserFavoriteOtherProject =
                  () => true
              const _insertCoinAndWaitForResult =
                extensionObject.insertCoinAndWaitForResult
              extensionObject.insertCoinAndWaitForResult = function (args) {
                if (confirm(`作品请求投 ${args.COUNT} 个币，是否伪造结果？`)) {
                  return true
                }
                return _insertCoinAndWaitForResult.call(this, args)
              }
              break
            }
            case 'GandiAchievementAndLeaderboard': {
              this.featureList.set('🏆 成就相关功能', () => {
                this.manager.open(
                  new AchievementScene(this.manager, extensionObject)
                )
              })
              this.manager.requestUpdate()
              break
            }
            case 'GandiEconomy': {
              patch(extensionObject, 'requestFundReturn', requestFundReturn => {
                return function (args) {
                  const res = prompt(
                    '作品正在请求合约无偿注资。请输入伪造的注资金额。\n当不输入任何内容时，将自动回落到官方实现。'
                  )
                  if (res === null || res === '') {
                    return requestFundReturn.call(this, args)
                  }
                  const v = Number(res)
                  if (Number.isNaN(v) || v < 0) {
                    return 0
                  }
                  return v
                }
              })
              this.featureList.set('📜 经济合约', () => {
                this.manager.open(
                  new EconomyScene(this.manager, extensionObject)
                )
              })
              break
            }
            case 'CCWMMO': {
              patchUUID(extensionObject)
              extensionObject.dispatchNewMessageWithParams = function (
                _,
                util
              ) {
                const blackList = globalState.mmo.broadcastBlackList
                const hatParam = util.thread.hatParam
                const message = `${hatParam.type}(session=${JSON.stringify(hatParam.sender)},uuid=${JSON.stringify(hatParam.senderUID)},name=${JSON.stringify(hatParam.name)},content=${JSON.stringify(hatParam.content)})`
                if (blackList.some(regex => regex.test(message))) {
                  return false
                }
                return true
              }
              this.featureList.set('🎮 MMO 框架', () => {
                this.manager.open(new MMOScene(this.manager, extensionObject))
              })
              break
            }
            case 'CCWData': {
              // const context = SecureVM({ Scratch: window.Scratch })
              patchUUID(extensionObject)
              this.featureList.set('🌩️ 云数据', () => {
                this.manager.open(
                  new CCWDataScene(this.manager, extensionObject)
                )
              })
              extensionObject.sendPlayEventCode = () => {}
              // FIXME: SecureVM is slow
              // const context = SecureVM()
              // patch(extensionObject, 'getValueInJSON', getValueInJSON => {
              //   return function getValueInJSON(args) {
              //     var key = Scratch.Cast.toString(args.KEY),
              //       json = Scratch.Cast.toString(args.JSON),
              //       jsonObj
              //     try {
              //       jsonObj = JSON.parse(json)
              //     } catch (e) {
              //       return 'error: '.concat(e.message)
              //     }
              //     if (/[()=]/gm.test(key))
              //       return 'error: invalid key '.concat(
              //         key,
              //         ', cannot contain ()='
              //       )
              //     var key2 = 'jsonObj['.concat(key, ']'),
              //       rtObj
              //     Array.isArray(jsonObj)
              //       ? (key = key.startsWith('[')
              //           ? 'jsonObj'.concat(key)
              //           : 'jsonObj['.concat(key, ']'))
              //       : /\s/gm.test(key)
              //         ? (console.warn(
              //             '[CCW Data] warning: invalid key '.concat(
              //               key,
              //               ', space and dot cannot be used together'
              //             )
              //           ),
              //           (key = 'jsonObj["'.concat(key, '"]')))
              //         : (key = 'jsonObj.'.concat(key))
              //     try {
              //       rtObj = context
              //         .Function('key', 'json', 'jsonObj', 'key2', 'args', key)
              //         .call(
              //           this,
              //           key,
              //           json,
              //           jsonObj,
              //           key2,
              //           `return eval(${JSON.stringify(args)})`
              //         )
              //     } catch (e) {
              //       try {
              //         rtObj = context
              //           .Function('key', 'json', 'jsonObj', 'key2', 'args', key)
              //           .call(
              //             this,
              //             key,
              //             json,
              //             jsonObj,
              //             key2,
              //             `return eval(${JSON.stringify(args)})`
              //           )
              //       } catch (e) {
              //         return 'error: key or expression invalid'
              //       }
              //     }
              //     return 'object' === typeof rtObj
              //       ? JSON.stringify(rtObj)
              //       : rtObj
              //   }
              // })
              // patch(extensionObject, 'setValueInJSON', setValueInJSON => {
              //   return function setValueInJSON(args) {
              //     var key = Scratch.Cast.toString(args.KEY),
              //       value = Scratch.Cast.toString(args.VALUE),
              //       json = Scratch.Cast.toString(args.JSON),
              //       jsonObj
              //     try {
              //       jsonObj = JSON.parse(json)
              //     } catch (e) {
              //       return 'error: '.concat(e.message)
              //     }
              //     if (/[()=]/gm.test(key))
              //       return 'error: invalid key '.concat(
              //         key,
              //         ', cannot contain ()='
              //       )
              //     var valueObj = value
              //     if (
              //       /^[\[].*?[\]]$/gm.test(value) ||
              //       /^[\{].*?[\}]$/gm.test(value)
              //     )
              //       try {
              //         valueObj = JSON.parse(value)
              //       } catch (e) {}
              //     'string' == typeof valueObj &&
              //       /^-?\d*\.?\d*$/gm.test(valueObj) &&
              //       (valueObj = Number(valueObj))
              //     try {
              //       Array.isArray(jsonObj)
              //         ? (jsonObj[key] = valueObj)
              //         : /[\.\[\]]/gm.test(key)
              //           ? (valueObj instanceof Object
              //               ? ((valueObj = JSON.stringify(valueObj)),
              //                 (valueObj = "JSON.parse('".concat(
              //                   valueObj,
              //                   "')"
              //                 )))
              //               : 'string' == typeof valueObj &&
              //                 (valueObj = "'".concat(valueObj, "'")),
              //             context
              //               .Function(
              //                 'key',
              //                 'value',
              //                 'json',
              //                 'jsonObj',
              //                 'valueObj',
              //                 'args',
              //                 'jsonObj.'.concat(key, '=').concat(valueObj)
              //               )
              //               .call(
              //                 this,
              //                 key,
              //                 value,
              //                 json,
              //                 jsonObj,
              //                 valueObj,
              //                 args
              //               ))
              //           : (jsonObj[key] = valueObj)
              //     } catch (e) {
              //       return 'error: key or expression invalid'
              //     }
              //     return JSON.stringify(jsonObj)
              //   }
              // })
              patch(
                extensionObject,
                '_getValueFromProject',
                _getValueFromProject => {
                  return async function (name) {
                    const newValue = await _getValueFromProject.call(this, name)
                    globalState.ccwdata.project.set(name, newValue)
                    const possiblyModifiedValue =
                      globalState.ccwdata.project.get(name)
                    if (possiblyModifiedValue !== newValue) {
                      return extensionObject._setValueToProject(
                        name,
                        possiblyModifiedValue
                      )
                    }
                    return possiblyModifiedValue
                  }
                }
              )
              patch(
                extensionObject,
                '_setValueToProject',
                _setValueToProject => {
                  return async function (name, value) {
                    globalState.ccwdata.project.set(name, value)
                    return await _setValueToProject.call(
                      this,
                      name,
                      globalState.ccwdata.project.get(name)
                    )
                  }
                }
              )
              patch(extensionObject, '_getValueFromUser', _getValueFromUser => {
                return async function (name) {
                  const newValue = await _getValueFromUser.call(this, name)
                  globalState.ccwdata.user.set(name, newValue)
                  const possiblyModifiedValue =
                    globalState.ccwdata.user.get(name)
                  if (possiblyModifiedValue !== newValue) {
                    return extensionObject._setValueToUser(
                      name,
                      possiblyModifiedValue
                    )
                  }
                  return possiblyModifiedValue
                }
              })
              patch(extensionObject, '_setValueToUser', _setValueToUser => {
                return async function (name, value) {
                  globalState.ccwdata.user.set(name, value)
                  return await _setValueToUser.call(
                    this,
                    name,
                    globalState.ccwdata.user.get(name)
                  )
                }
              })
              break
            }
          }
          _compilerRegisterExtension.call(vm.runtime, name, extensionObject)
        }
      })
    }
    this.manager = manager
    this.animationFrame = null
    this.avatarRotation = 0
    this.featureList = new Map([
      [
        '⚙️ 高级',
        () => {
          this.manager.open(new ScriptScene(this.manager))
        }
      ],
      [
        'ℹ️ 关于',
        () => {
          this.manager.open(new AboutScene(this.manager))
        }
      ]
    ])
  }
  static createListButton(feature, callback) {
    const li = document.createElement('li')
    li.textContent = feature
    li.style.padding = '10px'
    li.style.margin = '5px 0'
    li.style.backgroundColor = '#f0f0f0'
    li.style.borderRadius = '8px'
    li.style.cursor = 'pointer'
    li.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'

    // 添加聚焦动画
    li.addEventListener('mouseover', () => {
      li.style.transform = 'scale(1.05)'
      li.style.transition = 'transform 0.2s ease-in-out'
    })
    li.addEventListener('mouseout', () => {
      li.style.transform = 'scale(1)'
    })
    li.addEventListener('click', callback)

    return li
  }

  renderFeatureList() {
    const ul = document.createElement('ul')
    const features = HomeScene.orderBy(this.featureList, [
      '📝 作品数据',
      '🌩️ 云数据',
      '🎮 MMO 框架',
      '🏆 成就相关功能',
      '📜 经济合约',
      '⚙️ 高级',
      'ℹ️ 关于'
    ])

    features.forEach(feature => {
      ul.appendChild(HomeScene.createListButton(feature[0], feature[1]))
    })

    ul.style.padding = '0'
    ul.style.margin = '0'
    ul.style.listStyleType = 'none'
    return ul
  }
  render() {
    const scrollable = createScrollable()
    const userProfile = document.createElement('div')
    userProfile.style.display = 'flex'
    userProfile.style.marginTop = '10px'
    userProfile.style.flexDirection = 'column'
    userProfile.style.alignItems = 'center'
    userProfile.style.marginBottom = '10px'

    const avatar = document.createElement('img')
    avatar.src = globalState.userInfo?.avatar ?? LOGO_IMG // 'https://avatars.githubusercontent.com/u/55276797?v=4' // Replace with actual avatar URL
    avatar.alt = '用户头像'

    avatar.style.width = '120px'
    avatar.style.height = '120px'
    avatar.style.cursor = 'pointer'
    avatar.style.borderRadius = '50%'
    avatar.style.marginBottom = '10px'

    if (
      !this.isProfilePage &&
      (globalState.userInfo || !document.cookie.includes('cookie-user-id='))
    ) {
      const handleFile = file => {
        if (file && file.type.startsWith('application/json')) {
          const reader = new FileReader()
          reader.onload = event => {
            globalState.userInfo = JSON.parse(event.target.result)
            this.manager.requestUpdate()
          }
          reader.readAsText(file)
        }
      }
      avatar.style.transition = 'opacity 0.3s ease-in-out'
      avatar.title = '导入用户配置文件'
      avatar.addEventListener('dragover', e => {
        avatar.style.opacity = '0.5'
        e.preventDefault()
      })
      avatar.addEventListener('dragleave', e => {
        avatar.style.opacity = '1'
        e.preventDefault()
      })
      avatar.addEventListener('mouseover', () => {
        avatar.style.opacity = '0.5'
      })

      avatar.addEventListener('mouseout', () => {
        avatar.style.opacity = '1'
      })
      avatar.addEventListener('drop', e => {
        avatar.style.opacity = '1'
        const file = e.dataTransfer.files[0]
        handleFile(file)
        e.preventDefault()
      })
      avatar.addEventListener('click', () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/json'
        input.style.display = 'none'
        input.addEventListener('change', e => {
          const file = e.target.files[0]
          handleFile(file)
        })
        input.click()
      })
    } else if (globalState.userInfo) {
      avatar.style.transition = 'opacity 0.3s ease-in-out'
      avatar.title = '下载用户配置文件'
      avatar.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(globalState.userInfo, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.download = `${globalState.userInfo.uuid}.json`
        a.href = url
        a.click()
        URL.revokeObjectURL(url)
      })
      avatar.addEventListener('mouseover', () => {
        avatar.style.opacity = '0.5'
      })

      avatar.addEventListener('mouseout', () => {
        avatar.style.opacity = '1'
      })
    }

    const rotateAvatar = () => {
      if (
        !globalState.userInfo &&
        document.cookie.includes('cookie-user-id=')
      ) {
        this.avatarRotation += 5
        avatar.style.transform = `rotate(${this.avatarRotation}deg)`
        this.animationFrame = requestAnimationFrame(rotateAvatar)
      } else {
        this.avatarRotation = 0
        this.animationFrame = null
      }
    }

    if (!this.animationFrame) {
      rotateAvatar()
    }

    const username = document.createElement('div')
    username.textContent =
      globalState.userInfo?.userName ??
      (document.cookie.includes('cookie-user-id=') ? '请稍等...' : '未登录')
    username.style.fontSize = '16px'
    username.style.fontWeight = 'bold'

    userProfile.appendChild(avatar)
    userProfile.appendChild(username)
    scrollable.appendChild(userProfile)

    const ul = this.renderFeatureList()

    scrollable.appendChild(ul)

    const about = document.createElement('strong')
    about.style.color = '#999'
    about.textContent = `CSense v${VERSION}`
    about.style.display = 'block'
    about.style.textAlign = 'center'
    scrollable.appendChild(about)

    this.manager.target.appendChild(scrollable)
  }
  dispose() {}
}
