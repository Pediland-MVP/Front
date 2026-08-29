import { IResponseMessage } from './responseMessage';

/**
 * Ice Breakers — پیام خوش‌آمدگویی.
 *
 * Up to 4 tappable questions Instagram shows in an EMPTY DM thread for one
 * connected page. Each is bound to one automation, which starts when tapped.
 *
 * Backend contract: `Back/knowledge/core/instagrams/iceBreakers.doc.md`.
 */

/** Meta's own limit: at most 4 questions per account. */
export const ICE_BREAKER_MAX = 4;

/** Ours, not Meta's — Meta publishes no max length for `question`. */
export const ICE_BREAKER_QUESTION_MAX_LENGTH = 80;

/**
 * Question text keyed by Meta locale code.
 *
 * Storage stays multi-locale so we never need a migration to add one, but the
 * dashboard is Persian-only and writes `default` alone — Meta shows `default` to
 * everyone whose app language has no specific entry, which is all of our users.
 */
export type IceBreakerQuestions = { default: string } & Record<string, string | undefined>;

export interface IceBreakerCondition {
  id: string;
  value: string;
}

export interface IceBreaker {
  id: string;
  instagramId: string;
  contentCycleId: string;
  /** 0-based display order on Instagram. Assigned by the backend from array position. */
  sortOrder: number;
  questions: IceBreakerQuestions;
  /**
   * Present on read. Carries `conditions` because an automation is labelled by
   * its trigger keywords here, matching the START_AUTOMATION button picker.
   */
  contentCycle?: { id: string; title: string | null; conditions?: IceBreakerCondition[] };
}

export namespace IceBreakerNamespace {
  export namespace GET {
    /**
     * `syncedAt` / `syncError` describe the PUSH TO META, not the save. Saving
     * stores rows immediately and pushes in a background job, so a fresh save
     * legitimately reads back with a stale `syncedAt`.
     */
    export type List = IResponseMessage<{
      items: IceBreaker[];
      syncedAt: string | null;
      syncError: string | null;
    }>;
  }

  export namespace POST {
    /**
     * Whole-list replace — there is no partial update and no per-slot delete,
     * because Meta replaces the entire `ice_breakers` field on every push.
     * Array order becomes the display order; never send `sortOrder`.
     */
    export interface SaveBody {
      instagramId: string;
      items: { contentCycleId: string; questions: IceBreakerQuestions }[];
    }

    export type Save = IResponseMessage<{ items: IceBreaker[] }>;
  }
}
