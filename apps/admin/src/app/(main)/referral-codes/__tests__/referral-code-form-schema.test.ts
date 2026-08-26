import { describe, expect, it } from 'vitest';
import { FormSchema } from '../referral-codes-table';

const base = { code: 'GIFT90', mobile: '09123456789' };

const errorPaths = (result: ReturnType<typeof FormSchema.safeParse>) =>
  result.success ? [] : result.error.issues.map((i) => i.path.join('.'));

describe('referral code form schema', () => {
  describe('PLAN (gift subscription) codes', () => {
    it('accepts a plan code with only a plan duration', () => {
      const result = FormSchema.safeParse({
        ...base,
        type: 'PLAN',
        planId: 2,
        planDurationId: 7,
      });

      expect(result.success).toBe(true);
    });

    it('requires a plan duration', () => {
      const result = FormSchema.safeParse({ ...base, type: 'PLAN', planId: 2 });

      expect(result.success).toBe(false);
      expect(errorPaths(result)).toContain('planDurationId');
    });

    // Regression: discount defaults to 0 in the form. If the "positive" rule sat on the
    // field instead of in superRefine, the object parse would abort and surface an error
    // on the discount input - which is hidden for PLAN - making the form unsubmittable
    // with no visible reason.
    it('ignores a leftover zero discount instead of blocking on a hidden field', () => {
      const result = FormSchema.safeParse({
        ...base,
        type: 'PLAN',
        discount: 0,
        planId: 2,
        planDurationId: 7,
      });

      expect(result.success).toBe(true);
    });

    it('still accepts a plan code when a stale maxUsage is present', () => {
      const result = FormSchema.safeParse({
        ...base,
        type: 'PLAN',
        maxUsage: 5,
        planId: 2,
        planDurationId: 7,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('discount codes', () => {
    it('rejects a zero discount', () => {
      const result = FormSchema.safeParse({ ...base, type: 'FIXED', discount: 0 });

      expect(result.success).toBe(false);
      expect(errorPaths(result)).toContain('discount');
    });

    it('rejects a missing discount', () => {
      const result = FormSchema.safeParse({ ...base, type: 'FIXED' });

      expect(result.success).toBe(false);
      expect(errorPaths(result)).toContain('discount');
    });

    it('rejects a percentage above 100', () => {
      const result = FormSchema.safeParse({ ...base, type: 'PERCENTAGE', discount: 120 });

      expect(result.success).toBe(false);
      expect(errorPaths(result)).toContain('discount');
    });

    it('accepts a valid percentage code', () => {
      const result = FormSchema.safeParse({
        ...base,
        type: 'PERCENTAGE',
        discount: 20,
        max: 50000,
        atLeast: 5000,
      });

      expect(result.success).toBe(true);
    });

    it('does not require a plan duration', () => {
      const result = FormSchema.safeParse({ ...base, type: 'FIXED', discount: 50000 });

      expect(result.success).toBe(true);
    });
  });
});
