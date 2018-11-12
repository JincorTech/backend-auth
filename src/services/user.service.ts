import { StorageService, StorageServiceType } from './storage.service';
import * as uuid from 'node-uuid';
import * as bcrypt from 'bcrypt-nodejs';
import { injectable, inject } from 'inversify';
import 'reflect-metadata';

type UserData = {
  email: string,
  tenant: string,
  login: string,
  password: string,
  sub: string
  scope?: any
};

export interface UserServiceInterface {
  get: (key: string) => Promise<string>;
  listForTenant: (tenantId: String) => Promise<any>;
  create: (userData: UserData) => Promise<any>;
  del: (key: string) => Promise<any>;
  getKey: (tenant: string, login: string) => string;
}

/**
 * UserService
 */
@injectable()
export class UserService implements UserServiceInterface {
  /**
   * constructor
   *
   * @param  storageService  redis client
   */
  constructor(
    @inject(StorageServiceType) private storageService: StorageService
  ) { }

  /**
   * Return user's data
   *
   * @param  key  user's key (tenant + login)
   * @return        promise
   */
  get(key: string): Promise<string> {
    return this.storageService.get(key);
  }

  /**
   * Save user's data
   *
   * @param userData user info
   * @return promise
   */
  async create(userData: UserData): Promise<any> {
    const { email, tenant, login, password: passwordHash, scope, sub } = userData;

    const password: string = bcrypt.hashSync(passwordHash);
    const key: string = this.getKey(tenant, login);
    const data: any = {
      id: uuid.v4(),
      login,
      password,
      email,
      tenant,
      scope,
      sub
    };
    await this.storageService.set(key, JSON.stringify(data));
    delete data.password;
    return data;
  }

  /**
   * List users for specified tenant
   * 
   * @param tenantId string with id of tenant to list users for
   * @return Promise
   */
  async listForTenant(tenantId: String): Promise<any> {
    this.storageService.client.keys('*' + tenantId + ':', async (err, keys) => {
      console.log("I've got some keys here: ", keys, err)
      if (err) return [];
      this.storageService.client.mget(keys, (err, users) => {
        if (err) return [];
        console.log('We got something here: ', users);
        return users;
      });
    })
  }

  /**
   * Deletes user by login
   *
   * @param key
   * @return promise
   */
  del(key: string): Promise<any> {
    return this.storageService.del(key);
  }

  getKey(tenant: string, login: string) {
    return `${tenant}:${login}`;
  }
}

const UserServiceType = Symbol('UserServiceInterface');
export { UserServiceType };
