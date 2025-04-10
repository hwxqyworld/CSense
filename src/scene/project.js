import globalState from '../base/state'
import { createScrollable } from 'src/util/window'
import { SpriteScene } from './sprite'

export class ProjectScene {
  static title = '项目'
  constructor(manager) {
    this.manager = manager
    this.vm = globalState.vm
  }
  render() {
    const target = this.manager.target
    const searchContainer = document.createElement('div')
    searchContainer.style.display = 'flex'
    searchContainer.style.justifyContent = 'center'

    const searchInput = document.createElement('input')
    searchInput.type = 'text'
    searchInput.placeholder = '搜索角色...'
    searchInput.style.padding = '5px'
    searchInput.style.border = '1px solid #ddd'
    searchInput.style.width = '100%'
    searchInput.style.boxSizing = 'border-box'

    const downloadButton = document.createElement('button')
    downloadButton.textContent = '⬇️'
    downloadButton.title = '下载项目'
    downloadButton.style.padding = '10px'
    downloadButton.style.border = 'none'
    downloadButton.style.cursor = 'pointer'
    downloadButton.style.background = 'rgb(0, 123, 255)'
    downloadButton.style.color = 'white'
    downloadButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)' // Modern shadow
    downloadButton.addEventListener('click', async () => {
      const blob = await this.vm.saveProjectSb3()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.download = 'Project.sb3'
      a.href = url
      a.click()
      URL.revokeObjectURL(url)
    })

    searchInput.addEventListener('input', () => {
      const filter = searchInput.value.toLowerCase()
      const items = spriteList.children
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
        if (!spriteList.querySelector('.no-results')) {
          const noResultsItem = document.createElement('li')
          noResultsItem.textContent = '(无结果)'
          noResultsItem.className = 'no-results'
          noResultsItem.style.display = 'flex'
          noResultsItem.style.justifyContent = 'center'
          noResultsItem.style.alignItems = 'center'
          noResultsItem.style.width = '100%'
          noResultsItem.style.height = '100%'
          noResultsItem.style.color = '#999'
          spriteList.appendChild(noResultsItem)
        }
      } else {
        const noResultsItem = spriteList.querySelector('.no-results')
        if (noResultsItem) {
          spriteList.removeChild(noResultsItem)
        }
      }
    })

    searchContainer.appendChild(searchInput)
    searchContainer.appendChild(downloadButton)
    target.appendChild(searchContainer)
    const scrollable = createScrollable()
    const spriteList = document.createElement('ul')
    spriteList.style.marginTop = '10px'
    spriteList.style.padding = '0'
    spriteList.style.margin = '0'
    spriteList.style.listStyleType = 'none'
    const sprites = this.vm.runtime.targets
      .filter(target => target.isOriginal)
      .map(target => target.sprite)
    sprites.forEach(sprite => {
      const listItem = document.createElement('li')
      listItem.style.display = 'flex'
      listItem.style.flexDirection = 'column'
      listItem.style.alignItems = 'center'
      listItem.style.flex = '1 1 calc(25% - 10px)' // Flex layout for 4 items per row
      listItem.style.maxWidth = '25%' // Ensure 4 items per row
      listItem.style.margin = '5px'
      listItem.style.boxSizing = 'border-box'
      listItem.style.textAlign = 'center'
      listItem.style.padding = '10px'
      listItem.style.border = '1px solid #ddd'
      listItem.style.borderRadius = '8px'
      listItem.style.backgroundColor = '#f9f9f9'
      listItem.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'

      // Add hover effect
      listItem.addEventListener('mouseover', () => {
        listItem.style.transform = 'scale(1.05)'
        listItem.style.transition = 'transform 0.2s ease-in-out'
      })
      listItem.addEventListener('mouseout', () => {
        listItem.style.transform = 'scale(1)'
      })
      listItem.addEventListener('click', () => {
        this.manager.open(new SpriteScene(this.manager, sprite))
      })

      const spriteImage = document.createElement('img')
      spriteImage.src = sprite.costumes[0].asset.encodeDataURI()
      spriteImage.alt = sprite.name
      spriteImage.style.width = '100%'
      spriteImage.style.height = '100%'
      spriteImage.style.marginBottom = '5px'

      const spriteName = document.createElement('div')
      spriteName.title = spriteName.textContent = sprite.name
      spriteName.style.width = '80px'
      spriteName.className = 'item-name'
      spriteName.style.fontSize = '14px'
      spriteName.style.fontWeight = 'bold'
      spriteName.style.whiteSpace = 'nowrap' // Prevent text wrapping
      spriteName.style.overflow = 'hidden' // Hide overflow text
      spriteName.style.textOverflow = 'ellipsis' // Show ellipsis for overflow text

      listItem.appendChild(spriteImage)
      listItem.appendChild(spriteName)
      spriteList.appendChild(listItem)
    })

    spriteList.style.display = 'flex'
    spriteList.style.flexWrap = 'wrap'
    scrollable.appendChild(spriteList)
    target.appendChild(scrollable)
  }
  dispose() {}
}
