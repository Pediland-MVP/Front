// src/constants/user-status.ts

export const USER_STATUS = {
  INCOMING: 'incoming',
  FOLLOW: 'follow',
  FORCE: 'force',
  FAILED: 'failed',
  SUCCESS: 'success',
  UNSET: 'unset',
  ONBOARDING: 'onboarding',
  NEW: 'new',
  NEEDED: 'needed',
  INACTIVE: 'inactive',
  ACTIVE: 'active',
  LOST: 'lost',
  KEY_USER: 'keyUser',
  SEMI_ACTIVE: 'semiActive',
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const statusToColor: Record<UserStatus, string> = {
  [USER_STATUS.INCOMING]: 'blue',
  [USER_STATUS.FOLLOW]: 'yellow',
  [USER_STATUS.FORCE]: 'orange',
  [USER_STATUS.FAILED]: 'gray',
  [USER_STATUS.SUCCESS]: 'green',
  [USER_STATUS.UNSET]: 'red',
  [USER_STATUS.INACTIVE]: 'red',
  [USER_STATUS.LOST]: 'red',
  [USER_STATUS.ONBOARDING]: '#FF6666', // Text: پیش ثبت‌نام (Pre-registration)
  [USER_STATUS.NEW]: '#FF9966', // Text: آماده شروع (Ready to start)
  [USER_STATUS.NEEDED]: '#FFCC00', // Text: یادگیری (Learning)
  [USER_STATUS.SEMI_ACTIVE]: '#66CC99', // Text: نیمه فعال (Semi-active)
  [USER_STATUS.ACTIVE]: '#01b048', // Text: فعال (Active)
  [USER_STATUS.KEY_USER]: '#01753b', // Text: کلیدی (Key User)
};

export const statusLabels: Record<UserStatus, string> = {
  [USER_STATUS.INCOMING]: 'جـدیـد',
  [USER_STATUS.FOLLOW]: 'پیگیـری',
  [USER_STATUS.FORCE]: 'فــوری',
  [USER_STATUS.FAILED]: 'نامـوفـق',
  [USER_STATUS.SUCCESS]: 'مـوفـق',
  [USER_STATUS.UNSET]: 'بدون وضعیت',
  [USER_STATUS.INACTIVE]: 'تـنـبـل',
  [USER_STATUS.LOST]: 'ناموفق',
  [USER_STATUS.ONBOARDING]: 'پیش ثبت نام',
  [USER_STATUS.NEW]: 'آماده شروع',
  [USER_STATUS.NEEDED]: 'یادگیری',
  [USER_STATUS.SEMI_ACTIVE]: 'نیمه فعال',
  [USER_STATUS.ACTIVE]: 'فـعـال',
  [USER_STATUS.KEY_USER]: 'کلیدی',
};

export enum MarketingActionForEnum {
  MARKETING_LEAD = 'marketingLead',
  USER = 'user',
}

export enum MarketingActionTypeEnum {
  PHONE = 'phone',
  TELEGRAM = 'telegram',
  INSTAGRAM = 'instagram',
  WHATSAPP = 'whatsapp',
}

export enum MarketingActionStatusEnum {
  DONE = 'done',
  PROCESSING = 'processing',
  TODO = 'todo',
}

export enum MarketingLeadStatusEnum {
  INCOMING = 'incoming',
  FOLLOW = 'follow',
  FORCE = 'force',
  FAILED = 'failed',
  SUCCESS = 'success',
}

export enum SMSRecipientTypeEnum {
  USER = 'user',
  MARKETING_LEAD = 'marketingLead',
}

export enum AdminRolesEnum {
  MANAGER = 'manager',
  ADMIN = 'admin',
  KAM = 'kam',
}

export enum UserStatusEnum {
  UNSET = 'unset',
  NEW = 'new',
  NEEDED = 'needed',
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  LOST = 'lost',
}
