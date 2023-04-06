import {SetupIntegrationTest} from './integration-setup';
const {client} = SetupIntegrationTest();

describe('Client setup and teardown', () => {
  it('should connect and disconnect', async () => {
    if (client.isOpen) {
      await client.disconnect();
    }
    await client.connect();
    await client.disconnect();
  });
});
