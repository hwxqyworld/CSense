import { Sandbox } from './sandbox'

// These code used the implementation of `Turbowarp/scratch-vm`, licensed under the MPL-2.0.

/**
 * @param {string} code
 * @returns {Promise<{result: 'success'|'error', error: string|null, info: any|null}>}
 */
export async function getExtensionInfo(code, timeout = 10) {
  const sandbox = new Sandbox((global, bridge) => {
    class Color {
      /**
       * @typedef {object} RGBObject - An object representing a color in RGB format.
       * @property {number} r - the red component, in the range [0, 255].
       * @property {number} g - the green component, in the range [0, 255].
       * @property {number} b - the blue component, in the range [0, 255].
       */

      /**
       * @typedef {object} HSVObject - An object representing a color in HSV format.
       * @property {number} h - hue, in the range [0-359).
       * @property {number} s - saturation, in the range [0,1].
       * @property {number} v - value, in the range [0,1].
       */

      /** @type {RGBObject} */
      static get RGB_BLACK() {
        return { r: 0, g: 0, b: 0 }
      }

      /** @type {RGBObject} */
      static get RGB_WHITE() {
        return { r: 255, g: 255, b: 255 }
      }

      /**
       * Convert a Scratch decimal color to a hex string, #RRGGBB.
       * @param {number} decimal RGB color as a decimal.
       * @return {string} RGB color as #RRGGBB hex string.
       */
      static decimalToHex(decimal) {
        if (decimal < 0) {
          decimal += 0xffffff + 1
        }
        let hex = Number(decimal).toString(16)
        hex = `#${'000000'.substr(0, 6 - hex.length)}${hex}`
        return hex
      }

      /**
       * Convert a Scratch decimal color to an RGB color object.
       * @param {number} decimal RGB color as decimal.
       * @return {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
       */
      static decimalToRgb(decimal) {
        const a = (decimal >> 24) & 0xff
        const r = (decimal >> 16) & 0xff
        const g = (decimal >> 8) & 0xff
        const b = decimal & 0xff
        return { r: r, g: g, b: b, a: a > 0 ? a : 255 }
      }

      /**
       * Convert a hex color (e.g., F00, #03F, #0033FF) to an RGB color object.
       * @param {!string} hex Hex representation of the color.
       * @return {RGBObject} null on failure, or rgb: {r: red [0,255], g: green [0,255], b: blue [0,255]}.
       */
      static hexToRgb(hex) {
        if (hex.startsWith('#')) {
          hex = hex.substring(1)
        }
        const parsed = parseInt(hex, 16)
        if (isNaN(parsed)) {
          return null
        }
        if (hex.length === 6) {
          return {
            r: (parsed >> 16) & 0xff,
            g: (parsed >> 8) & 0xff,
            b: parsed & 0xff
          }
        } else if (hex.length === 3) {
          const r = (parsed >> 8) & 0xf
          const g = (parsed >> 4) & 0xf
          const b = parsed & 0xf
          return {
            r: (r << 4) | r,
            g: (g << 4) | g,
            b: (b << 4) | b
          }
        }
        return null
      }

      /**
       * Convert an RGB color object to a hex color.
       * @param {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
       * @return {!string} Hex representation of the color.
       */
      static rgbToHex(rgb) {
        return Color.decimalToHex(Color.rgbToDecimal(rgb))
      }

      /**
       * Convert an RGB color object to a Scratch decimal color.
       * @param {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
       * @return {!number} Number representing the color.
       */
      static rgbToDecimal(rgb) {
        return (rgb.r << 16) + (rgb.g << 8) + rgb.b
      }

      /**
       * Convert a hex color (e.g., F00, #03F, #0033FF) to a decimal color number.
       * @param {!string} hex Hex representation of the color.
       * @return {!number} Number representing the color.
       */
      static hexToDecimal(hex) {
        return Color.rgbToDecimal(Color.hexToRgb(hex))
      }

      /**
       * Convert an HSV color to RGB format.
       * @param {HSVObject} hsv - {h: hue [0,360), s: saturation [0,1], v: value [0,1]}
       * @return {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
       */
      static hsvToRgb(hsv) {
        let h = hsv.h % 360
        if (h < 0) h += 360
        const s = Math.max(0, Math.min(hsv.s, 1))
        const v = Math.max(0, Math.min(hsv.v, 1))

        const i = Math.floor(h / 60)
        const f = h / 60 - i
        const p = v * (1 - s)
        const q = v * (1 - s * f)
        const t = v * (1 - s * (1 - f))

        let r
        let g
        let b

        switch (i) {
          default:
          case 0:
            r = v
            g = t
            b = p
            break
          case 1:
            r = q
            g = v
            b = p
            break
          case 2:
            r = p
            g = v
            b = t
            break
          case 3:
            r = p
            g = q
            b = v
            break
          case 4:
            r = t
            g = p
            b = v
            break
          case 5:
            r = v
            g = p
            b = q
            break
        }

        return {
          r: Math.floor(r * 255),
          g: Math.floor(g * 255),
          b: Math.floor(b * 255)
        }
      }

      /**
       * Convert an RGB color to HSV format.
       * @param {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
       * @return {HSVObject} hsv - {h: hue [0,360), s: saturation [0,1], v: value [0,1]}
       */
      static rgbToHsv(rgb) {
        const r = rgb.r / 255
        const g = rgb.g / 255
        const b = rgb.b / 255
        const x = Math.min(Math.min(r, g), b)
        const v = Math.max(Math.max(r, g), b)

        // For grays, hue will be arbitrarily reported as zero. Otherwise, calculate
        let h = 0
        let s = 0
        if (x !== v) {
          const f = r === x ? g - b : g === x ? b - r : r - g
          const i = r === x ? 3 : g === x ? 5 : 1
          h = ((i - f / (v - x)) * 60) % 360
          s = (v - x) / v
        }

        return { h: h, s: s, v: v }
      }

      /**
       * Linear interpolation between rgb0 and rgb1.
       * @param {RGBObject} rgb0 - the color corresponding to fraction1 <= 0.
       * @param {RGBObject} rgb1 - the color corresponding to fraction1 >= 1.
       * @param {number} fraction1 - the interpolation parameter. If this is 0.5, for example, mix the two colors equally.
       * @return {RGBObject} the interpolated color.
       */
      static mixRgb(rgb0, rgb1, fraction1) {
        if (fraction1 <= 0) return rgb0
        if (fraction1 >= 1) return rgb1
        const fraction0 = 1 - fraction1
        return {
          r: fraction0 * rgb0.r + fraction1 * rgb1.r,
          g: fraction0 * rgb0.g + fraction1 * rgb1.g,
          b: fraction0 * rgb0.b + fraction1 * rgb1.b
        }
      }
    }

    /**
     * @fileoverview
     * Utilities for casting and comparing Scratch data-types.
     * Scratch behaves slightly differently from JavaScript in many respects,
     * and these differences should be encapsulated below.
     * For example, in Scratch, add(1, join("hello", world")) -> 1.
     * This is because "hello world" is cast to 0.
     * In JavaScript, 1 + Number("hello" + "world") would give you NaN.
     * Use when coercing a value before computation.
     */

    /**
     * Used internally by compare()
     * @param {*} val A value that evaluates to 0 in JS string-to-number conversation such as empty string, 0, or tab.
     * @returns {boolean} True if the value should not be treated as the number zero.
     */
    const isNotActuallyZero = val => {
      if (typeof val !== 'string') return false
      for (let i = 0; i < val.length; i++) {
        const code = val.charCodeAt(i)
        // '0'.charCodeAt(0) === 48
        // '\t'.charCodeAt(0) === 9
        // We include tab for compatibility with scratch-www's broken trim() polyfill.
        // https://github.com/TurboWarp/scratch-vm/issues/115
        // https://scratch.mit.edu/projects/788261699/
        if (code === 48 || code === 9) {
          return false
        }
      }
      return true
    }

    class Cast {
      /**
       * Scratch cast to number.
       * Treats NaN as 0.
       * In Scratch 2.0, this is captured by `interp.numArg.`
       * @param {*} value Value to cast to number.
       * @return {number} The Scratch-casted number value.
       */
      static toNumber(value) {
        // If value is already a number we don't need to coerce it with
        // Number().
        if (typeof value === 'number') {
          // Scratch treats NaN as 0, when needed as a number.
          // E.g., 0 + NaN -> 0.
          if (Number.isNaN(value)) {
            return 0
          }
          return value
        }
        const n = Number(value)
        if (Number.isNaN(n)) {
          // Scratch treats NaN as 0, when needed as a number.
          // E.g., 0 + NaN -> 0.
          return 0
        }
        return n
      }

      /**
       * Scratch cast to boolean.
       * In Scratch 2.0, this is captured by `interp.boolArg.`
       * Treats some string values differently from JavaScript.
       * @param {*} value Value to cast to boolean.
       * @return {boolean} The Scratch-casted boolean value.
       */
      static toBoolean(value) {
        // Already a boolean?
        if (typeof value === 'boolean') {
          return value
        }
        if (typeof value === 'string') {
          // These specific strings are treated as false in Scratch.
          if (
            value === '' ||
            value === '0' ||
            value.toLowerCase() === 'false'
          ) {
            return false
          }
          // All other strings treated as true.
          return true
        }
        // Coerce other values and numbers.
        return Boolean(value)
      }

      /**
       * Scratch cast to string.
       * @param {*} value Value to cast to string.
       * @return {string} The Scratch-casted string value.
       */
      static toString(value) {
        return String(value)
      }

      /**
       * Cast any Scratch argument to an RGB color array to be used for the renderer.
       * @param {*} value Value to convert to RGB color array.
       * @return {Array.<number>} [r,g,b], values between 0-255.
       */
      static toRgbColorList(value) {
        const color = Cast.toRgbColorObject(value)
        return [color.r, color.g, color.b]
      }

      /**
       * Cast any Scratch argument to an RGB color object to be used for the renderer.
       * @param {*} value Value to convert to RGB color object.
       * @return {RGBOject} [r,g,b], values between 0-255.
       */
      static toRgbColorObject(value) {
        let color
        if (typeof value === 'string' && value.substring(0, 1) === '#') {
          color = Color.hexToRgb(value)

          // If the color wasn't *actually* a hex color, cast to black
          if (!color) color = { r: 0, g: 0, b: 0, a: 255 }
        } else {
          color = Color.decimalToRgb(Cast.toNumber(value))
        }
        return color
      }

      /**
       * Determine if a Scratch argument is a white space string (or null / empty).
       * @param {*} val value to check.
       * @return {boolean} True if the argument is all white spaces or null / empty.
       */
      static isWhiteSpace(val) {
        return (
          val === null || (typeof val === 'string' && val.trim().length === 0)
        )
      }

      /**
       * Compare two values, using Scratch cast, case-insensitive string compare, etc.
       * In Scratch 2.0, this is captured by `interp.compare.`
       * @param {*} v1 First value to compare.
       * @param {*} v2 Second value to compare.
       * @returns {number} Negative number if v1 < v2; 0 if equal; positive otherwise.
       */
      static compare(v1, v2) {
        let n1 = Number(v1)
        let n2 = Number(v2)
        if (n1 === 0 && isNotActuallyZero(v1)) {
          n1 = NaN
        } else if (n2 === 0 && isNotActuallyZero(v2)) {
          n2 = NaN
        }
        if (isNaN(n1) || isNaN(n2)) {
          // At least one argument can't be converted to a number.
          // Scratch compares strings as case insensitive.
          const s1 = String(v1).toLowerCase()
          const s2 = String(v2).toLowerCase()
          if (s1 < s2) {
            return -1
          } else if (s1 > s2) {
            return 1
          }
          return 0
        }
        // Handle the special case of Infinity
        if (
          (n1 === Infinity && n2 === Infinity) ||
          (n1 === -Infinity && n2 === -Infinity)
        ) {
          return 0
        }
        // Compare as numbers.
        return n1 - n2
      }

      /**
       * Determine if a Scratch argument number represents a round integer.
       * @param {*} val Value to check.
       * @return {boolean} True if number looks like an integer.
       */
      static isInt(val) {
        // Values that are already numbers.
        if (typeof val === 'number') {
          if (isNaN(val)) {
            // NaN is considered an integer.
            return true
          }
          // True if it's "round" (e.g., 2.0 and 2).
          return val === Math.floor(val)
        } else if (typeof val === 'boolean') {
          // `True` and `false` always represent integer after Scratch cast.
          return true
        } else if (typeof val === 'string') {
          // If it contains a decimal point, don't consider it an int.
          return val.indexOf('.') < 0
        }
        return false
      }

      static get LIST_INVALID() {
        return 'INVALID'
      }

      static get LIST_ALL() {
        return 'ALL'
      }

      /**
       * Compute a 1-based index into a list, based on a Scratch argument.
       * Two special cases may be returned:
       * LIST_ALL: if the block is referring to all of the items in the list.
       * LIST_INVALID: if the index was invalid in any way.
       * @param {*} index Scratch arg, including 1-based numbers or special cases.
       * @param {number} length Length of the list.
       * @param {boolean} acceptAll Whether it should accept "all" or not.
       * @return {(number|string)} 1-based index for list, LIST_ALL, or LIST_INVALID.
       */
      static toListIndex(index, length, acceptAll) {
        if (typeof index !== 'number') {
          if (index === 'all') {
            return acceptAll ? Cast.LIST_ALL : Cast.LIST_INVALID
          }
          if (index === 'last') {
            if (length > 0) {
              return length
            }
            return Cast.LIST_INVALID
          } else if (index === 'random' || index === 'any') {
            if (length > 0) {
              return 1 + Math.floor(Math.random() * length)
            }
            return Cast.LIST_INVALID
          }
        }
        index = Math.floor(Cast.toNumber(index))
        if (index < 1 || index > length) {
          return Cast.LIST_INVALID
        }
        return index
      }
    }
    delete global.fetch
    delete global.XMLHttpRequest
    delete global.WebSocket
    delete global.Worker
    delete global.importScripts
    global.window = global
    global.console = {
      log: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
      trace: () => {},
      dir: () => {},
      time: () => {},
      timeLog: () => {},
      timeStamp: () => {},
      timeEnd: () => {},
      assert: () => {},
      clear: () => {},
      count: () => {},
      countReset: () => {},
      group: () => {},
      groupEnd: () => {},
      table: () => {},
      profile: () => {},
      profileEnd: () => {}
    }
    global.document = {
      createElement: () => ({
        style: {},
        setAttribute: () => {},
        getContext: () => ({
          fillRect: () => {},
          drawImage: () => {},
          getImageData: () => ({
            data: []
          }),
          putImageData: () => {},
          createImageData: () => [],
          setTransform: () => {},
          drawFocusIfNeeded: () => {},
          resetTransform: () => {}
        }),
        appendChild: () => {},
        addEventListener: () => {},
        removeEventListener: () => {}
      }),
      addEventListener: () => {},
      removeEventListener: () => {},
      body: {
        appendChild: () => {}
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      readyState: 'complete',
      documentElement: {
        style: {}
      }
    }
    let translation = {}
    const dummyTranslate = Object.assign(
      (message, args) => {
        if (message && typeof message === 'object') {
          return (
            translation?.['zh-cn']?.[message?.id] ??
            translation?.['en']?.[message?.id] ??
            message?.default
          )
        } else if (typeof message === 'string') {
          return (
            translation?.['zh-cn']?.[message] ??
            translation?.['en']?.[message] ??
            message
          )
        }
        return null
      },
      {
        setup(t) {
          if (t && typeof t === 'object') {
            translation = t
          }
        }
      }
    )
    const fakeVm = {
      getAllSprites() {
        return []
      },
      getEditingTarget() {
        return null
      },
      getRenderer() {
        return null
      },
      getRuntime() {
        return fakeVm.runtime
      },
      on() {},
      removeListener() {},
      emit() {},
      runtime: {
        getTargetById() {
          return null
        },
        getAllTargets() {
          return []
        },
        getFormatMessage: obj => {
          global.Scratch.translate.setup(obj)
          return global.Scratch.translate
        }
      }
    }
    global.Scratch = {
      ArgumentType: {
        ANGLE: 'angle',
        BOOLEAN: 'Boolean',
        COLOR: 'color',
        NUMBER: 'number',
        STRING: 'string',
        MATRIX: 'matrix',
        NOTE: 'note',
        IMAGE: 'image',
        XIGUA_MATRIX: 'xigua_matrix',
        XIGUA_WHITE_BOARD_NOTE: 'xigua_white_board_note',
        CCW_HAT_PARAMETER: 'ccw_hat_parameter',
        COSTUME: 'costume',
        SOUND: 'sound'
      },
      BlockType: {
        BOOLEAN: 'Boolean',
        BUTTON: 'button',
        LABEL: 'label',
        COMMAND: 'command',
        CONDITIONAL: 'conditional',
        EVENT: 'event',
        HAT: 'hat',
        LOOP: 'loop',
        REPORTER: 'reporter',
        XML: 'xml'
      },
      TargetType: {
        SPRITE: 'sprite',
        STAGE: 'stage'
      },
      extensions: {
        unsandboxed: true,
        register: function (ext) {
          global.extensionInstance = ext
        }
      },
      Cast,
      Color,
      vm: fakeVm,
      runtime: fakeVm.runtime,
      renderer: null,
      translate: dummyTranslate
    }
    global.extensionInstance = null
  })
  const timeoutPm = new Promise(resolve =>
    setTimeout(() => {
      resolve({
        result: 'error',
        error: 'Timeout',
        info: null
      })
    }, timeout * 1000)
  )
  let result = sandbox.evaluate(async code => {
    try {
      const AsyncFunction = Object.getPrototypeOf(
        async function () {}
      ).constructor
      const fn = new AsyncFunction(code)
      await fn()
      if (globalThis.tempExt) {
        globalThis.extensionInstance = new globalThis.tempExt.Extension(
          globalThis.runtime
        )
      }
      return {
        result: 'success',
        error: null,
        info: JSON.parse(JSON.stringify(globalThis.extensionInstance.getInfo()))
      }
    } catch (e) {
      return {
        result: 'error',
        error: e instanceof Error ? e.stack : String(e),
        info: null
      }
    }
  }, code)
  return Promise.race([result, timeoutPm]).then(res => {
    sandbox.dispose()
    return res
  })
}
