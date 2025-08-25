// src/schemas/automationForm.ts
import { AutomationContentTypesEnum } from "@/constants/automationContent.enum";
import { REGEX_URL } from "@/utils/regex";
import z from "zod";

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

const ButtonSchema = z.object({
  title: z.string().min(1),
  url: z
    .string()
    .regex(REGEX_URL)
    .transform((val) => val.toLowerCase()),
  _xid: z.string().optional().nullable(),
});

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
    picture: z
      .object({ url: z.string().optional().nullable() })
      .optional()
      .nullable(),
  })
  .optional()
  .nullable();

/* ------------------------------ Content Schema ------------------------------ */

const ContentItemSchema = z.object({
  type: z.nativeEnum(AutomationContentTypesEnum),

  // TEXT-mode
  text: optionalStringToUndef,

  // INSTAGRAM_POST-mode
  instagramPost: InstagramPostSchema,

  // FILE modes: AUDIO / VIDEO / IMAGE
  file: FileSchema,

  // PRODUCT attach
  products: z.array(ProductSchema).optional().nullable(),
  // For sending only
  productIds: z.array(z.string()).optional().nullable(),

  // misc
  id: z.string().optional().nullable(),
  _xid: z.string().optional().nullable(),

  // consent (برای متن‌هایی که نیاز به تأیید دارند)
  haveConsent: optionalBoolDefault(false),
  consentText: optionalStringToUndef,

  // نگه نمی‌داریم، فقط جهت UI استفاده می‌شود
  haveInstagramPost: z
    .boolean()
    .optional()
    .nullable()
    .transform(() => undefined),

  // optional buttons
  buttonTemplate: ButtonTemplateSchema,
});

/* ------------------------------- Main Schema -------------------------------- */

export const AutomationFormSchema = z
  .object({
    isDirect: z.boolean(),
    isComment: z.boolean(),

    conditions: z
      .array(
        z.object({
          type: z.string().min(1),
          value: z.string().min(1),
          id: z.string(),
          conditionId: z.string().optional().nullable(),
        }),
      )
      .min(1),

    contents: z.array(ContentItemSchema).min(1),

    instagramPost: InstagramPostSchema, // برای سناریوهای سطح فرم

    // شروع مکالمه در کامنت
    commentStartText: optionalStringToUndef,
    commentStartTitle: optionalStringToUndef,

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
        instagramPost: InstagramPostSchema,
        file: FileSchema,
        products: z.array(ProductSchema).optional().nullable(),
        productIds: z.array(z.string()).optional().nullable(),
        id: z.string().optional().nullable(),
        haveInstagramPost: z
          .boolean()
          .optional()
          .nullable()
          .transform(() => undefined),
        _xid: z.string().optional().nullable(),
        buttonTemplate: ButtonTemplateSchema, // شامل normalize URL مانند contents
      }),
    ),

    // پاسخ به کامنت‌ها
    commentTexts: z.array(z.string().min(1)).optional().nullable(),
    isReplyCommentEnabled: z.boolean(),
    isCommentContentTargetEnabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.isDirect && !data.isComment) {
      const issue = {
        code: "custom" as const,
        message: "required",
      };
      ctx.addIssue({ ...issue, path: ["isDirect"] });
      ctx.addIssue({ ...issue, path: ["isComment"] });
    }

    // اگر reminder تعریف شده، زمان نیز الزامی است
    if ((data.reminders?.length ?? 0) > 0 && !data.reminderTime) {
      ctx.addIssue({
        path: ["reminderTime"],
        code: "custom",
        message: "required",
      });
    }

    // ولیدیشن وابسته به نوع محتوا در contents
    data.contents.forEach((content, index) => {
      const t = content.type;

      // TEXT نیاز به text
      if (t === AutomationContentTypesEnum.TEXT && !content.text) {
        ctx.addIssue({
          path: ["contents", index, "text"],
          code: "custom",
          message: "required",
        });
        return;
      }

      // INSTAGRAM_POST نیاز به instagramPost
      if (
        t === AutomationContentTypesEnum.INSTAGRAM_POST &&
        !content.instagramPost
      ) {
        ctx.addIssue({
          path: ["contents", index, "instagramPost"],
          code: "custom",
          message: "required",
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
          path: ["contents", index, "file"],
          code: "custom",
          message: "required",
        });
      }
    });

    // همان ولیدیشن را برای reminders هم اعمال کنیم
    data.reminders.forEach((content, index) => {
      const t = content.type;

      if (t === AutomationContentTypesEnum.TEXT && !content.text) {
        ctx.addIssue({
          path: ["reminders", index, "text"],
          code: "custom",
          message: "required",
        });
        return;
      }

      if (
        t === AutomationContentTypesEnum.INSTAGRAM_POST &&
        !content.instagramPost
      ) {
        ctx.addIssue({
          path: ["reminders", index, "instagramPost"],
          code: "custom",
          message: "required",
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
          path: ["reminders", index, "file"],
          code: "custom",
          message: "required",
        });
      }
    });
  });
