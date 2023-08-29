import {SetupIntegrationTest, isRedisBackedTest} from './integration-setup';
import {commandOptions} from '@redis/client';
import {v4} from 'uuid';
import {sleep} from './utils';

const {client} = SetupIntegrationTest();

describe('simple get and set', () => {
  it('should be null on a cache miss', async () => {
    const key = v4();
    const result = await client.get(key);
    expect(result).toBeNull();
  });

  it('should set and get a string', async () => {
    const key = v4();
    const value = v4();
    const setResult = await client.set(key, value);
    expect(setResult).toBe('OK');
    const getResult = await client.get(key);
    expect(getResult).toEqual(value);
  });

  it('should allow getting a setting and getting a buffer value', async () => {
    const key = v4();
    const value = Buffer.from(v4());
    const setResult = await client.set(key, value);
    expect(setResult).toBe('OK');
    const getResult = await client.get(
      commandOptions({returnBuffers: true}),
      key
    );
    expect(typeof getResult).toBe('object');
    expect(getResult).toEqual(value);
  });

  it('should allow get a string when returnBuffers is false', async () => {
    const key = v4();
    const value = v4();
    const setResult = await client.set(key, value);
    expect(setResult).toBe('OK');
    const getResult = await client.get(
      commandOptions({returnBuffers: false}),
      key
    );
    expect(typeof getResult).toBe('string');
    expect(getResult).toEqual(value);
  });
});

describe('get and set with expiration', () => {
  it('should expire a value after a number of seconds', async () => {
    const key = v4();
    const value = v4();
    const setResult = await client.set(key, value, {EX: 5});
    expect(setResult).toBe('OK');
    const getResult = await client.get(key);
    expect(getResult).toEqual(value);

    await sleep(5);

    const getResult2 = await client.get(key);
    expect(getResult2).toBeNull();
  });

  it('should expire a value after a number of milliseconds', async () => {
    const key = v4();
    const value = v4();
    const setResult = await client.set(key, value, {PX: 5000});
    expect(setResult).toBe('OK');
    const getResult = await client.get(key);
    expect(getResult).toEqual(value);

    await sleep(5);

    const getResult2 = await client.get(key);
    expect(getResult2).toBeNull();
  });

  it('should expire a value at a unix timestamp in seconds', async () => {
    const key = v4();
    const value = v4();
    const timestamp = Math.floor(Date.now() / 1000) + 5;
    const setResult = await client.set(key, value, {EXAT: timestamp});
    expect(setResult).toBe('OK');
    const getResult = await client.get(key);
    expect(getResult).toEqual(value);

    await sleep(5);

    const getResult2 = await client.get(key);
    expect(getResult2).toBeNull();
  });

  it('should expire a value at a unix timestamp in milliseconds', async () => {
    const key = v4();
    const value = v4();
    const timestamp = Date.now() + 5000;
    await client.set(key, value, {PXAT: timestamp});
    const result = await client.get(key);
    expect(result).toEqual(value);

    await sleep(5);

    const result2 = await client.get(key);
    expect(result2).toBeNull();
  });
});

describe('get and set with existence conditions', () => {
  it('should set a value if using nx and the key does not exist', async () => {
    const key = v4();
    const value = v4();
    const setResult = await client.set(key, value, {NX: true});
    expect(setResult).toEqual('OK');
  });

  it('should not set a value if using nx and the key does exist', async () => {
    const key = v4();
    const value = v4();
    const setResult = await client.set(key, value);
    expect(setResult).toEqual('OK');
    const setResult2 = await client.set(key, value, {NX: true});
    expect(setResult2).toBeNull();
  });

  it('should also expire a value if using nx and the key does not exist', async () => {
    const key = v4();
    const value = v4();
    const setResult = await client.set(key, value, {NX: true, EX: 5});
    expect(setResult).toEqual('OK');
    const getResult = await client.get(key);
    expect(getResult).toEqual(value);

    await sleep(5);

    const getResult2 = await client.get(key);
    expect(getResult2).toBeNull();
  });

  it('should allow specifying an expiry and nx', async () => {
    const key = v4();
    const value = Buffer.from(v4());
    const timestampInMillis = Date.now() + 5000;

    const setResult = await client.set(key, value, {
      NX: true,
      PXAT: timestampInMillis,
    });
    expect(setResult).toEqual('OK');
    const getResult = await client.get(
      commandOptions({returnBuffers: true}),
      key
    );
    expect(getResult).toEqual(value);

    const setResult2 = await client.set(key, value, {
      NX: true,
      PXAT: timestampInMillis,
    });
    expect(setResult2).toBeNull();

    await sleep(5);

    const getResult2 = await client.get(key);
    expect(getResult2).toBeNull();
  });
});

describe('get, set, and delete', () => {
  it('should delete a key', async () => {
    const key = v4();
    const value = v4();
    const setResult = await client.set(key, value);
    expect(setResult).toEqual('OK');

    const getResult = await client.get(key);
    expect(getResult).toEqual(value);

    const deleteResult = await client.del(key);
    expect(deleteResult).toEqual(1);

    const getResult2 = await client.get(key);
    expect(getResult2).toBeNull();
  });

  it('should delete multiple keys', async () => {
    const key1 = v4();
    const value1 = v4();
    const key2 = v4();
    const value2 = v4();
    const setResult1 = await client.set(key1, value1);
    expect(setResult1).toEqual('OK');
    const setResult2 = await client.set(key2, value2);
    expect(setResult2).toEqual('OK');

    const getResult1 = await client.get(key1);
    expect(getResult1).toEqual(value1);
    const getResult2 = await client.get(key2);
    expect(getResult2).toEqual(value2);

    const deleteResult = await client.del([key1, key2]);
    expect(deleteResult).toEqual(2);

    const getResult3 = await client.get(key1);
    expect(getResult3).toBeNull();
    const getResult4 = await client.get(key2);
    expect(getResult4).toBeNull();
  });

  it('should return 1 incorrectly when deleting a key that does not exist', async () => {
    // Because Momento does not track delete status, we default to 1
    const key = v4();
    const deleteResult = await client.del(key);
    if (!isRedisBackedTest()) {
      expect(deleteResult).toEqual(1);
    } else {
      expect(deleteResult).toEqual(0);
    }
  });
});
