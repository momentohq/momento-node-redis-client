{{ ossHeader }}

# Momento Node.js Redis Client

## What and why?

This project provides a Momento-backed implementation of [@redis/client](https://github.com/redis/node-redis)
The goal is to provide a drop-in replacement for [@redis/client](https://github.com/redis/node-redis) so that you can
use the same code with either a Redis server or with Momento serverless cache!

You can use Momento as your cache engine for any node.js frameworks that support a redis-backed cache,
such as [Express.js](https://github.com/expressjs/express). See the [Examples](#examples) section for more info.

## Usage

To switch your existing `@redis/client` application to use Momento, you only need to change the code where you construct
your client object:

<table>
<tr>
 <td width="50%">With node-redis client</td>
 <td width="50%">With Momento's Redis compatibility client</td>
</tr>
<tr>
 <td width="50%" valign="top">

```javascript
// Import the redis module
import { createClient } from 'redis';
// Replace these values with your Redis server's details
const REDIS_HOST = 'my.redis-server.com';
const REDIS_PORT = 6379;
const REDIS_PASSWORD = 'mypasswd';
// Create a Redis client
const redisClient = redis.createClient({
  url: 'redis://${REDIS_HOST}:${REDIS_PORT}',
  password: REDIS_PASSWORD
});
```

</td>
<td width="50%">

```javascript
// Import the Momento redis compatibility client.
import {createClient, momento} from 'momento-redis-client';
// Initialize Momento's client.
const redisClient = createClient(
 new momento.CacheClient({
  configuration: momento.Configurations.Laptop.v1(),
  credentialProvider: momento.CredentialProvider.fromEnvironmentVariable({
   environmentVariableName: 'MOMENTO_AUTH_TOKEN',
  }),
  defaultTtlSeconds: 60,
 }),
 'cache_name'
);
```

 </td>
</tr>
</table>

**NOTE**: The Momento `@redis/client` implementation currently supports simple key/value pairs (`GET`, `SET`) as well
as hash values (`HGET`/`HSET`). We will continue to add support for additional Redis APIs in the future; for more
information see the [Current Redis API Support](#current-redis-api-support) section later in this doc.

## Examples

### Prerequisites

To run these examples, you will need a Momento Auth Token. You can generate one using the [Momento CLI](https://github.com/momentohq/momento-cli).

The examples will utlize your auth token via the environment variable `MOMENTO_AUTH_TOKEN` you set.

### Basic example

In the [`examples/basic`](./examples/basic) directory, you will find a simple CLI app that does some basic sets and gets
on string and hash values. You can pass the `--momento` flag to run against Momento, or the `--redis` flag to run against
a local Redis (127.0.0.0:6379).

You can run the example via `npm run basic`. To pass CLI options you will need to pass an extra `--` to tell `npm` that
the following options should be passed through.

Here's an example run against Momento:

```bash
cd examples/basic
export MOMENTO_AUTH_TOKEN=<your momento auth token goes here>
npm install
npm run basic -- --momento
```

And the output should look something like this:

```bash

using momento-node-redis with cache 'cache'
[2023-04-10T23:16:45.893Z] INFO (Momento: CacheClient): Creating Momento CacheClient
[2023-04-10T23:16:45.901Z] INFO (Momento: ControlClient): Creating cache: cache

Issuing a 'get' for key 'key1', which we have not yet set.
result 'null'

Issuing a 'set' for key 'key1', with value 'value1'.
result: OK

Issuing another 'get' for key key1.
result: 'value1' (String)

Issuing another 'get' for key key1, with returnBuffers: true.
result: 'value1' (Buffer)

Issuing an HSET for key 'hash' with value: {"three":3,"four":4}
result: 2

Issuing an HGETALL for key 'hash'.
result: {"three":"3","four":"4"}

done
```

### express-session

This directory contains an [Express.js](https://github.com/expressjs/express) app with
[express-session](https://github.com/expressjs/session) and the [connect-redis](https://github.com/tj/connect-redis) backend.
`MomentoRedisClient` is compatible with [connect-redis](https://github.com/tj/connect-redis), so you can use it with your
existing express app with no code changes other than the client constructor!

To run the example express app:

```bash
cd examples/express
export MOMENTO_AUTH_TOKEN=<your momento auth token goes here>
npm install
npm run app
```

You will see something like this:

```bash
[2023-04-10T23:36:42.326Z] INFO (Momento: CacheClient): Creating Momento CacheClient
Example app listening at http://localhost:3000
```

Now, open a browser to `http://localhost:3000` and reload the page a few times. You'll see that the Momento-backed
express session is recognized and you should see the page load count increase each time.

Then, open a private/icognito browser window (or a different browser) and browse to the same URL. You should see
a fresh session with an independent counter.

Voila! Your express.js session data is now stored in Momento!

## Current Redis API Support

This library supports the most popular Redis APIs, but does not yet support all Redis APIs. We currently support most
APIs related to string values (GET, SET, etc.) and hash values (HGET, HSET, etc.). We will be adding support for additional
APIs in the future. If there is a particular API that you need support for, please drop by our [Discord](https://discord.com/invite/3HkAKjUZGq)
or e-mail us at [support@momentohq.com](mailto:support@momentohq.com) and let us know - we'll get it added for you ASAP!

In the meantime, if you call a method from the `@redis/client` API that we do not yet support, you will get a `TypeError`
letting you know that the method is not implemented yet.

### TypeScript Compile-Time API Checking

If you're using TypeScript, and you'd like compile-time checking to tell you if you are using any APIs that we don't yet
support, we provide our own `IMomentoRedisClient` interface, which is a fully compatible subset of the official `@redis/client`
interface but explicitly lists out the APIs that we currently support.

So, you can make a one-line change to your constructor call and get back an instance of this interface instead of the
default `@redis/client` type, and then the TypeScript compiler will catch any calls that your code is making to Redis
API methods that we don't yet support, so you'll know before you even try to run the code.

All you need to do is call the `createScopedClient` factory function instead of the `createClient` one that we showed
above. Here's what it looks like:

```javascript
const client: IMomentoRedisClient =
  createScopedClient(
    new momento.CacheClient({
      configuration: momento.Configurations.Laptop.v1(),
      credentialProvider: momento.CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: 'MOMENTO_AUTH_TOKEN',
      }),
      defaultTtlSeconds: 60,
    }),
    'cache_name'
  );
```

Exactly the same call as before other than the `createScopedClient` function name, and now you get compile-time
compatibility checking!

If you try this, and your code doesn't compile because we are missing APIs that you need, please do reach out to us!
We'll get them added.

{{ ossFooter }}
