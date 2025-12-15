// src/schemas/automationForm.ts

import { AutomationContentTypesEnum } from "@/constants/automationContent.enum";
import { ButtonTypeEnum } from "@/types/buttons.enum";
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

const ButtonSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(ButtonTypeEnum.TEXT),
    title: z.string().min(1),
    _xid: z.string().optional().nullable(),
  }),
  z.object({
    type: z.literal(ButtonTypeEnum.URL),
    title: z.string().min(1),
    url: z.string().regex(REGEX_URL),
    _xid: z.string().optional().nullable(),
  }),
  z.object({
    type: z.literal(ButtonTypeEnum.AUTOMATION),
    title: z.string().min(1),
    destinationContentCycleId: z.string().min(1),
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
    picture: z
      .object({ url: z.string().optional().nullable() })
      .optional()
      .nullable(),
  })
  .optional()
  .nullable();

/* ------------------------------ Content Schema ------------------------------ */

export const ContentItemSchema = z.object({
  id: z.string().optional().nullable(),
  _xid: z.string().optional().nullable(),
  text: optionalStringToUndef,
  consentText: optionalStringToUndef,
  haveConsent: optionalBoolDefault(false),
  type: z.nativeEnum(AutomationContentTypesEnum),
  file: FileSchema,
  instagramPost: InstagramPostSchema,
  buttonTemplate: ButtonTemplateSchema,
  products: z.array(ProductSchema).optional().nullable(),

  productIds: z.array(z.string()).optional().nullable(),
  haveInstagramPost: z
    .boolean()
    .optional()
    .nullable()
    .transform(() => undefined),
});

export const ContentItemConditionSchema = z.object({
  type: z.string().min(1),
  value: z.string().min(1),
  id: z.string(),
  conditionId: z.string().optional().nullable(),
});
/* ------------------------------- Main Schema -------------------------------- */

export const AutomationFormSchema = z
  .object({
    isDirect: z.boolean(),
    isComment: z.boolean(),

    conditions: z.array(ContentItemConditionSchema).min(1),

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
    if (data.isDirect && data.isCommentContentTargetEnabled) {
      ctx.addIssue({
        path: ["isDirect"],
        code: "custom",
        message: "در حالت دایرکت، نمی‌توانید TargetPostComment را فعال کنید",
      });
    }

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

      // PRODUCT نیاز به حداقل یک محصول انتخاب شده
      if (t === AutomationContentTypesEnum.PRODUCT) {
        const selectedProducts =
          content.products?.filter((product) => product?.id) || [];
        if (selectedProducts.length === 0) {
          ctx.addIssue({
            path: ["contents", index, "products"],
            code: "custom",
            message: "required",
          });
        }
      }
    });

    // اگر isCommentContentTargetEnabled فعال باشد، instagramPost الزامی است
    if (data.isCommentContentTargetEnabled && !data.instagramPost) {
      ctx.addIssue({
        path: ["instagramPost"],
        code: "custom",
        message: "required",
      });
    }

    // اگر reminders فعال باشد، حداقل یک reminder content الزامی است
    if (data.isRemindersEnabled && (data.reminders?.length ?? 0) === 0) {
      ctx.addIssue({
        path: ["reminders"],
        code: "custom",
        message: "required",
      });
    }

    // اگر justFollowers فعال باشد، followMessage و followCheckMessage الزامی است
    if (data.justFollowers) {
      if (!data.followMessage) {
        ctx.addIssue({
          path: ["followMessage"],
          code: "custom",
          message: "required",
        });
      }
      if (!data.followCheckMessage) {
        ctx.addIssue({
          path: ["followCheckMessage"],
          code: "custom",
          message: "required",
        });
      }
    }

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

      // PRODUCT نیاز به حداقل یک محصول انتخاب شده
      if (t === AutomationContentTypesEnum.PRODUCT) {
        const selectedProducts =
          content.products?.filter((product) => product?.id) || [];
        if (selectedProducts.length === 0) {
          ctx.addIssue({
            path: ["reminders", index, "products"],
            code: "custom",
            message: "required",
          });
        }
      }
    });
  });

export type AutomationFormType = z.infer<typeof AutomationFormSchema>;
