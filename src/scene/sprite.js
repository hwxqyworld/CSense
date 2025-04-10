import { Variable } from '../api/vmapi'
import { createScrollable } from 'src/util/window'
export class SpriteScene {
  static title = '变量管理'
  constructor(manager, sprite) {
    this.manager = manager
    this.sprite = sprite
    this.runtime = sprite.runtime
    this.isRunning = this.runtime.frameLoop.running
    Object.defineProperty(this.runtime.frameLoop, 'running', {
      get: () => this.isRunning,
      set: value => {
        this.isRunning = value
        if (this.pauseButton) this.modifyPauseState(this.pauseButton)
      },
      configurable: true
    })
    this.selected = null
    this.disposed = false
    this.lastLength = null
    // DOM elements
    this.lastFocused = null
    this.pauseButton = null
    this.inputs = {}
    this.index = null
    this.total = null
    const animationFrame = () => {
      if (this.index) {
        this.index.max = this.sprite.clones.length
        if (
          this.selected !== null &&
          this.selected >= this.sprite.clones.length
        ) {
          this.selected = this.sprite.clones.length - 1
          this.manager.requestUpdate()
          return
        }
      }
      if (this.total && this.sprite.clones.length !== this.lastLength) {
        this.total.textContent = `/ ${this.sprite.clones.length}`
        this.lastLength = this.sprite.clones.length
        this.total.animate([{ color: 'red' }, { color: '' }], {
          duration: 300
        })
      }
      // TODO: 使用 variable.watch 实现
      for (const [id, value] of Object.entries(this.inputs)) {
        const content = String(
          this.sprite.clones[this.selected ?? 0].variables[id].value
        )
        if (value.value !== content && value !== this.lastFocused) {
          value.animate([{ color: 'red' }, { color: '' }], {
            duration: 300
          })
          value.value = content
        }
      }
      if (!this.disposed) requestAnimationFrame(animationFrame)
    }
    requestAnimationFrame(animationFrame)
  }
  modifyPauseState(pauseButton) {
    pauseButton.textContent = this.isRunning ? '⏸️' : '▶️'
    pauseButton.title = this.isRunning ? '暂停' : '继续'
    pauseButton.style.padding = '5px'
    pauseButton.style.border = 'none'
    pauseButton.style.borderRadius = '5px'
    pauseButton.style.color = 'white'
    pauseButton.style.backgroundColor = this.isRunning ? 'blue' : '#e9ae3b'
    pauseButton.style.cursor = 'pointer'
    pauseButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
    pauseButton.style.width = '30px'
    pauseButton.style.height = '30px'
  }
  render() {
    if (this.selected >= this.sprite.clones.length) {
      this.selected = this.sprite.clones.length - 1
    }
    const target = this.manager.target
    const sprite = this.sprite
    const container = document.createElement('div')
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    target.appendChild(container)

    const pauseButton = document.createElement('button')
    pauseButton.addEventListener('click', () => {
      if (this.isRunning) {
        this.runtime.frameLoop.stop()
      } else {
        this.runtime.frameLoop.start()
      }
    })
    this.pauseButton = pauseButton
    this.modifyPauseState(pauseButton)

    container.appendChild(pauseButton)
    const cloneIndex = document.createElement('input')
    cloneIndex.type = 'number'
    cloneIndex.min = 1
    cloneIndex.value = this.selected === null ? '' : this.selected + 1
    cloneIndex.max = this.sprite.clones.length
    cloneIndex.placeholder = '克隆体编号'
    cloneIndex.style.flexGrow = '1'
    cloneIndex.style.padding = '5px'
    cloneIndex.style.border = '1px solid #ddd'
    cloneIndex.style.borderRadius = '4px'
    cloneIndex.addEventListener('change', () => {
      const index = parseInt(cloneIndex.value)
      if (index >= 1 && index <= this.sprite.clones.length) {
        this.selected = index - 1
        this.manager.requestUpdate()
      }
    })

    this.index = cloneIndex
    container.appendChild(cloneIndex)

    const total = document.createElement('span')
    total.style.color = '#999'
    total.style.marginLeft = '10px'
    this.lastLength = this.sprite.clones.length
    total.textContent = `/ ${this.sprite.clones.length}`
    this.total = total
    container.appendChild(total)
    const searchInput = document.createElement('input')
    searchInput.type = 'text'
    searchInput.placeholder = '搜索变量...'
    searchInput.style.padding = '5px'
    searchInput.style.border = '1px solid #ddd'
    searchInput.style.width = '100%'
    searchInput.style.boxSizing = 'border-box'
    searchInput.addEventListener('input', () => {
      const filter = searchInput.value.toLowerCase()
      const items = variableList.children
      let hasResults = false
      Array.from(items).forEach(item => {
        if (
          item.className !== 'no-results' &&
          item
            .querySelector('.item-name')
            .textContent.toLowerCase()
            .includes(filter)
        ) {
          item.style.display = 'flex'
          hasResults = true
        } else if (item.className !== 'no-results') {
          item.style.display = 'none'
        }
      })

      if (!hasResults) {
        if (!variableList.querySelector('.no-results')) {
          const noResultsItem = document.createElement('li')
          noResultsItem.textContent = '(无结果)'
          noResultsItem.className = 'no-results'
          noResultsItem.style.display = 'flex'
          noResultsItem.style.justifyContent = 'center'
          noResultsItem.style.alignItems = 'center'
          noResultsItem.style.width = '100%'
          noResultsItem.style.height = '100%'
          noResultsItem.style.color = '#999'
          variableList.appendChild(noResultsItem)
        }
      } else {
        const noResultsItem = variableList.querySelector('.no-results')
        if (noResultsItem) {
          variableList.removeChild(noResultsItem)
        }
      }
    })
    target.appendChild(searchInput)
    const scrollable = createScrollable()
    const variableList = document.createElement('ul')
    variableList.style.padding = '0'
    variableList.style.margin = '0'
    variableList.style.listStyleType = 'none'
    variableList.style.marginTop = '10px'

    if (Object.keys(sprite.clones[this.selected ?? 0].variables).length === 0) {
      const noResultsItem = document.createElement('li')
      noResultsItem.textContent = '(无结果)'
      noResultsItem.className = 'no-results'
      noResultsItem.style.display = 'flex'
      noResultsItem.style.justifyContent = 'center'
      noResultsItem.style.alignItems = 'center'
      noResultsItem.style.width = '100%'
      noResultsItem.style.height = '100%'
      noResultsItem.style.color = '#999'
      variableList.appendChild(noResultsItem)
    } else {
      this.inputs = Object.fromEntries(
        Object.values(sprite.clones[this.selected ?? 0].variables).map(
          variable => {
            const listItem = document.createElement('li')
            listItem.style.display = 'flex'
            listItem.style.alignItems = 'center'
            listItem.style.marginBottom = '5px'
            listItem.style.padding = '5px'
            listItem.style.border = '1px solid #ddd'
            listItem.style.borderRadius = '4px'
            listItem.style.backgroundColor = '#f9f9f9'

            const nameSpan = document.createElement('span')
            nameSpan.textContent = variable.name
            nameSpan.className = 'item-name'
            nameSpan.style.flexGrow = '1'
            nameSpan.style.marginRight = '10px'

            const valueInput = document.createElement('input')
            valueInput.type = 'text'
            valueInput.style.fontFamily = 'monospace'
            valueInput.value = Array.isArray(variable.value)
              ? JSON.stringify(variable.value)
              : variable.value
            valueInput.style.flexGrow = '2'
            valueInput.style.marginRight = '10px'
            valueInput.addEventListener('change', () => {
              // TODO: 判断 variable 类型
              try {
                variable.value = JSON.parse(valueInput.value)
              } catch {
                variable.value = valueInput.value
              }
            })
            valueInput.addEventListener('focus', () => {
              this.lastFocused = valueInput
            })
            valueInput.addEventListener('blur', () => {
              this.lastFocused = null
            })

            const lockButton = document.createElement('button')

            lockButton.style.marginRight = '5px'
            const v = new Variable(
              sprite.clones[this.selected ?? 0],
              variable.id
            )
            lockButton.textContent = v.freezing ? '🔓' : '🔒'
            lockButton.title = v.freezing ? '解锁' : '锁定'
            valueInput.disabled = v.freezing
            lockButton.addEventListener('click', () => {
              // TODO: 锁定变量
              try {
                variable.value = JSON.parse(valueInput.value)
              } catch {
                variable.value = valueInput.value
              }
              v.freezing = !v.freezing
              lockButton.title = v.freezing ? '解锁' : '锁定'
              lockButton.textContent = v.freezing ? '🔓' : '🔒'
              valueInput.disabled = v.freezing
            })

            listItem.appendChild(nameSpan)
            listItem.appendChild(valueInput)
            listItem.appendChild(lockButton)
            variableList.appendChild(listItem)
            return [variable.id, valueInput]
          }
        )
      )
    }

    scrollable.appendChild(variableList)
    target.appendChild(scrollable)
  }

  dispose() {
    this.disposed = true
    delete this.runtime.frameLoop.running
    this.runtime.frameLoop.running = this.isRunning
  }
}
