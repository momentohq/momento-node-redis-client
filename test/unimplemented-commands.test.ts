import {SetupIntegrationTest, isRedisBackedTest} from './integration-setup';

const {client} = SetupIntegrationTest();

describe('uninmplemented commands', () => {
  it('should throw an error when the command is not implemented', async () => {
    if (isRedisBackedTest()) {
      return;
    }

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

    await testAwaitedException(async () => {
      await client.hGet('foo', 'bar');
    }, 'Command hGet is not implemented in MomentoRedisClient');

    await testAwaitedException(async () => {
      await client.lPushX('foo', 'bar');
    }, 'Command lPushX is not implemented in MomentoRedisClient');
  });
});
