import {SetupIntegrationTest} from './integration-setup';
import {v4} from 'uuid';

const {client} = SetupIntegrationTest();

describe('increment', () => {
  it('should increment the value of the key by 1 if the key exists', async () => {
    const key = v4();
    const value = 5;
    // set initial key value
    await client.set(key, value);
    // increment key value
    const incrementResult = await client.incr(key);
    expect(incrementResult).toEqual(value + 1);
  });

  it('should increment the value of the key to 1 if the key does not exists', async () => {
    const key = v4();
    // increment key value
    const incrementResult = await client.incr(key);
    expect(incrementResult).toEqual(1);
  });

  it('should error out if the key contains a value of wrong type or contains a string that can be represented as integer', async () => {
    const key = v4();
    const value = 'monkey';
    // Set initial key value
    await client.set(key, value);
    // Increment the value of the key that is not set
    try {
      await client.incr(key);
    } catch (error) {
      if (process.env.TEST_REDIS === 'false') {
        const momentoError = error as {
          code: string;
          context: {code: string; msg: string; op: string; platform: string};
        };
        expect(momentoError.code).toBe('ERR_UNHANDLED_ERROR');
        expect(momentoError.context.code).toBe('FAILED_PRECONDITION_ERROR');
        expect(momentoError.context.msg).toBe(
          "System is not in a state required for the operation's execution: 9 FAILED_PRECONDITION: failed to parse value into long"
        );
        expect(momentoError.context.op).toBe('incr');
        expect(momentoError.context.platform).toBe('momento');
      } else if (process.env.TEST_REDIS === 'true') {
        expect((error as Error).message).toBe(
          'ERR value is not an integer or out of range'
        );
      }
    }
  });

  it('should increment the value of key that contains a string that can be represented as integer', async () => {
    const key = v4();
    const value = '10';
    // Set initial key value
    await client.set(key, value);
    // Increment the value of the key that is not set
    const incrResp = await client.incr(key);
    expect(incrResp).toBe(11);
  });
});
