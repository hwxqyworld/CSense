/**
 * @template T
 * @typedef {
 *  promise: Promise<T>,
 *  resolve: (value: T | PromiseLike<T>) => void,
 *  reject: (reason?: any) => void
 * } PromiseWithResolvers
 */

/**
 * Creates a promise with exposed resolve and reject functions.
 * @template T
 * @returns {PromiseWithResolvers<T>} An object containing the promise, resolve, and reject.
 */
export default function withResolvers() {
  let resolveFn, rejectFn
  const promise = new Promise((resolve, reject) => {
    resolveFn = resolve
    rejectFn = reject
  })
  return {
    promise,
    resolve: resolveFn,
    reject: rejectFn
  }
}
