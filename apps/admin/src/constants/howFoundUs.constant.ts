// Mirrors HOW_FOUND_US in @befroosh/entities and the dashboard's copy of this file.
// The two Next.js apps are separate builds with no shared constants package, so this
// duplication follows the same pattern as p2eNumber/formatNumber being per-app.
export enum HOW_FOUND_US_ENUM {
  GOOGLE = 'google',
  TELEGRAM = 'telegram',
  INSTAGRAM = 'instagram',
  FRIEND = 'friend',
  EVENT = 'event',
  SMS = 'sms',
  OTHER = 'other',
}

// Display order in the filter. Persian labels live in fa.json under Users.options.
export const HOW_FOUND_US_VALUES: HOW_FOUND_US_ENUM[] = [
  HOW_FOUND_US_ENUM.GOOGLE,
  HOW_FOUND_US_ENUM.TELEGRAM,
  HOW_FOUND_US_ENUM.INSTAGRAM,
  HOW_FOUND_US_ENUM.FRIEND,
  HOW_FOUND_US_ENUM.EVENT,
  HOW_FOUND_US_ENUM.SMS,
  HOW_FOUND_US_ENUM.OTHER,
];
