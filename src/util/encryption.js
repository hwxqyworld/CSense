import PUBLIC_KEY_PEM from 'src/asset/cert.pem'
import forge from 'node-forge'

const PublicKey = forge.pki.publicKeyFromPem(PUBLIC_KEY_PEM)

export function verify(text, signature) {
  const md = forge.md.sha256.create()
  md.update(text, 'utf8')
  return PublicKey.verify(
    md.digest().getBytes(),
    atob(signature),
    'RSASSA-PKCS1-V1_5'
  )
}
