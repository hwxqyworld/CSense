import { readFileSync, writeFileSync } from 'fs'
import header from './header.mjs'
import { CompressionStream } from 'stream/web'
const source = readFileSync('dist/index.global.js', 'utf-8')
console.log('Compressing...')
function ab2str(buf) {
  let result = ''
  const bufView = new Uint8Array(buf)
  for (let i = 0; i < bufView.length; i++) {
    result += String.fromCharCode(bufView[i])
  }
  return result
}
async function compressCode(code) {
  const blob = new Blob([code])
  const s = new CompressionStream('gzip')
  const compressed = blob.stream().pipeThrough(s)
  return ab2str(await new Response(compressed).arrayBuffer())
}
const compressedRaw = await compressCode(source)
const compressedJson = JSON.stringify(compressedRaw)
  .replaceAll('\\u00', '\\x')
  .replaceAll('\x7f', '\\x7f')
const extractor = `(async W=>{function A(n){const T=Function['prototype']['bind'];Function['prototype']['bind']=function(o,...J){if(typeof o==='object'&&o!==null&&Object['prototype']['hasOwnProperty']['call'](o,'editingTarget')&&Object['prototype']['hasOwnProperty']['call'](o,'runtime'))return Function['prototype']['bind']=T,n(o),T['call'](this,o,...J);return T['call'](this,o,...J);};}globalThis['__CSense_vm_trap']=new Promise(A);const K=new ArrayBuffer(W['length']),g=new Uint8Array(K);for(let n=0x0;n<W['length'];n++){g[n]=W['charCodeAt'](n);};const G=new Blob([K]),d=new DecompressionStream('gzip'),V=G['stream']()['pipeThrough'](d),c=await new Response(V)['text']();eval(c);})(${compressedJson});`
writeFileSync('dist/index.global.js', header + '\n' + extractor)
