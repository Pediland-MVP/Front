import { AutomationContentTypesEnum } from '@/constants/automationContent.enum';
import { REGEX_URL } from '@/utils/regex';
import z from 'zod';

const ContentItemSchema_TEMP = z.object({
  type: z.nativeEnum(AutomationContentTypesEnum),
  text: z
    .string()
    .min(1)
    .optional()
    .nullable()
    .transform((data) => data || undefined),
  instagramPost: z
    .object({
      mediaUrl: z.string().optional().nullable(),
      mediaId: z.string().min(1),
    })
    .optional()
    .nullable(),
  file: z
    .object({
      id: z.number(),
      url: z.string().url().optional().nullable(),
      name: z.string().optional().nullable(),
      mimeType: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  products: z
    .array(
      z
        .object({
          id: z.string().optional().nullable(),
          images: z
            .array(
              z.object({
                url: z.string().optional().nullable(),
                id: z.number().optional().nullable(),
              }),
            )
            .optional()
            .nullable(),
          _xid: z.string().optional().nullable(),
        })
        .nullable()
        .optional(),
    )
    .nullable()
    .optional(),
  // Just for sending data
  productIds: z.array(z.string()).optional().nullable(),
  id: z.string().optional().nullable(),
  haveConsent: z
    .boolean()
    .optional()
    .nullable()
    .transform((data) => data || false),
  haveInstagramPost: z
    .boolean()
    .optional()
    .nullable()
    .transform((data) => undefined),
  consentText: z
    .string()
    .optional()
    .nullable()
    .transform((data) => data || undefined),
  _xid: z.string().optional().nullable(),
  buttonTemplate: z
    .object({
      text: z.string().min(1),
      buttons: z.array(
        z.object({
          title: z.string().min(1),
          url: z
            .string()
            .regex(REGEX_URL)
            .transform((val) => val.toLowerCase()),
          _xid: z.string().optional().nullable(),
        }),
      ),
    })
    .optional()
    .nullable(),
});

export const AutomationFormSchema_TEMP = z
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

    contents: z.array(ContentItemSchema_TEMP).min(1),

    instagramPost: z
      .object({
        mediaUrl: z.string().optional().nullable(),
        mediaId: z.string().min(1),
        picture: z.object({ url: z.string().optional().nullable() }).optional().nullable(),
      })
      .optional()
      .nullable(),

    commentStartText: z
      .string()
      .optional()
      .nullable()
      .transform((data) => data || undefined),
    commentStartTitle: z
      .string()
      .optional()
      .nullable()
      .transform((data) => data || undefined),
    justFollowers: z.boolean(),
    followMessage: z.string().optional().nullable(),
    followCheckMessage: z.string().optional().nullable(),
    isRemindersEnabled: z
      .boolean()
      .nullable()
      .optional()
      .transform((data) => data || false),
    reminderTime: z
      .string()
      .optional()
      .nullable()
      .transform((data) => data || undefined),
    reminders: z.array(
      z.object({
        type: z.nativeEnum(AutomationContentTypesEnum),
        text: z
          .string()
          .min(1)
          .optional()
          .nullable()
          .transform((data) => data || undefined),
        instagramPost: z
          .object({
            mediaUrl: z.string().optional().nullable(),
            mediaId: z.string().min(1),
          })
          .optional()
          .nullable(),
        file: z
          .object({
            id: z.number(),
            url: z.string().url().optional().nullable(),
            name: z.string().optional().nullable(),
            mimeType: z.string().optional().nullable(),
          })
          .optional()
          .nullable(),
        products: z
          .array(
            z
              .object({
                id: z.string().optional().nullable(),
                images: z
                  .array(
                    z.object({
                      url: z.string().optional().nullable(),
                      id: z.number().optional().nullable(),
                    }),
                  )
                  .optional()
                  .nullable(),
                _xid: z.string().optional().nullable(),
              })
              .nullable()
              .optional(),
          )
          .nullable()
          .optional(),
        // Just for sending data
        productIds: z.array(z.string()).optional().nullable(),
        id: z.string().optional().nullable(),
        haveInstagramPost: z
          .boolean()
          .optional()
          .nullable()
          .transform((data) => undefined),
        _xid: z.string().optional().nullable(),
        buttonTemplate: z
          .object({
            text: z.string().min(1),
            buttons: z.array(
              z.object({
                title: z.string().min(1),
                url: z.string().regex(REGEX_URL),
                _xid: z.string().optional().nullable(),
              }),
            ),
          })
          .optional()
          .nullable(),
      }),
    ),
    commentTexts: z.array(z.string().min(1)).nullable().optional(),
    isReplyCommentEnabled: z.boolean(),
    isCommentContentTargetEnabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Triggers
    if (!data.isDirect && !data.isComment) {
      const issue = {
        code: 'custom' as const,
        message: 'required',
      };
      ctx.addIssue({ ...issue, path: ['isDirect'] });
      ctx.addIssue({ ...issue, path: ['isComment'] });
    }

    if (data.reminders.length > 0 && !data.reminderTime) {
      ctx.addIssue({
        path: ['reminderTime'],
        code: 'custom',
        message: 'required',
      });
    }

    data.contents.forEach((content, index) => {
      // Type issues
      if (content.type === AutomationContentTypesEnum.TEXT && !content.text) {
        ctx.addIssue({
          path: ['contents', index, 'text'],
          code: 'custom',
          message: 'required',
        });
        return;
      }

      if (content.type === AutomationContentTypesEnum.INSTAGRAM_POST && !content.instagramPost) {
        ctx.addIssue({
          path: ['contents', index, 'instagramPost'],
          code: 'custom',
          message: 'required',
        });
        return;
      }

      if (
        (content.type === AutomationContentTypesEnum.AUDIO ||
          content.type === AutomationContentTypesEnum.VIDEO ||
          content.type === AutomationContentTypesEnum.IMAGE) &&
        !content.file
      ) {
        // For files: video, image, voice
        ctx.addIssue({
          path: ['contents', index, 'file'],
          code: 'custom',
          message: 'required',
        });
      }
    });
  });
