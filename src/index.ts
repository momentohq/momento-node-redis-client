export {MomentoRedisClient, IMomentoRedisClient} from './momento-redis-client';
export {createClient, createScopedClient} from './create-client';
export {commandOptions} from '@redis/client';

import {CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';

const Momento = {CacheClient, Configurations, CredentialProvider};
export {Momento};
