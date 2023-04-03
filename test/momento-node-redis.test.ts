import {SetupIntegrationTest} from './integration-setup';
const {client} = SetupIntegrationTest();

describe('Client setup and teardown', () => {
  it('should connect and disconnect', async () => {
    await client.connect();
    await client.disconnect();
  });
});
