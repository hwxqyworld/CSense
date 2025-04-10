export class ResultOverlay {
  constructor(manager, isSuccess, message) {
    this.manager = manager
    this.isSuccess = isSuccess
    this.message = message
    setTimeout(() => {
      this.manager.removeOverlay(this)
    }, 3000)
  }
  render() {
    const target = this.manager.target
    const div = document.createElement('div')
    div.textContent = this.message
    div.style.width = '100%'
    div.style.backgroundColor = this.isSuccess ? 'green' : 'red'
    div.style.color = 'white'
    div.style.textAlign = 'center'
    div.style.padding = '5px'
    div.style.fontSize = '12px'
    div.style.boxSizing = 'border-box'
    div.animate(
      [{ transform: 'translateY(-100%)' }, { transform: 'translateY(0)' }],
      {
        duration: 300,
        easing: 'ease-in-out'
      }
    )
    div.style.position = 'relative'
    div.style.zIndex = '-1'
    target.appendChild(div)
  }
  dispose() {}
}
