import { Bridge } from './bridge'
export type Prepatcher<T = {}> = (
  globalThis: WindowOrWorkerGlobalScope & T,
  bridge: Bridge
) => void | string
interface EvaluateResult {
  status: 'resolve' | 'reject'
  value: unknown
}
export class Sandbox {
  private bridge: Bridge
  private scope: Worker
  private url: string
  async evaluate<T extends unknown[], RetT>(
    fn: (...args: T) => RetT,
    ...args: T
  ): Promise<Awaited<RetT>> {
    const result = (await this.bridge.send('eval', [
      fn.toString(),
      args
    ])) as EvaluateResult
    if (result.status == 'resolve') return result.value as Awaited<RetT>
    throw result.value
  }
  dispose() {
    this.scope.terminate()
    URL.revokeObjectURL(this.url)
  }
  regist(
    method: string,
    trigger: (val: unknown[]) => unknown | Promise<unknown>
  ): void {
    this.bridge.recv(method, trigger)
  }
  constructor(prepatch?: Prepatcher) {
    this.scope = new Worker(
      (this.url = URL.createObjectURL(
        new Blob(
          [
            `
          ;((prepatch) => {
            var Bridge = ${Bridge}
            const post = globalThis.postMessage
            const bridge = new Bridge(post.bind(this.scope), ev =>
              globalThis.addEventListener('message', ev)
            )
            prepatch.call(globalThis, globalThis, bridge)
            bridge.recv('eval', (val) => {
              const [code, args] = val
              const ret = new Function('return ' + code)()
              if (ret instanceof Function) return ret.apply(globalThis, args)
              return ret
            })
          })(${prepatch ? prepatch.toString() : ''})
        `
          ],
          { type: 'text/javascript' }
        )
      ))
    )
    this.bridge = new Bridge(this.scope.postMessage.bind(this.scope), ev =>
      this.scope.addEventListener('message', ev)
    )
  }
}
