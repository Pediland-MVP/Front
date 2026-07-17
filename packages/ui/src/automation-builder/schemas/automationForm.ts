// packages/ui/src/automation-builder/schemas/automationForm.ts

import { AutomationContentTypesEnum } from '../constants/automationContent.enum';
import { ButtonTypeEnum } from '../types/buttons.enum';
import { ValidationTypeEnum } from '../types/validationType.enum';
import z from 'zod';

// Inlined from apps/dashboard/src/utils/regex.ts (REGEX_URL) — not worth moving a
// single regex constant across the app boundary just for this one usage.
const REGEX_URL =
  /^(https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(\/[^\s]*)?|((www\.)?[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+(\/[^\s]*)?))$/i;

/* ----------------------------- Helpers & Partials ---------------------------- */

const optionalStringToUndef = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v : undefined));

const optionalBoolDefault = (fallback: boolean) =>
  z
    .boolean()
    .optional()
    .nullable()
    .transform((v) => v ?? fallback);

const FileSchema = z
  .object({
    id: z.number(),
    url: z.string().url().optional().nullable(),
    name: z.string().optional().nullable(),
    mimeType: z.string().optional().nullable(),
  })
  .optional()
  .nullable();

const ProductImageSchema = z.object({
  url: z.string().optional().nullable(),
  id: z.number().optional().nullable(),
});

const ProductSchema = z
  .object({
    id: z.string().optional().nullable(),
    images: z.array(ProductImageSchema).optional().nullable(),
    _xid: z.string().optional().nullable(),
  })
  .nullable()
  .optional();

const ButtonSchema = z.discriminatedUnion('postbackPayloadType', [
  z.object({
    postbackPayloadType: z.literal(ButtonTypeEnum.TEXT),
    title: z.string().min(1).max(35),
    priority: z.number().optional().nullable(),
    _xid: z.string().optional().nullable(),
  }),
  z.object({
    postbackPayloadType: z.literal(ButtonTypeEnum.CONSENT),
    title: z.string().min(1).max(35),
    priority: z.number().optional().nullable(),
    _xid: z.string().optional().nullable(),
  }),
  z.object({
    postbackPayloadType: z.literal(ButtonTypeEnum.URL),
    title: z.string().min(1).max(35),
    url: z.string().regex(REGEX_URL),
    priority: z.number().optional().nullable(),
    _xid: z.string().optional().nullable(),
  }),
  z.object({
    postbackPayloadType: z.literal(ButtonTypeEnum.START_AUTOMATION),
    title: z.string().min(1).max(35),
    destinationContentCycleId: z.string().min(1),
    destinationContentCycle: z.custom<any>().optional().nullable(),
    destinationContentCycleTitle: z.string().optional().nullable(),
    priority: z.number().optional().nullable(),
    _xid: z.string().optional().nullable(),
  }),
]);

const ButtonTemplateSchema = z
  .object({
    text: z.string().min(1),
    buttons: z.array(ButtonSchema),
  })
  .optional()
  .nullable();

const InstagramPostSchema = z
  .object({
    mediaUrl: z.string().optional().nullable(),
    mediaId: z.string().min(1),
    picture: z.object({ url: z.string().optional().nullable() }).optional().nullable(),
  })
  .optional()
  .nullable();

/* ------------------------------ Content Schema ------------------------------ */

export const VitrinItemSchema = z.object({
  imageId: z.union([z.string().nonempty(), z.number()]).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  title: z.string().nonempty(),
  description: z.string().nonempty(),
  buttons: z.array(ButtonSchema).optional().nullable(),
  destinationContentCycleTitle: z.string().optional().nullable(),
});
export type VitrinItemType = z.infer<typeof VitrinItemSchema>;

export const ContentItemSchema = z.object({
  id: z.string().optional().nullable(),
  _xid: z.string().optional().nullable(),
  text: optionalStringToUndef,
  quickReplies: z.array(ButtonSchema).optional().nullable(),
  consentText: optionalStringToUndef,
  haveConsent: optionalBoolDefault(false),
  type: z.nativeEnum(AutomationContentTypesEnum),
  file: FileSchema,
  fileTemp: z.any(),
  instagramPost: InstagramPostSchema,
  buttonTemplate: ButtonTemplateSchema,
  products: z.array(ProductSchema).optional().nullable(),
  validationType: z.nativeEnum(ValidationTypeEnum).optional().nullable(),
  validationErrorMessage: z.string().optional().nullable(),
  productIds: z.array(z.string()).optional().nullable(),
  haveInstagramPost: z
    .boolean()
    .optional()
    .nullable()
    .transform(() => undefined),
  vitrins: z.array(VitrinItemSchema).optional().nullable(),
  delayMs: z.number().min(1000).optional().nullable(),
  delayUnit: z.string().optional().nullable(),
});
export type ContentItemType = z.infer<typeof ContentItemSchema>;

export const ContentItemConditionSchema = z.object({
  type: z.string().min(1),
  value: z.string().min(1),
  id: z.string().optional(),
  conditionId: z.string().optional().nullable(),
});
/* ------------------------------- Main Schema -------------------------------- */

export const AutomationFormSchema = z
  .object({
    // No custom message here: zod's global error map (utils/zodErrorMap.ts) ignores
    // `message`/`params` for `too_small` issues and always shows the generic
    // `zod.errors.too_small.array.inclusive` translation instead.
    instagramIds: z.array(z.string().uuid()).min(1),
    conditionType: z.enum(['EQUAL', 'INCLUDE', 'noCondition']),
    isDirect: z.boolean(),
    isComment: z.boolean(),
    isNoCondition: z.boolean(),

    conditions: z.array(ContentItemConditionSchema).optional(),

    contents: z.array(ContentItemSchema).min(1),

    instagramPost: InstagramPostSchema, // برای سناریوهای سطح فرم

    // شروع مکالمه در کامنت
    commentStartText: optionalStringToUndef,
    commentStartTitle: optionalStringToUndef,

    title: optionalStringToUndef,
    enabled: optionalBoolDefault(true),

    // فقط فالوورها
    justFollowers: z.boolean(),

    // پیام‌های فالو
    followMessage: z.string().optional().nullable(),
    followCheckMessage: z.string().optional().nullable(),

    // یادآورها
    isRemindersEnabled: optionalBoolDefault(false),
    reminderTime: optionalStringToUndef,
    reminders: z.array(
      z.object({
        type: z.nativeEnum(AutomationContentTypesEnum),
        text: optionalStringToUndef,
        quickReplies: z.array(ButtonSchema).optional().nullable(),
        instagramPost: InstagramPostSchema,
        file: FileSchema,
        products: z.array(ProductSchema).optional().nullable(),
        productIds: z.array(z.string()).optional().nullable(),
        id: z.string().optional().nullable(),
        fileTemp: z
          .object({
            file: z.any(),
            id: z.number(),
            process: z.number(),
            isUploading: z.boolean(),
          })
          .optional()
          .nullable(),
        haveInstagramPost: z
          .boolean()
          .optional()
          .nullable()
          .transform(() => undefined),
        _xid: z.string().optional().nullable(),
        buttonTemplate: ButtonTemplateSchema, // شامل normalize URL مانند contents
        validationType: z.nativeEnum(ValidationTypeEnum).optional().nullable(),
        validationErrorMessage: z.string().optional().nullable(),
        vitrins: z.array(VitrinItemSchema).optional().nullable(),
      }),
    ),

    // پاسخ به کامنت‌ها
    commentTexts: z.array(z.string().min(1)).optional().nullable(),
    isReplyCommentEnabled: z.boolean(),
    isCommentContentTargetEnabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.conditionType !== 'noCondition' && (data.conditions?.length ?? 0) === 0) {
      ctx.addIssue({
        path: ['conditions'],
        code: 'custom',
        message: 'required',
      });
    }

    if (data.isDirect && data.isCommentContentTargetEnabled) {
      ctx.addIssue({
        path: ['isDirect'],
        code: 'custom',
        message: 'در حالت دایرکت، نمی‌توانید TargetPostComment را فعال کنید',
      });
    }

    if (!data.isDirect && !data.isComment) {
      const issue = {
        code: 'custom' as const,
        message: 'required',
      };
      ctx.addIssue({ ...issue, path: ['isDirect'] });
      ctx.addIssue({ ...issue, path: ['isComment'] });
    }

    // اگر reminder تعریف شده، زمان نیز الزامی است
    if ((data.reminders?.length ?? 0) > 0 && !data.reminderTime) {
      ctx.addIssue({
        path: ['reminderTime'],
        code: 'custom',
        message: 'required',
      });
    }

    // ولیدیشن وابسته به نوع محتوا در contents
    data.contents.forEach((content, index) => {
      const t = content.type;

      // TEXT نیاز به text
      if (t === AutomationContentTypesEnum.TEXT && !content.text) {
        ctx.addIssue({
          path: ['contents', index, 'text'],
          code: 'custom',
          message: 'required',
        });
        return;
      }

      // INSTAGRAM_POST نیاز به instagramPost
      if (t === AutomationContentTypesEnum.INSTAGRAM_POST && !content.instagramPost) {
        ctx.addIssue({
          path: ['contents', index, 'instagramPost'],
          code: 'custom',
          message: 'required',
        });
        return;
      }

      // AUDIO/VIDEO/IMAGE نیاز به file
      if (
        (t === AutomationContentTypesEnum.AUDIO ||
          t === AutomationContentTypesEnum.VIDEO ||
          t === AutomationContentTypesEnum.IMAGE) &&
        !content.file
      ) {
        ctx.addIssue({
          path: ['contents', index, 'file'],
          code: 'custom',
          message: 'required',
        });
      }

      // PRODUCT نیاز به حداقل یک محصول انتخاب شده
      if (t === AutomationContentTypesEnum.PRODUCT) {
        const selectedProducts = content.products?.filter((product) => product?.id) || [];
        if (selectedProducts.length === 0) {
          ctx.addIssue({
            path: ['contents', index, 'products'],
            code: 'custom',
            message: 'required',
          });
        }
      }

      // اگر نوع محتوا QUESTION باشد، validationType و validationErrorMessage الزامی است
      if (t === AutomationContentTypesEnum.QUESTION) {
        if (!content.validationType) {
          ctx.addIssue({
            path: ['contents', index, 'validationType'],
            code: 'custom',
            message: 'required',
          });
        }
        if (!content.validationErrorMessage) {
          ctx.addIssue({
            path: ['contents', index, 'validationErrorMessage'],
            code: 'custom',
            message: 'required',
          });
        }
      }

      // اگر validationType برابر selectbox باشد، quickReplies باید حداقل یک عنصر داشته باشد
      if (content.validationType === ValidationTypeEnum.Selectbox) {
        if (!content.quickReplies || content.quickReplies.length === 0) {
          ctx.addIssue({
            path: ['contents', index, 'quickReplies'],
            code: 'custom',
            message: 'required',
          });
        }
      }
    });

    // اگر isCommentContentTargetEnabled فعال باشد، instagramPost الزامی است
    if (data.isCommentContentTargetEnabled && !data.instagramPost) {
      ctx.addIssue({
        path: ['instagramPost'],
        code: 'custom',
        message: 'required',
      });
    }

    // برای هدف‌گذاری پست خاص، فقط یک اکانت اینستاگرام باید انتخاب شده باشد
    if (data.isCommentContentTargetEnabled && (data.instagramIds?.length ?? 0) > 1) {
      ctx.addIssue({
        path: ['instagramIds'],
        code: 'custom',
        // `message` alone is never shown for ZodIssueCode.custom — the global error
        // map (utils/zodErrorMap.ts) only reads `params.i18n` and looks it up under
        // the `customErrors` namespace.
        message: 'برای هدف‌گذاری یک پست خاص، فقط یک اکانت اینستاگرام را انتخاب کنید',
        params: { i18n: 'postScopeSingleInstagram' },
      });
    }

    // اگر reminders فعال باشد، حداقل یک reminder content الزامی است
    if (data.isRemindersEnabled && (data.reminders?.length ?? 0) === 0) {
      ctx.addIssue({
        path: ['reminders'],
        code: 'custom',
        message: 'required',
      });
    }

    // اگر justFollowers فعال باشد، followMessage و followCheckMessage الزامی است
    if (data.justFollowers) {
      if (!data.followMessage) {
        ctx.addIssue({
          path: ['followMessage'],
          code: 'custom',
          message: 'required',
        });
      }
      if (!data.followCheckMessage) {
        ctx.addIssue({
          path: ['followCheckMessage'],
          code: 'custom',
          message: 'required',
        });
      }
    }

    // همان ولیدیشن را برای reminders هم اعمال کنیم
    data.reminders.forEach((content, index) => {
      const t = content.type;

      if (t === AutomationContentTypesEnum.TEXT && !content.text) {
        ctx.addIssue({
          path: ['reminders', index, 'text'],
          code: 'custom',
          message: 'required',
        });
        return;
      }

      if (t === AutomationContentTypesEnum.INSTAGRAM_POST && !content.instagramPost) {
        ctx.addIssue({
          path: ['reminders', index, 'instagramPost'],
          code: 'custom',
          message: 'required',
        });
        return;
      }

      if (
        (t === AutomationContentTypesEnum.AUDIO ||
          t === AutomationContentTypesEnum.VIDEO ||
          t === AutomationContentTypesEnum.IMAGE) &&
        !content.file
      ) {
        ctx.addIssue({
          path: ['reminders', index, 'file'],
          code: 'custom',
          message: 'required',
        });
      }

      // PRODUCT نیاز به حداقل یک محصول انتخاب شده
      if (t === AutomationContentTypesEnum.PRODUCT) {
        const selectedProducts = content.products?.filter((product) => product?.id) || [];
        if (selectedProducts.length === 0) {
          ctx.addIssue({
            path: ['reminders', index, 'products'],
            code: 'custom',
            message: 'required',
          });
        }
      }

      // اگر نوع محتوا QUESTION باشد، validationType و validationErrorMessage الزامی است
      if (t === AutomationContentTypesEnum.QUESTION) {
        if (!content.validationType) {
          ctx.addIssue({
            path: ['reminders', index, 'validationType'],
            code: 'custom',
            message: 'required',
          });
        }
        if (!content.validationErrorMessage) {
          ctx.addIssue({
            path: ['reminders', index, 'validationErrorMessage'],
            code: 'custom',
            message: 'required',
          });
        }
      }

      // اگر validationType برابر selectbox باشد، quickReplies باید حداقل یک عنصر داشته باشد
      if (content.validationType === ValidationTypeEnum.Selectbox) {
        if (!content.quickReplies || content.quickReplies.length === 0) {
          ctx.addIssue({
            path: ['reminders', index, 'quickReplies'],
            code: 'custom',
            message: 'required',
          });
        }
      }
    });
  });

export type AutomationFormType = z.infer<typeof AutomationFormSchema>;
