export enum HOW_FOUND_US_ENUM {
  GOOGLE = 'google',
  TELEGRAM = 'telegram',
  INSTAGRAM = 'instagram',
  FRIEND = 'friend',
  EVENT = 'event',
  SMS = 'sms',
  OTHER = 'other',
}

// Display order in the select. Persian labels live in fa.json under
// Automations.BusinessInfo.options — never hardcode them here.
export const HOW_FOUND_US_VALUES: HOW_FOUND_US_ENUM[] = [
  HOW_FOUND_US_ENUM.GOOGLE,
  HOW_FOUND_US_ENUM.TELEGRAM,
  HOW_FOUND_US_ENUM.INSTAGRAM,
  HOW_FOUND_US_ENUM.FRIEND,
  HOW_FOUND_US_ENUM.EVENT,
  HOW_FOUND_US_ENUM.SMS,
  HOW_FOUND_US_ENUM.OTHER,
];
