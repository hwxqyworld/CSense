import { EconomyPoolScene } from './economyPool'
import { createScrollable } from 'src/util/window'

export class EconomyScene {
  static title = '经济合约'
  constructor(manager, extension) {
    this.manager = manager
    this.extension = extension
    this.pools = null
    this.fetching = false
  }
  render() {
    const scrollable = createScrollable()
    if (!this.pools) {
      if (!this.fetching) {
        ;(async () => {
          const poolList = await this.extension.apis.getSmartContractList()
          for (const pool of poolList) {
            pool.balance =
              await this.extension.apis.getSmartContractAccountByContractId(
                pool.id
              )
          }
          this.fetching = false
          this.pools = poolList
          this.manager.requestUpdate()
        })()
      }
      this.fetching = true
      const loading = document.createElement('strong')
      loading.style.color = '#999'
      loading.textContent = '加载中...'
      loading.style.display = 'block'
      loading.style.textAlign = 'center'
      scrollable.appendChild(loading)
    } else {
      const searchContainer = document.createElement('div')
      searchContainer.style.display = 'flex'
      searchContainer.style.justifyContent = 'center'

      const searchInput = document.createElement('input')
      searchInput.type = 'text'
      searchInput.placeholder = '搜索合约...'
      searchInput.style.padding = '5px'
      searchInput.style.border = '1px solid #ddd'
      searchInput.style.width = '100%'
      searchInput.style.boxSizing = 'border-box'

      searchInput.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase()
        const items = poolList.children
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
          if (!poolList.querySelector('.no-results')) {
            const noResultsItem = document.createElement('li')
            noResultsItem.textContent = '(无结果)'
            noResultsItem.className = 'no-results'
            noResultsItem.style.display = 'flex'
            noResultsItem.style.justifyContent = 'center'
            noResultsItem.style.alignItems = 'center'
            noResultsItem.style.width = '100%'
            noResultsItem.style.height = '100%'
            noResultsItem.style.color = '#999'
            poolList.appendChild(noResultsItem)
          }
        } else {
          const noResultsItem = poolList.querySelector('.no-results')
          if (noResultsItem) {
            poolList.removeChild(noResultsItem)
          }
        }
      })

      searchContainer.appendChild(searchInput)
      this.manager.target.appendChild(searchContainer)
      const poolList = document.createElement('ul')
      poolList.style.marginTop = '10px'
      poolList.style.padding = '0'
      poolList.style.margin = '0'
      poolList.style.listStyleType = 'none'
      this.pools.forEach(pool => {
        const typeMap = {
          DUCK_MAKER: '鸭里奥',
          GENERAL: '通用',
          GENERAL_NO_SPLIT: '通用 (作者无分成)'
        }
        const listItem = document.createElement('li')
        listItem.style.display = 'flex'
        listItem.style.flexDirection = 'column'
        listItem.style.alignItems = 'flex-start'
        listItem.style.marginBottom = '5px'
        listItem.style.padding = '5px'
        listItem.style.border = '1px solid #ddd'
        listItem.style.borderRadius = '4px'
        listItem.style.backgroundColor = '#f9f9f9'

        const nameContainer = document.createElement('div')
        nameContainer.style.display = 'flex'
        nameContainer.style.alignItems = 'center'
        nameContainer.style.width = '100%'

        const nameSpan = document.createElement('span')
        nameSpan.textContent = pool.title
        nameSpan.className = 'item-name'
        if (pool.status !== 'ENABLED') {
          nameSpan.style.color = '#999'
        }
        nameSpan.title = `创建时间 ${
          pool.createdAt === null ? '未知' : new Date(pool.createdAt)
        } / 最后更新 ${new Date(
          pool.updatedAt === null ? '未知' : pool.updatedAt
        )}`
        nameSpan.style.flexGrow = '1'
        nameSpan.style.marginRight = '10px'

        const inspectButton = document.createElement('button')
        inspectButton.textContent = '🔍'
        inspectButton.style.cursor = 'pointer'
        inspectButton.style.marginRight = '5px'
        inspectButton.title = '查看合约'
        inspectButton.addEventListener('click', () => {
          this.manager.open(
            new EconomyPoolScene(this.manager, this.extension, pool)
          )
        })

        const extra = document.createElement('span')
        extra.title = extra.textContent = `(${
          pool.status === 'ENABLED' ? '可用' : '不可用'
        }) ${typeMap[pool.type] ?? '未知'} / ${pool.balance} 币`
        extra.style.textWrap = 'nowrap'
        extra.style.overflow = 'hidden'
        extra.style.textOverflow = 'ellipsis' // Show ellipsis for overflow text
        extra.style.maxWidth = '400px'
        extra.style.color = '#666'
        extra.style.width = '100%'

        nameContainer.appendChild(nameSpan)
        nameContainer.appendChild(inspectButton)
        listItem.appendChild(nameContainer)
        listItem.appendChild(extra)
        poolList.appendChild(listItem)
      })
      scrollable.appendChild(poolList)
    }
    this.manager.target.appendChild(scrollable)
  }
  dispose() {}
}
