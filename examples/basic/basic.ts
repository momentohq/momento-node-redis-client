import {
  RedisClientType,
  RedisModules,
  RedisFunctions,
  RedisScripts,
  commandOptions as nodeRedisCommandOptions,
} from '@redis/client';
import {Command, Option} from 'commander';
import * as MomentoRedis from 'momento-redis-client';
import * as Redis from './redis-client';
import {v4} from 'uuid';
import {
  CacheClient,
  Configurations,
  CredentialProvider,
} from 'momento-redis-client/node_modules/@gomomento/sdk'; // TODO change this once client is published

async function main(): Promise<void> {
  const program = new Command();
  program
    .addOption(new Option('-r --redis', 'use redis'))
    .addOption(new Option('-m --momento', 'use momento').conflicts('redis'))
    .addOption(new Option('-k --key <key>', 'key').default('key'))
    .addOption(new Option('-v --value <value>', 'value').default('value'))
    .addOption(
      new Option('-c --cacheName <cacheName>', 'cacheName').default('cache')
    )
    .addOption(new Option('--ttl <ttl>', 'ttl').default('60'));
  program.parse(process.argv);
  const options = program.opts();

  // Initialize client
  let client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
  let commandOptions: typeof nodeRedisCommandOptions;
  if (options.redis) {
    client = Redis.createClient();
    commandOptions = nodeRedisCommandOptions;
    console.log('using node-redis');
  } else if (options.momento) {
    client = MomentoRedis.createClient(
      new CacheClient({
        configuration: Configurations.Laptop.v1(),
        credentialProvider: CredentialProvider.fromEnvironmentVariable({
          environmentVariableName: 'MOMENTO_AUTH_TOKEN',
        }),
        defaultTtlSeconds: options.ttl as number,
      }),
      options.cacheName as string
    );
    commandOptions = MomentoRedis.commandOptions;
    console.log('using momento-node-redis');
  } else {
    throw new Error('invalid option. need to specify one of momento or redis');
  }

  const [key, value] = [options.key as string, options.value as string];

  client.on('error', err => console.error('Redis Client Error', err));
  await client.connect();

  const getValue = await client.get(key);
  console.log(`get "${key}": "${getValue ?? 'null'}"`);

  const setReturnValue = await client.set(key, value, {EX: 60, NX: true});
  console.log(
    `set "${key}"="${value}": ${setReturnValue?.toString() ?? 'null'}`
  );

  const getValue2 = await client.get(
    commandOptions({returnBuffers: true}),
    key
  );
  console.log(
    `get "${key}": "${getValue2?.toString() ?? 'null'}" (${typeof getValue2})`
  );

  const randomKey = v4();
  const setnxReturnValue = await client.setNX(
    commandOptions({returnBuffers: true}),
    randomKey,
    v4()
  );
  console.log(`setNX "${randomKey}": ${setnxReturnValue.toString()}`);
  const setnxReturnValue2 = await client.setNX(randomKey, v4());
  console.log(`setNX "${randomKey}": ${setnxReturnValue2.toString()}`);

  await client.disconnect();
}

main()
  .then(() => {
    console.log('done');
  })
  .catch((e: Error) => {
    console.error(e);
  });
