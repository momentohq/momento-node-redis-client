import {
  RedisModules,
  RedisFunctions,
  RedisScripts,
  RedisClientType,
  SetOptions,
} from '@redis/client';

import {
  CacheClient,
  CacheGet,
  CacheSet,
  CacheSetIfNotExists,
  CacheDelete,
} from '@gomomento/sdk';

import {IResponseError} from '@gomomento/sdk/dist/src/messages/responses/response-base';

import {ClientCommandOptions} from '@redis/client/dist/lib/client';
import {isCommandOptions} from '@redis/client/dist/lib/command-options';
import {RedisCommandArgument} from '@redis/client/dist/lib/commands';
import {ErrorReply} from '@redis/client/dist/lib/errors';
import {EventEmitter} from 'stream';

const OK = 'OK';

type GetParams = [key: RedisCommandArgument];
type SetParams = [
  key: RedisCommandArgument,
  value: RedisCommandArgument | number,
  options?: SetOptions
];
type DelParams = [keys: RedisCommandArgument | Array<RedisCommandArgument>];
type SetNXParams = [
  key: RedisCommandArgument,
  value: RedisCommandArgument,
  options: {ttl?: number}
];

type CommandParams = GetParams | SetParams | SetNXParams | DelParams;
type WithOptionalOptions<T extends CommandParams> =
  | T
  | [options: ClientCommandOptions, ...args: T];

type OptionalRedisCommandArgument = RedisCommandArgument | null;

const UNEXPECTED_RESPONSE = new ErrorReply('Unexpected response');

export interface IMomentoRedisClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  get(
    ...args: WithOptionalOptions<GetParams>
  ): Promise<OptionalRedisCommandArgument>;
  GET: IMomentoRedisClient['get'];
  set(
    ...args: WithOptionalOptions<SetParams>
  ): Promise<OptionalRedisCommandArgument>;
  SET: IMomentoRedisClient['set'];
  setNX(...args: WithOptionalOptions<SetNXParams>): Promise<boolean>;
  SETNX: IMomentoRedisClient['setNX'];
  del(...args: WithOptionalOptions<DelParams>): Promise<number>;
  DEL: IMomentoRedisClient['del'];
}

export class MomentoRedisClient
  extends EventEmitter
  implements IMomentoRedisClient
{
  private client: CacheClient;
  private cacheName: string;
  private _isOpen = false;

  constructor(client: CacheClient, cacheName: string) {
    super();
    this.client = client;
    this.cacheName = cacheName;
  }

  public static create(
    client: CacheClient,
    cacheName: string
  ): RedisClientType<RedisModules, RedisFunctions, RedisScripts> {
    return new MomentoRedisClient(
      client,
      cacheName
    ) as unknown as RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public async connect(): Promise<void> {
    // TODO this should be ping once it is in the client
    await this.get('sRITPPymF1yEB6rFizrI0ZeCMq012uXFjBNRNokAv4');
    this._isOpen = true;
  }

  public async disconnect(): Promise<void> {
    return await new Promise(resolve => {
      this._isOpen = false;
      resolve();
    });
  }

  private static extractReturnBuffersOptionFromArgs<T extends CommandParams>(
    args: WithOptionalOptions<T>
  ): [returnBuffers: boolean, otherArgs: T] {
    let returnBuffers = false;
    if (isCommandOptions(args[0])) {
      const options = args[0] as ClientCommandOptions;
      returnBuffers = options?.returnBuffers ?? false;
      args = args.slice(1) as T;
    }

    return [returnBuffers, args as T];
  }

  public async get(
    ...args: WithOptionalOptions<GetParams>
  ): Promise<OptionalRedisCommandArgument> {
    const [returnBuffers, otherArgs] =
      MomentoRedisClient.extractReturnBuffersOptionFromArgs(args);
    return await this.sendGet(returnBuffers, otherArgs as GetParams);
  }

  // eslint-disable-next-line @typescript-eslint/unbound-method
  public GET = this.get;

  private async sendGet(
    returnBuffers: boolean,
    [key]: GetParams
  ): Promise<OptionalRedisCommandArgument> {
    const response = await this.client.get(this.cacheName, key);
    if (response instanceof CacheGet.Hit) {
      if (returnBuffers) {
        return Buffer.from(response.valueUint8Array());
      } else {
        return response.valueString();
      }
    } else if (response instanceof CacheGet.Miss) {
      return null;
    } else if (response instanceof CacheGet.Error) {
      this.emitError(response);
    } else {
      this.emitError(UNEXPECTED_RESPONSE);
    }
    return null;
  }

  public async set(
    ...args: WithOptionalOptions<SetParams>
  ): Promise<OptionalRedisCommandArgument> {
    const [, otherArgs] =
      MomentoRedisClient.extractReturnBuffersOptionFromArgs(args);
    return await this.sendSet(otherArgs as SetParams);
  }

  // eslint-disable-next-line @typescript-eslint/unbound-method
  public SET = this.set;

  private async sendSet([
    key,
    value,
    options,
  ]: SetParams): Promise<OptionalRedisCommandArgument> {
    if (typeof value === 'number') {
      value = value.toString();
    }

    let ttl: number | undefined;
    if (options?.EX !== undefined) {
      ttl = options.EX;
    } else if (options?.PX !== undefined) {
      // TODO test dividing by 1000
      ttl = options.PX / 1000;
    } else if (options?.EXAT !== undefined) {
      ttl = options.EXAT - Math.floor(Date.now() / 1000);
    } else if (options?.PXAT !== undefined) {
      ttl = Math.floor((options.PXAT - Date.now()) / 1000);
    } else if (options?.KEEPTTL) {
      // Unsupported
    }

    if (options?.NX) {
      const stored = await this.setNX(key, value, {ttl});
      return stored ? OK : null;
    } else if (options?.XX) {
      // unsupportedargs.push('XX');
    }

    if (options?.GET) {
      // unsupported
    }

    const response = await this.client.set(this.cacheName, key, value, {
      ttl: ttl,
    });

    if (response instanceof CacheSet.Success) {
      return OK;
    } else if (response instanceof CacheSet.Error) {
      this.emit('error', response);
    } else {
      this.emit('error', UNEXPECTED_RESPONSE);
    }
    return null;
  }

  public async setNX(
    ...args: WithOptionalOptions<SetNXParams>
  ): Promise<boolean> {
    const [, otherArgs] =
      MomentoRedisClient.extractReturnBuffersOptionFromArgs(args);
    return await this.sendSetNX(otherArgs as SetNXParams);
  }

  // eslint-disable-next-line @typescript-eslint/unbound-method
  public SETNX = this.setNX;

  private async sendSetNX([
    key,
    value,
    options,
  ]: SetNXParams): Promise<boolean> {
    const setNxResponse = await this.client.setIfNotExists(
      this.cacheName,
      key,
      value,
      options
    );
    if (setNxResponse instanceof CacheSetIfNotExists.Stored) {
      return true;
    } else if (setNxResponse instanceof CacheSetIfNotExists.NotStored) {
      return false;
    } else if (setNxResponse instanceof CacheSet.Error) {
      this.emit('error', setNxResponse);
    } else {
      this.emit('error', UNEXPECTED_RESPONSE);
    }
    return false;
  }

  public async del(...args: WithOptionalOptions<DelParams>): Promise<number> {
    const [, otherArgs] =
      MomentoRedisClient.extractReturnBuffersOptionFromArgs(args);
    if (Array.isArray(otherArgs[0])) {
      const keys = otherArgs[0] as RedisCommandArgument[];
      const promises = keys.map(key => this.sendDel([key]));
      const results = await Promise.all(promises);
      return results.reduce((a, b) => a + b, 0);
    } else {
      const key = otherArgs as [RedisCommandArgument];
      return await this.sendDel(key);
    }
  }

  // eslint-disable-next-line @typescript-eslint/unbound-method
  public DEL = this.del;

  private async sendDel([key]: [key: RedisCommandArgument]): Promise<number> {
    const response = await this.client.delete(this.cacheName, key);
    if (response instanceof CacheDelete.Success) {
      return 1;
    } else if (response instanceof CacheDelete.Error) {
      this.emit('error', response);
    } else {
      this.emit('error', UNEXPECTED_RESPONSE);
    }
    return 0;
  }

  private emitError(error: IResponseError | ErrorReply): void {
    const errorReply =
      error instanceof ErrorReply ? error : new ErrorReply(error.message());
    this.emit('error', errorReply);
  }
}

/* TODO unimplemented commands should return an errror
function addUnimplementedMethods() {
  for (const name of Object.keys(RedisCommands)) {
    const methodName = name as keyof typeof MomentoRedisClient.prototype;
    if (methodName in MomentoRedisClient) {
      continue;
    }

    MomentoRedisClient.prototype[methodName] = function (
      this: MomentoRedisClient
    ): void {
      const error = new ErrorReply(
        `Command ${name} is not implemented in MomentoRedisClient`
      );
      this.emit('error', error);
    };
  }
}
*/
