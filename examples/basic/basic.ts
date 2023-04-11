import {
  RedisClientType,
  RedisModules,
  RedisFunctions,
  RedisScripts,
} from '@redis/client';
import * as nodeRedis from '@redis/client';
import {Command, Option, OptionValues} from 'commander';
import * as momentoRedis from 'momento-redis-client';
import {momento, commandOptions} from 'momento-redis-client';

async function main(): Promise<void> {
  const options = parseCliOpts();

  // This will construct a regular node-redis client, or a momento-backed redis client,
  //  depending on which CLI options you pass.
  const client: RedisClientType<RedisModules, RedisFunctions, RedisScripts> =
    await initializeRedisClient(options);

  const key = 'key1';
  const value = 'value=';

  // From this point forward the code will work with either Momento or Redis, with no changes!
  client.on('error', err => console.error('Redis Client Error', err));
  await client.connect();

  console.log('');
  console.log(`Issuing a 'get' for key '${key}', which we have not yet set.`);
  const getValue = await client.get(key);
  console.log(`result '${getValue ?? 'null'}'`);

  console.log('');
  console.log(`Issuing a 'set' for key '${key}', with value '${value}'.`);
  const setReturnValue = await client.set(key, value, {EX: 60, NX: true});
  console.log(`result: ${setReturnValue?.toString() ?? 'null'}`);

  console.log('');
  console.log(`Issuing another 'get' for key ${key}.`);
  const getValue2 = await client.get(key);
  console.log(
    `result: '${getValue2?.toString() ?? 'null'}' (${
      getValue2?.constructor?.name ?? 'null'
    })`
  );

  console.log('');
  console.log(
    `Issuing another 'get' for key ${key}, with returnBuffers: true.`
  );
  const getValue3 = await client.get(
    commandOptions({returnBuffers: true}),
    key
  );
  console.log(
    `result: '${getValue3?.toString() ?? 'null'}' (${
      getValue3?.constructor?.name ?? 'null'
    })`
  );

  console.log('');
  const hashKey = 'key2';
  const hashValue = {three: 3, four: 4};
  console.log(
    `Issuing an HSET for key '${hashKey}' with value: ${JSON.stringify(
      hashValue
    )}`
  );
  const hSetResponse = await client.hSet(hashKey, hashValue);
  console.log(`result: ${hSetResponse}`);

  console.log('');
  console.log(`Issuing an HGETALL for key '${hashKey}'.`);
  const hGetAllResponse = await client.hGetAll(
    commandOptions({returnBuffers: false}),
    hashKey
  );
  console.log(`result: ${JSON.stringify(hGetAllResponse)}`);

  console.log('');

  await client.disconnect();
}

function parseCliOpts() {
  const program = new Command();
  program
    .addOption(new Option('-r --redis', 'use redis'))
    .addOption(new Option('-m --momento', 'use momento').conflicts('redis'))
    .addOption(
      new Option('-c --cacheName <cacheName>', 'cacheName').default('cache')
    )
    .addOption(new Option('--ttl <ttl>', 'ttl').default('60'))
    .showHelpAfterError(true);
  program.parse(process.argv);
  const options = program.opts();
  if (!(options.momento || options.redis)) {
    console.error(
      'Missing required argument; you must specify either --momento or --redis\n'
    );
    program.help();
    throw new Error('Missing required argument');
  }
  return options;
}

async function initializeRedisClient(
  options: OptionValues
): Promise<RedisClientType<RedisModules, RedisFunctions, RedisScripts>> {
  if (options.redis) {
    console.log('using node-redis');
    return nodeRedis.createClient();
  } else if (options.momento) {
    const cacheName = options.cacheName as string;
    console.log(`using momento-node-redis with cache '${cacheName}'`);
    const momentoClient = createMomentoClient(options.ttl as number);
    // This is only necessary if you have not already created your momento cache!
    await momentoClient.createCache(cacheName);
    return momentoRedis.createClient(momentoClient, cacheName);
  } else {
    throw new Error('invalid option. need to specify one of momento or redis');
  }
}


function createMomentoClient(defaultTtlSeconds: number): momento.CacheClient {
  return new momento.CacheClient({
    configuration: momento.Configurations.Laptop.v1(),
    credentialProvider: momento.CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_AUTH_TOKEN',
    }),
    defaultTtlSeconds: defaultTtlSeconds,
  });
}

main()
  .then(() => {
    console.log('done');
  })
  .catch((e: Error) => {
    console.error(e);
  });
