# Welcome to the momento-node-redis-client contributing guide :wave:

Thank you for taking your time to contribute to our Momento @redis/client wrapper!
<br/>
This guide will provide you information to start your own development and testing.
<br/>
Happy coding :dancer:
<br/>

## Requirements :coffee:

- Node version [14 or higher](https://nodejs.org/en/download/) is required
- A Momento Auth Token is required, you can generate one using the [Momento CLI](https://github.com/momentohq/momento-cli)

<br/>

## First-time setup :wrench:

```
# Install dependencies
npm install
```

<br />

## Build :computer:

```
npm run build
```

<br/>

## Linting :flashlight:

```
npm run lint
```

<br/>

## Tests :zap:

### Run integration tests against Momento

```
TEST_AUTH_TOKEN=<YOUR_AUTH_TOKEN> npm run test-momento
```

### Run integration tests against Redis

First run Redis either natively or in a Docker container. Here is an example of running Redis in a Docker container:

```
docker run -it -p 6379:6379 redis
```

Then run the tests:

```
TEST_REDIS=1 npm run test-redis
```

This assumes the Redis server is running on `localhost:6379`. If using a different host and port, modify the above command as follows:

```
TEST_REDIS=1 TEST_REDIS_HOST=<HOST> TEST_REDIS_PORT=<PORT> npm run test-redis
```

By running Redis on the local host, you can use the `redis-cli` to inspect the state of the Redis server as well as interactively debug the tests.

### Run all tests

This will run both the integration tests against Momento and Redis. As above, we assume the Redis server is running on `localhost:6379`.

```
TEST_AUTH_TOKEN=<YOUR_AUTH_TOKEN> npm run test
```

# node-redis internals

## CommandOptions

### Overview

Each method optionally supports taking `CommandOptions` as the first argument.
This means that the types for the `set` method are:

```typescript
function set<T extends ClientCommandOptions>(
  ...args:
    | [
        key: RedisCommandArgument,
        value: RedisCommandArgument | number,
        options?: SetOptions
      ]
    | [
        commandOptions: CommandOptions<T>,
        key: RedisCommandArgument,
        value: RedisCommandArgument | number,
        options?: SetOptions
      ]
);
```

### What is the definition of `ClientCommandOptions`?

```typescript
// client/lib/client/index.ts
export interface ClientCommandOptions extends QueueCommandOptions {
  isolated?: boolean;
}

// client/lib/client/command-queue.ts
export interface QueueCommandOptions {
  asap?: boolean;
  chainId?: symbol;
  signal?: AbortSignal;
  returnBuffers?: boolean;
}
```

### What do these properties mean and which are relevant?

When a user invokes a command using node-redis, a command object is placed on a queue for execution. The commands are sent over the network FIFO.

- `isolated`: instead of queuing the commands with the main client, send the command through a dedicated client, from a pool of dedicated (isolated) clients
- `asap`: the command is not placed on a queue but instead immediately sent.
- `chainId`: logical ID the command belongs to, for grouping commands
- `signal`: allows for aborting a command
- `returnBuffers`: boolean to return strings as buffers

The only property relevant to us is `returnBuffers`. This decides whether the RESP decoder decodes `simple string` or `bulk string` replies as `Buffer`s. Replies of other data types (error, integer, array) are left as-is.
