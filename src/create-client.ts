import {MomentoRedisClient} from './momento-redis-client';

import {
  RedisModules,
  RedisFunctions,
  RedisScripts,
  RedisClientType,
} from '@redis/client';

import {CacheClient} from '@gomomento/sdk';

export function createClient(
  client: CacheClient,
  cacheName = 'cache'
): RedisClientType<RedisModules, RedisFunctions, RedisScripts> {
  return MomentoRedisClient.create(client, cacheName);
}
