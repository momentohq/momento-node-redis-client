import {SetupIntegrationTest, isRedisBackedTest} from './integration-setup';

const {client} = SetupIntegrationTest();

const testAwaitedException = async (
  fn: () => Promise<void>,
  message: string
) => {
  try {
    await fn();
    throw new Error('should not reach here');
  } catch (err) {
    expect(err).toBeInstanceOf(TypeError);
    expect((err as Error).message).toBe(message);
  }
};

describe('unimplemented commands', () => {
  it('should throw an error when the command is not implemented', async () => {
    if (isRedisBackedTest()) {
      return;
    }

    await testAwaitedException(async () => {
      await client.sAdd('foo', 'bar');
    }, 'Command sAdd is not yet implemented in MomentoRedisClient. But we would love to add it for you!  Please drop by our Discord at https://discord.com/invite/3HkAKjUZGq , or contact us at support@momentohq.com, and let us know what APIs you need!');

    await testAwaitedException(async () => {
      await client.lPushX('foo', 'bar');
    }, 'Command lPushX is not yet implemented in MomentoRedisClient. But we would love to add it for you!  Please drop by our Discord at https://discord.com/invite/3HkAKjUZGq , or contact us at support@momentohq.com, and let us know what APIs you need!');
  });

  it('should throw an error when an unsupported set option KEEPTTL is used', async () => {
    if (isRedisBackedTest()) {
      return;
    }

    await testAwaitedException(async () => {
      await client.set('foo', 'bar', {KEEPTTL: true});
    }, 'SetOption KEEPTTL is not yet implemented in MomentoRedisClient. But we would love to add it for you!  Please drop by our Discord at https://discord.com/invite/3HkAKjUZGq , or contact us at support@momentohq.com, and let us know what APIs you need!');
  });

  it('should throw an error when an unsupported set option XX is used', async () => {
    if (isRedisBackedTest()) {
      return;
    }

    await testAwaitedException(async () => {
      await client.set('foo', 'bar', {XX: true});
    }, 'SetOption XX is not yet implemented in MomentoRedisClient. But we would love to add it for you!  Please drop by our Discord at https://discord.com/invite/3HkAKjUZGq , or contact us at support@momentohq.com, and let us know what APIs you need!');
  });

  it('should throw an error when an unsupported set option GET is used', async () => {
    if (isRedisBackedTest()) {
      return;
    }

    await testAwaitedException(async () => {
      await client.set('foo', 'bar', {GET: true});
    }, 'SetOption GET is not yet implemented in MomentoRedisClient. But we would love to add it for you!  Please drop by our Discord at https://discord.com/invite/3HkAKjUZGq , or contact us at support@momentohq.com, and let us know what APIs you need!');
  });
});
