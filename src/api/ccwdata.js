export class Database {
  constructor() {
    this.data = new Map()
    this.watchers = new Map()
  }
  watch(key, callback) {
    this.watchers.set(key, callback)
  }
  set(key, value) {
    if (this.data.get(key) === value) return
    if (this.watchers.has(key)) {
      return this.data.set(
        key,
        this.watchers.get(key)(this.data.get(key), value)
      )
    } else this.data.set(key, value)
  }
  get(key) {
    return this.data.get(key)
  }
  has(key) {
    return this.data.has(key)
  }
  entries() {
    return this.data.entries()
  }
  values() {
    return this.data.values()
  }
  keys() {
    return this.data.keys()
  }
}
