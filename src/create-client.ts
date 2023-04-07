import {MomentoRedisClient, IMomentoRedisClient} from './momento-redis-client';

import {
  RedisModules,
  RedisFunctions,
  RedisScripts,
  RedisClientType,
} from '@redis/client';

import {CacheClient} from '@gomomento/sdk';

/**
 * Instantiate a new Redis client with a Momento cache.
 * @param client The Momento cache client.
 * @param cacheName The name of the cache to use.
 * @returns A new Redis client backed by Momento.
 */
export function createClient(
  client: CacheClient,
  cacheName = 'cache'
): RedisClientType<RedisModules, RedisFunctions, RedisScripts> {
  return MomentoRedisClient.create(client, cacheName);
}

/**
 * Instantiate a new Redis client with a Momento cache.
 *
 * This client is scoped to only the methods currently implemented,
 * ie those defined in the IMomentoRedisClient interface.
 * @param client The Momento cache client.
 * @param cacheName The name of the cache to use.
 * @returns A new Redis client backed by Momento.
 */
export function createScopedClient(
  client: CacheClient,
  cacheName = 'cache'
): IMomentoRedisClient {
  return MomentoRedisClient.create(client, cacheName) as IMomentoRedisClient;
}
