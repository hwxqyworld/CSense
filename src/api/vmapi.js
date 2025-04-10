import { patch } from 'src/util/inject'

export class Variable {
  static freezed = Symbol('LockedByCSense')
  constructor(target, id) {
    this.variable = target.variables[id]
  }
  get() {
    return this.variable.value
  }
  set(v) {
    this.variable.value = v
    return this
  }
  get freezing() {
    return !!this.variable[Variable.freezed]
  }
  set freezing(v) {
    if (v) {
      if (this.variable[Variable.freezed]) return
      this.variable[Variable.freezed] = true
      this.watch(function (before) {
        return before
      })
    } else {
      delete this.variable[Variable.freezed]
      this.unwatch()
    }
  }
  watch(callback) {
    let variable = this.variable.value
    Object.defineProperty(this.variable, 'value', {
      get() {
        return variable
      },
      set(value) {
        const oldValue = variable
        variable = callback(oldValue, value)
      },
      configurable: true
    })
  }
  unwatch() {
    const freezedValue = this.variable.value
    delete this.variable.value
    this.variable.value = freezedValue
  }
}

export class VMAPI {
  constructor(vm) {
    this.instance = vm
  }
  sprite(name) {
    const v = this.instance.runtime.targets.find(t => t.sprite.name === name)
    if (!v) return null
    return new VMSprite(v.sprite)
  }
}
export class VMSprite {
  constructor(sprite) {
    this.sprite = sprite
  }
  get clones() {
    return this.sprite.clones.map(v => new VMTarget(v))
  }
  on(event, callback) {
    if (event === 'clone') {
      patch(this.sprite, 'createClone', createClone => {
        return function (...args) {
          const res = createClone.call(this, ...args)
          callback(res)
          return res
        }
      })
    }
  }
}
export class VMTarget {
  constructor(target) {
    this.target = target
  }
  varId(id) {
    if (this.target.variables[id]) return new Variable(this.target, id)
    return null
  }
  var(name) {
    const v = Object.values(this.target.variables).find(v => v.name === name)
    if (v) return new Variable(this.target, v.id)
    return null
  }
}
