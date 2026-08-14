import { describe, it, expect } from 'vitest';

import { AutomationContentTypesEnum } from '../../constants/automationContent.enum';
import { firstContentSelfGates, isCommentStartMessageRequired } from '../commentStart';

const text = (quickReplies?: unknown[]) =>
  ({
    type: AutomationContentTypesEnum.TEXT,
    quickReplies: quickReplies ?? null,
  }) as never;

const question = () => ({ type: AutomationContentTypesEnum.QUESTION, quickReplies: null }) as never;
const product = () => ({ type: AutomationContentTypesEnum.PRODUCT, quickReplies: null }) as never;
const image = () => ({ type: AutomationContentTypesEnum.IMAGE, quickReplies: null }) as never;

describe('firstContentSelfGates', () => {
  it('is true for a QUESTION first content', () => {
    expect(firstContentSelfGates([question(), text()])).toBe(true);
  });

  it('is true for a TEXT first content carrying quick replies', () => {
    expect(firstContentSelfGates([text([{ title: 'باشه' }]), image()])).toBe(true);
  });

  it('is false for a plain TEXT first content with no quick replies', () => {
    expect(firstContentSelfGates([text(), image()])).toBe(false);
  });

  it('is false for empty or missing contents', () => {
    expect(firstContentSelfGates([])).toBe(false);
    expect(firstContentSelfGates(undefined)).toBe(false);
    expect(firstContentSelfGates(null)).toBe(false);
  });
});

/**
 * Each case here mirrors a branch of the backend's `handleComment`
 * (`Back/apps/core/src/contentCycle/contentCycleMessage.service.ts`): the start-request
 * message is sent ONLY when neither `isSingleMessage` nor `firstContentSelfGates` holds.
 * The frontend must demand `commentStartText` in exactly those same cases and no others.
 */
describe('isCommentStartMessageRequired', () => {
  const base = { isComment: true, justFollowers: false };

  it('is required for multiple contents whose first content does not self-gate', () => {
    expect(isCommentStartMessageRequired({ ...base, contents: [text(), image()] })).toBe(true);
  });

  it('is required for a single PRODUCT content', () => {
    expect(isCommentStartMessageRequired({ ...base, contents: [product()] })).toBe(true);
  });

  // THE REPORTED BUG: backend skips the start message entirely (firstContentSelfGates),
  // but the dashboard guard still demanded commentStartText — which StartAutomationMessage
  // had already cleared to '' — so the automation could never be submitted.
  it('is NOT required when the first of several contents is a QUESTION', () => {
    expect(isCommentStartMessageRequired({ ...base, contents: [question(), text()] })).toBe(false);
  });

  it('is NOT required when the first of several contents is a TEXT with quick replies', () => {
    expect(
      isCommentStartMessageRequired({ ...base, contents: [text([{ title: 'باشه' }]), image()] }),
    ).toBe(false);
  });

  it('is NOT required for a single non-PRODUCT content', () => {
    expect(isCommentStartMessageRequired({ ...base, contents: [text()] })).toBe(false);
  });

  it('is NOT required when the automation is not comment-triggered', () => {
    expect(
      isCommentStartMessageRequired({ ...base, isComment: false, contents: [text(), image()] }),
    ).toBe(false);
  });

  /**
   * `justFollowers` is NOT a blanket exemption. For a comment, `followerGuard`
   * (`Back/apps/core/src/contentCycle/follower.service.ts`) only returns
   * `countinue: true` when `leadInstagram && isUserFollowBusiness &&
   * contents.length === 1 && !reminderTime`. Every other shape returns
   * `countinue: false`, and `handleComment` then early-returns after the reply comment —
   * so the start message is never reached. The one shape that DOES get through and still
   * needs the message is a single PRODUCT content with no reminder.
   */
  describe('justFollowers', () => {
    const followers = { isComment: true as const, justFollowers: true };

    it('IS required for a single PRODUCT content with no reminder (followerGuard lets this through)', () => {
      expect(isCommentStartMessageRequired({ ...followers, contents: [product()] })).toBe(true);
    });

    it('is NOT required once a reminderTime is set — followerGuard stops the comment first', () => {
      expect(
        isCommentStartMessageRequired({
          ...followers,
          contents: [product()],
          reminderTime: '24',
        }),
      ).toBe(false);
    });

    it('is NOT required for multiple contents — followerGuard never returns continue for those', () => {
      expect(isCommentStartMessageRequired({ ...followers, contents: [text(), image()] })).toBe(
        false,
      );
    });

    it('is NOT required for a single non-PRODUCT content', () => {
      expect(isCommentStartMessageRequired({ ...followers, contents: [text()] })).toBe(false);
    });

    it('is NOT required when content[0] self-gates', () => {
      expect(isCommentStartMessageRequired({ ...followers, contents: [question(), text()] })).toBe(
        false,
      );
    });
  });
});
