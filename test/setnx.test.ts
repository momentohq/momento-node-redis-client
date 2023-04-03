import {SetupIntegrationTest} from './integration-setup';
import {v4} from 'uuid';

const {client} = SetupIntegrationTest();

describe('set if not exists (setnx)', () => {
  it('should set a value if the key does not exist', async () => {
    const key = v4();
    const value = v4();
    const setResult = await client.setNX(key, value);
    expect(setResult).toBe(true);
    const getResult = await client.get(key);
    expect(getResult).toEqual(value);
  });

  it('should not set a value if the key does exist', async () => {
    const key = v4();
    const value = v4();

    const setResult = await client.set(key, value);
    expect(setResult).toBe('OK');
    const getResult = await client.get(key);
    expect(getResult).toEqual(value);

    const setNxResult = await client.setNX(key, v4());
    expect(setNxResult).toBe(false);

    const getResult2 = await client.get(key);
    expect(getResult2).toEqual(value);
  });
});
