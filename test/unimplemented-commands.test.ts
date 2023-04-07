import {SetupIntegrationTest, isRedisBackedTest} from './integration-setup';

const {client} = SetupIntegrationTest();

describe('uninmplemented commands', () => {
  it('should throw an error when the command is not implemented', async () => {
    if (isRedisBackedTest()) {
      return;
    }

    expect(await client.hGet('foo', 'bar')).toThrow(
      new TypeError('Command hGet is not implemented in MomentoRedisClient')
    );

    expect(await client.hGet('foo', 'bar')).toThrow(
      new TypeError('Command lPushX is not implemented in MomentoRedisClient')
    );
  });
});
