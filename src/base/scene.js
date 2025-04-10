export class SceneManager {
  constructor(target) {
    this._disposed = false
    this.overlays = []
    this.target = target
    this.updateRequested = false
    this.scene = []
    const fn = () => {
      if (this.updateRequested) {
        this.updateRequested = false
        this._render()
      }
      if (!this._disposed) requestAnimationFrame(fn)
    }
    requestAnimationFrame(fn)
  }
  _doSetTitle() {}
  _updateTitle() {
    const c = this.scene.at(-1).constructor
    this._doSetTitle(c.title ?? c.name)
  }
  dispose() {
    this._disposed = true
  }
  _destroy() {
    while (this.target.firstChild) {
      this.target.removeChild(this.target.firstChild)
    }
  }
  _render() {
    this._destroy()
    this._updateTitle()
    this.overlays.forEach(overlay => overlay.render())
    this.scene.at(-1).render()
  }
  addOverlay(scene) {
    this.overlays.push(scene)
    this.requestUpdate()
  }
  removeOverlay(scene) {
    const index = this.overlays.indexOf(scene)
    if (index !== -1) {
      this.overlays[index].dispose()
      this.overlays.splice(index, 1)
      this.requestUpdate()
    }
  }
  back() {
    if (this.scene.length > 1) {
      const scene = this.scene.pop()
      scene.dispose()
      this.requestUpdate()
      return true
    }
    return false
  }
  open(scene) {
    this.scene.push(scene)
    this.requestUpdate()
  }
  requestUpdate() {
    this.updateRequested = true
  }
}
