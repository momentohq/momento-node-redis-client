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

describe('uninmplemented commands', () => {
  it('should throw an error when the command is not implemented', async () => {
    if (isRedisBackedTest()) {
      return;
    }

    await testAwaitedException(async () => {
      await client.hGet('foo', 'bar');
    }, 'Command hGet is not implemented in MomentoRedisClient');

    await testAwaitedException(async () => {
      await client.lPushX('foo', 'bar');
    }, 'Command lPushX is not implemented in MomentoRedisClient');
  });

  it('should throw an error when an unsupported set option KEEPTTL is used', async () => {
    if (isRedisBackedTest()) {
      return;
    }

    await testAwaitedException(async () => {
      await client.set('foo', 'bar', {KEEPTTL: true});
    }, 'SetOption KEEPTTL is not implemented in MomentoRedisClient');
  });

  it('should throw an error when an unsupported set option XX is used', async () => {
    if (isRedisBackedTest()) {
      return;
    }

    await testAwaitedException(async () => {
      await client.set('foo', 'bar', {XX: true});
    }, 'SetOption XX is not implemented in MomentoRedisClient');
  });

  it('should throw an error when an unsupported set option GET is used', async () => {
    if (isRedisBackedTest()) {
      return;
    }

    await testAwaitedException(async () => {
      await client.set('foo', 'bar', {GET: true});
    }, 'SetOption GET is not implemented in MomentoRedisClient');
  });
});
