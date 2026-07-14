import { describe, it, expect } from 'vitest';
import { AutomationContentTypesEnum } from '../constants/automationContent.enum';
import { AutomationFormSchema } from '../schemas/automationForm';

describe('automation-builder shared schema/constants', () => {
  it('exposes AutomationContentTypesEnum.TEXT', () => {
    expect(AutomationContentTypesEnum.TEXT).toBe('text');
  });

  it('rejects an empty form payload', () => {
    const result = AutomationFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
