// E2E Test Constants and Generators

export function generateTestMobile(): string {
  // Generate a random 4-digit number
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const prefix = process.env.E2E_TEST_MOBILE_PREFIX || '0912000';
  return `${prefix}${randomSuffix}`;
}

export const TEST_USER = {
  firstname: 'آریا',
  lastname: 'بفروش‌تست',
  instagramUsername: 'befroosh_e2e_test',
};

export const TEST_PASSWORD = 'TestPassword@123456';
