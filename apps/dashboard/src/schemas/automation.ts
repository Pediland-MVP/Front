import z, { string } from 'zod';
import { PageMetaSchema } from './pageMeta';
import { ContentItemConditionSchema, ContentItemSchema } from './automationForm';

export const AutomationSchema = z.object({
  id: z.string(),
  createDate: z.string(),
  updateDate: z.string(),
  isDirect: z.boolean(),
  isComment: z.boolean(),
  commentStartText: z.string(),
  commentStartTitle: z.string(),
  justFollowers: z.boolean(),
  followCheckMessage: z.string(),
  followMessage: z.string().optional().nullable(),
  reminderTime: z.string().optional().nullable(),
  isRemindersEnabled: z.boolean(),
  commentTexts: z.array(z.string()),
  instagramLinks: z
    .array(
      z.object({
        instagramId: z.string(),
        instagram: z
          .object({
            id: z.string(),
            username: z.string().nullish(),
            name: z.string().nullish(),
          })
          .nullish(),
      }),
    )
    .default([]),
  instagramPost: z
    .object({
      mediaUrl: z.string().optional().nullable(),
      mediaId: z.string().min(1),
      picture: z.object({ url: z.string().optional().nullable() }).optional().nullable(),
    })
    .optional()
    .nullable(),
  contents: z.array(ContentItemSchema),
  conditions: z.array(ContentItemConditionSchema),
  sessionsCount: z.number(),
});

export const AutomationResponseSchema = z.object({
  items: z.array(AutomationSchema),
  meta: PageMetaSchema,
});

export type Automation = z.infer<typeof AutomationSchema>;
export type AutomationResponse = z.infer<typeof AutomationResponseSchema>;
