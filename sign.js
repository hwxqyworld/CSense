const forge = require('node-forge')
const fs = require('fs/promises')
const readline = require('readline/promises')
;(async () => {
  const PRIVATE_KEY_PEM = await fs.readFile('private.key', 'utf8')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const PrivateKey = forge.pki.privateKeyFromPem(PRIVATE_KEY_PEM)

  function sign(text) {
    const md = forge.md.sha256.create()
    md.update(text, 'utf8')
    return btoa(PrivateKey.sign(md, 'RSASSA-PKCS1-V1_5'))
  }

  const text = await rl.question('请输入需要签名的文本：')
  console.log('签名结果：')
  console.log(sign(text))
  rl.close()
})()
