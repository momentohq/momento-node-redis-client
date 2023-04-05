import {v4} from 'uuid';
import {CacheClientProps} from '@gomomento/sdk/dist/src/cache-client-props';
import {
  CreateCache,
  Configurations,
  DeleteCache,
  MomentoErrorCode,
  CacheClient,
  CredentialProvider,
} from '@gomomento/sdk';

import {createClient as createMomentoBackedClient} from '../src/';

import {
  RedisClientType,
  RedisModules,
  RedisFunctions,
  RedisScripts,
  createClient as createRedisBackedClient,
} from '@redis/client';

export function testCacheName(): string {
  const name = process.env.TEST_CACHE_NAME || 'js-integration-test-default';
  return name + v4();
}

const deleteCacheIfExists = async (momento: CacheClient, cacheName: string) => {
  const deleteResponse = await momento.deleteCache(cacheName);
  if (deleteResponse instanceof DeleteCache.Error) {
    if (deleteResponse.errorCode() !== MomentoErrorCode.NOT_FOUND_ERROR) {
      throw deleteResponse.innerException();
    }
  }
};

export async function WithCache(
  client: CacheClient,
  cacheName: string,
  block: () => Promise<void>
) {
  await deleteCacheIfExists(client, cacheName);
  await client.createCache(cacheName);
  try {
    await block();
  } finally {
    await deleteCacheIfExists(client, cacheName);
  }
}

export const IntegrationTestCacheClientProps: CacheClientProps = {
  configuration: Configurations.Laptop.latest(),
  credentialProvider: CredentialProvider.fromEnvironmentVariable({
    environmentVariableName: 'TEST_AUTH_TOKEN',
  }),
  defaultTtlSeconds: 60,
};

function momentoClientForTesting() {
  return new CacheClient(IntegrationTestCacheClientProps);
}

export function isRedisBackedTest() {
  return process.env.TEST_REDIS === '1';
}

function getRedisUrl() {
  const redisHost = process.env.TEST_REDIS_HOST || 'localhost';
  const redisPort = process.env.TEST_REDIS_PORT || '6379';
  return `redis://${redisHost}:${redisPort}`;
}

export function SetupIntegrationTest(): {
  client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
} {
  if (isRedisBackedTest()) {
    return setupIntegrationTestWithRedis();
  } else {
    return setupIntegrationTestWithMomento();
  }
}

function setupIntegrationTestWithMomento() {
  const cacheName = testCacheName();

  beforeAll(async () => {
    // Use a fresh client to avoid test interference with setup.
    const momento = momentoClientForTesting();
    await deleteCacheIfExists(momento, cacheName);
    const createResponse = await momento.createCache(cacheName);
    if (createResponse instanceof CreateCache.Error) {
      throw createResponse.innerException();
    }
  });

  afterAll(async () => {
    // Use a fresh client to avoid test interference with teardown.
    const momento = momentoClientForTesting();
    const deleteResponse = await momento.deleteCache(cacheName);
    if (deleteResponse instanceof DeleteCache.Error) {
      throw deleteResponse.innerException();
    }
  });

  const momentoClient = momentoClientForTesting();
  const momentoNodeRedisClient = createMomentoBackedClient(
    momentoClient,
    cacheName
  );

  return {client: momentoNodeRedisClient};
}

function setupIntegrationTestWithRedis() {
  const url = getRedisUrl();

  const client = createRedisBackedClient({
    url: url,
  });

  beforeAll(async () => {
    if (!client.isOpen) {
      await client.connect();
    }
  });

  afterAll(async () => {
    // Tidy up after ourselves to not clutter up a long running Redis instance.
    if (!client.isOpen) {
      return;
    }

    await client.disconnect();
  });

  return {client: client};
}
