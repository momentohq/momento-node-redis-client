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
