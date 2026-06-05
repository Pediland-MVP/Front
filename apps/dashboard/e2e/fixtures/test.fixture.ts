import { test as base } from '@playwright/test';
import { ApiHelper, apiHelper } from '../helpers/api.helper';
import { generateTestMobile } from '../helpers/test-data';

type BefrooshFixtures = {
  apiHelper: ApiHelper;
  testMobile: string;
};

export const test = base.extend<BefrooshFixtures>({
  apiHelper: async ({}, use) => {
    // Inject the ApiHelper instance
    await use(apiHelper);
  },

  testMobile: async ({}, use) => {
    // Generate a unique mobile number for the test
    const mobile = generateTestMobile();
    
    // Provide it to the test
    await use(mobile);

    // Teardown: Cleanup the test user from the database after test completion
    console.log(`[Fixture Cleanup] Deleting test user: ${mobile}`);
    await apiHelper.deleteUser(mobile);
  },
});

export { expect } from '@playwright/test';
