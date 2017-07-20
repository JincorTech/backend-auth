import config from '../config'
import * as jwt from 'jsonwebtoken'
import KeyService from './key.service'

const { algorithm, secret_separator, secret } = config.jwt

/**
 *  JWT service
 */
export class JWTService {

  /**
   * Creates jwt service instance
   *
   * @param  secret           secret key
   * @param  algorithm        encrypted algorithm
   * @param  secret_separator secret seporator
   */
  constructor(private secret: string, private algorithm: string, private secret_separator: string) {}

  /**
   * Generate user's token
   *
   * @param  user       user data object
   * @param  deviceId   device id
   * @param  sessionKey current user's session
   * @param  userKey    user's unique key
   * @param  issuedAt   time of creation
   * @param  expiresIn  expiration time
   * @return  generated token
   */
  generate(user: any, deviceId: string, sessionKey: string, userKey: string, issuedAt: number, expiresIn: number): string {
    const { id, login, scope, sub } = user

    if (!id || !login || !sub) {
      throw new Error('user.id and user.login are required parameters')
    }

    const payload = {
      id,
      login,
      scope,
      deviceId,
      jti: sessionKey,
      iat: issuedAt,
      sub,
      aud: 'jincor.com'
    }

    const secret = this.generateSecret(userKey)

    return jwt.sign(payload, secret, {algorithm: this.algorithm, expiresIn})
  }


  /**
   * Generate tenant's token
   *
   * @param  tenant      user data object
   * @param  sessionKey current user's session
   * @param  userKey    user's unique key
   * @param  issuedAt   time of creation
   * @return  generated token
   */
  generateTenant(tenant: any, sessionKey: string, userKey: string, issuedAt: number): string {
    const { id, login, } = tenant

    if (!id || !login) {
      throw new Error('tenant id and tenant login are required parameters')
    }

    const payload = {
      id,
      login,
      jti: sessionKey,
      iat: issuedAt,
      aud: 'jincor.com'
    }

    const secret = this.generateSecret(userKey)

    return jwt.sign(payload, secret, {algorithm: this.algorithm})
  }


  /**
   * Verify token
   *
   * @param  token  user's token
   * @return  promise
   */
  async verify(token: string): Promise<boolean> {
    const decoded = jwt.decode(token)

    if (!decoded) {
      return false
    }

    const userKey = await KeyService.get(decoded.jti)
    const secret = this.generateSecret(userKey)

    try {
      jwt.verify(token, secret, {algorithms: [this.algorithm]})
      return true
    } catch (e) {
      return false
    }
  }

  static decode(token: string): any {
    return jwt.decode(token)
  }


  /**
   * Generate secret key
   *
   * @param  userKey  unique user's key
   * @return generated secret
   */
  private generateSecret(userKey: string): string {
    return this.secret + this.secret_separator + userKey
  }
}

export default new JWTService(secret, algorithm, secret_separator)
