import { FullConfig } from '@playwright/test';
import axios from 'axios';

async function globalSetup(config: FullConfig) {
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:3003/v1';
  const secret = process.env.E2E_TEST_SECRET || 'e2e_s3cr3t_k3y_d0_n0t_us3_in_pr0d';

  console.log(`\n[Global Setup] Verifying backend health at ${apiUrl}/e2e/health...`);

  try {
    const response = await axios.get(`${apiUrl}/e2e/health`, {
      headers: { 'x-e2e-secret': secret },
      timeout: 5000,
    });

    if (response.data && response.data.status === 'ok') {
      console.log('[Global Setup] Backend is healthy and ready for testing.');
    } else {
      throw new Error(`Unexpected backend response: ${JSON.stringify(response.data)}`);
    }
  } catch (error: any) {
    console.error('\n======================================================');
    console.error('[Global Setup ERROR] Core backend is NOT accessible or not running!');
    console.error(`Attempted connection to: ${apiUrl}/e2e/health`);
    console.error(`Error message: ${error.message}`);
    console.error(
      'Please ensure the core backend is running (e.g. pnpm dev:core) and your .env files are synchronized.',
    );
    console.error('======================================================\n');
    process.exit(1);
  }
}

export default globalSetup;
