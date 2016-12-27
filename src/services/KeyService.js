import redis from 'redis'
import Promise from 'bluebird'

import config from '../config'
import uuid from 'node-uuid'
import JWT from '../utils/jwt'

const {
  redis: { port, host },
  key_service: { expires_seconds: EXPIRATION_TIME }
} = config

const client = Promise.promisifyAll(redis.createClient(port, host))
const sessionKey = (userId, deviceId, issuedAt) => userId + deviceId + issuedAt

const KeyService = {
  // Redis client
  client,

  // Retrieve a JWT user key
  get(sessionKey) {
    return this.client.getAsync(sessionKey)
  },

  // Generate and store a new JWT user key
  async set(user, deviceId) {
    const userKey = uuid.v4()
    const issuedAt = new Date().getTime()
    const expiresAt = issuedAt + (EXPIRATION_TIME * 1000)

    const key = sessionKey(user.id, deviceId, issuedAt)
    const token = JWT.generate(user, deviceId, key, userKey, issuedAt, expiresAt)

    await this.client.setAsync(key, userKey)
    await this.client.expireAsync(key, EXPIRATION_TIME)

    return token
  },

  // Manually remove a JWT user key
  delete(sessionKey) {
    return this.client.delAsync(sessionKey)
  }
}

export default KeyService