import { createScrollable } from 'src/util/window'
import globalState from '../base/state'

export class MMOScene {
  static title = 'MMO'
  constructor(manager, extension) {
    this.manager = manager
    this.extension = extension
    this.inputing = false
  }
  render() {
    if (this.extension.currentRoom) {
      const title1 = document.createElement('p')
      title1.textContent = '过滤广播'
      title1.style.fontSize = '16px'
      title1.style.marginBottom = '5px'
      this.manager.target.appendChild(title1)
      const description = document.createElement('p')
      description.textContent = '您可以在这里管理广播的黑名单。'
      description.style.cursor = 'help'
      description.title = `广播格式如下：
消息类型(session="",uuid="",name="",content="")`
      description.style.fontSize = '12px'
      this.manager.target.appendChild(description)
      const description2 = document.createElement('p')
      description2.textContent =
        '如果消息的内容匹配任何一个正则表达式，它将不会被 Scratch 处理。'
      description2.style.fontSize = '12px'
      description2.style.marginBottom = '10px'
      this.manager.target.appendChild(description2)

      const scrollable = createScrollable()
      const list = document.createElement('ul')

      if (globalState.mmo.broadcastBlackList.length === 0) {
        const noResultsItem = document.createElement('li')
        noResultsItem.textContent = '(无结果)'
        noResultsItem.className = 'no-results'
        noResultsItem.style.display = 'flex'
        noResultsItem.style.justifyContent = 'center'
        noResultsItem.style.alignItems = 'center'
        noResultsItem.style.width = '100%'
        noResultsItem.style.height = '100%'
        noResultsItem.style.color = '#999'
        list.appendChild(noResultsItem)
      } else {
        globalState.mmo.broadcastBlackList.forEach((regex, index) => {
          const listItem = document.createElement('li')
          listItem.style.display = 'flex'
          listItem.style.alignItems = 'center'
          listItem.style.justifyContent = 'space-between'
          listItem.style.padding = '5px 0'

          const regexSpan = document.createElement('span')
          regexSpan.textContent = regex.toString()
          regexSpan.style.flexGrow = '1'

          const deleteBtn = document.createElement('button')
          deleteBtn.textContent = '❌'
          deleteBtn.title = '删除'
          deleteBtn.style.marginLeft = '10px'
          deleteBtn.addEventListener('click', () => {
            globalState.mmo.broadcastBlackList.splice(index, 1)
            this.manager.requestUpdate()
          })

          listItem.appendChild(regexSpan)
          listItem.appendChild(deleteBtn)
          list.appendChild(listItem)
        })
      }

      scrollable.appendChild(list)
      this.manager.target.appendChild(scrollable)

      const flexInputContainer = document.createElement('div')
      flexInputContainer.style.display = 'flex'

      const regexBefore = document.createElement('span')
      regexBefore.textContent = '/'
      regexBefore.style.marginRight = '5px'
      flexInputContainer.appendChild(regexBefore)

      const input = document.createElement('input')
      input.type = 'text'
      input.placeholder = '添加新的正则表达式...'
      input.style.flexGrow = '1'

      input.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
          try {
            const newRegex = new RegExp(input.value, 'g')
            globalState.mmo.broadcastBlackList.push(newRegex)
            this.inputing = true
            this.manager.requestUpdate()
          } catch {
            input.animate([{ color: 'red' }, { color: '' }], {
              duration: 300
            })
          }
        }
      })

      if (this.inputing) {
        this.inputing = false
        input.select()
      }

      flexInputContainer.appendChild(input)

      const regexAfter = document.createElement('span')
      regexAfter.textContent = '/g'
      regexAfter.style.marginLeft = '5px'
      flexInputContainer.appendChild(regexAfter)

      this.manager.target.appendChild(flexInputContainer)

      // 发送广播
      const title2 = document.createElement('p')
      title2.textContent = '发送广播'
      this.manager.target.appendChild(title2)
      const description3 = document.createElement('p')
      description3.textContent = '您可以在这里发送广播。'
      description3.style.cursor = 'help'
      description3.title = `广播格式如下：
消息类型("")
如果没有内容，则 content 可以省略：
消息类型()`
      description3.style.fontSize = '12px'
      this.manager.target.appendChild(description3)
      const input2 = document.createElement('input')
      input2.type = 'text'
      input2.style.width = '100%'
      input2.placeholder = '广播内容...'
      input2.style.display = 'block'
      input2.style.marginTop = '10px'
      input2.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
          // 根据格式提取 type 和 content
          let match
          if ((match = input2.value.match(/(.*?)\("(.*?)"\)/))) {
            try {
              this.extension.broadcastMsg({
                type: match[1],
                content: JSON.parse('"' + match[2] + '"')
              })
              input2.value = ''
            } catch {
              input2.animate([{ color: 'red' }, { color: '' }], {
                duration: 300
              })
            }
          } else if ((match = input2.value.match(/(.*?)\(\)/))) {
            // content 被省略？
            try {
              this.extension.broadcastMsg({
                type: match[1],
                content: ''
              })
              input2.value = ''
            } catch {
              input2.animate([{ color: 'red' }, { color: '' }], {
                duration: 300
              })
            }
          } else {
            input2.animate([{ color: 'red' }, { color: '' }], {
              duration: 300
            })
          }
        }
      })
      this.manager.target.appendChild(input2)
    } else {
      const p = document.createElement('p')
      p.textContent = '现在没有加入任何房间。请在加入房间后重新打开此页面。'
      this.manager.target.appendChild(p)
    }
  }
  dispose() {}
}
