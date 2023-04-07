import {SetupIntegrationTest, isRedisBackedTest} from './integration-setup';

const {client} = SetupIntegrationTest();

describe('uninmplemented commands', () => {
  it('should emit an error when the command is not implemented', async () => {
    if (isRedisBackedTest()) {
      return;
    }
    const errors: Error[] = [];
    client.on('error', (err: Error) => {
      errors.push(err);
    });

    await client.hGet('foo', 'bar');
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      'Command hGet is not implemented in MomentoRedisClient'
    );
    errors.pop();

    await client.lPushX('foo', 'bar');
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      'Command lPushX is not implemented in MomentoRedisClient'
    );
  });
});
