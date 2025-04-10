import { Database } from '../api/ccwdata'
export default {
  userInfo: null,
  myInfo: null,
  vm: null,
  /** @type {Record<string, Database>} */
  ccwdata: Object.freeze({
    /** @type {Database} */
    project: new Database(),
    /** @type {Database} */
    user: new Database()
  }),
  mmo: {
    /** @type {RegExp[]} */
    broadcastBlackList: []
  },
  isIdentified: false
}
