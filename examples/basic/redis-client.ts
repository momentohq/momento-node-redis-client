import {
  RedisModules,
  RedisFunctions,
  RedisScripts,
  RedisClientType,
} from '@redis/client';
import * as nodeRedis from '@redis/client';

export function createClient(): RedisClientType<
  RedisModules,
  RedisFunctions,
  RedisScripts
> {
  const client = nodeRedis.createClient();
  return client;
}
