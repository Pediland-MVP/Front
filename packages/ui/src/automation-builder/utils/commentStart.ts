import { AutomationContentTypesEnum } from '../constants/automationContent.enum';
import type { ContentItemType } from '../schemas/automationForm';

type CommentStartContentLike = Pick<ContentItemType, 'type' | 'quickReplies'>;

/** Deliberately looser than `AutomationFormType`: every field is optional there (the
 * schema's output type marks them so), and callers pass either whole form values or a
 * hand-built object of the three fields that matter. */
type CommentStartValuesLike = {
  isComment?: boolean | null;
  justFollowers?: boolean | null;
  contents?: CommentStartContentLike[] | null;
  reminderTime?: string | number | null;
};

/**
 * Whether `contents[0]` already forces the lead to tap or answer something by itself —
 * a QUESTION, or a TEXT that carries quick replies (which always include the
 * auto-inserted CONSENT quick reply whenever another content follows, see `Contents.tsx`).
 *
 * That tap/answer is what opens Instagram's 24h messaging window, so the separate
 * start-request message would be a redundant extra step. Mirrors the backend's own
 * `firstContentSelfGates` in
 * `Back/apps/core/src/contentCycle/contentCycleMessage.service.ts` (`handleComment`),
 * which skips sending `commentStartText` entirely in exactly this case. BEF-162.
 */
export function firstContentSelfGates(
  contents: CommentStartContentLike[] | null | undefined,
): boolean {
  const firstContent = contents?.[0];
  if (!firstContent) return false;

  return (
    firstContent.type === AutomationContentTypesEnum.QUESTION ||
    (firstContent.type === AutomationContentTypesEnum.TEXT &&
      (firstContent.quickReplies?.length ?? 0) > 0)
  );
}

/**
 * Whether this automation actually sends the separate start-request message, and so
 * genuinely needs `commentStartText`.
 *
 * This is the SINGLE SOURCE OF TRUTH for that question: both the `StartAutomationMessage`
 * field (which renders the input, and clears `commentStartText` when it returns `false`)
 * and the dashboard's `handleBeforeSubmit` guard read it. They previously computed the
 * condition inline and independently, which drifted: the field hid itself and cleared the
 * value for a self-gating `contents[0]`, while the guard still demanded a non-empty
 * `commentStartText` — blocking submit on a field that was no longer even rendered.
 */
export function isCommentStartMessageRequired({
  isComment,
  justFollowers,
  contents,
  reminderTime,
}: CommentStartValuesLike): boolean {
  if (!isComment) return false;
  if (firstContentSelfGates(contents)) return false;

  const isProductFirst = contents?.[0]?.type === AutomationContentTypesEnum.PRODUCT;

  // Mirrors the backend's `isSingleMessage` staying false in `handleComment`: a lone
  // PRODUCT content needs the lead authenticated, and any multi-content automation needs
  // the 24h window opened first.
  const backendSendsStartMessage = isProductFirst || (contents?.length ?? 0) > 1;
  if (!backendSendsStartMessage) return false;

  // `justFollowers` is NOT a blanket exemption — it only narrows which shapes ever reach
  // the start message. For a comment, `followerGuard`
  // (`Back/apps/core/src/contentCycle/follower.service.ts`) returns `countinue: true`
  // ONLY when `isUserFollowBusiness && contents.length === 1 && !reminderTime`; every
  // other shape returns false and `handleComment` early-returns after the reply comment,
  // never reaching the start message. Intersected with `backendSendsStartMessage` above,
  // the one surviving shape is a single PRODUCT content with no reminder — and that one
  // genuinely does send `commentStartText`, so it must be filled in.
  if (justFollowers) {
    return isProductFirst && contents?.length === 1 && !reminderTime;
  }

  return true;
}
