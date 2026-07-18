import { describe, it, expect } from 'vitest';
import { AutomationContentTypesEnum } from '../constants/automationContent.enum';
import { AutomationFormSchema, ContentItemSchema } from '../schemas/automationForm';
import { ButtonTypeEnum } from '../types/buttons.enum';

describe('automation-builder shared schema/constants', () => {
  it('exposes AutomationContentTypesEnum.TEXT', () => {
    expect(AutomationContentTypesEnum.TEXT).toBe('text');
  });

  it('rejects an empty form payload', () => {
    const result = AutomationFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('automation schema — http links are upgraded to https on parse', () => {
  it('upgrades an http link inside a content text', () => {
    const result = ContentItemSchema.safeParse({
      type: AutomationContentTypesEnum.TEXT,
      text: 'برای خرید به http://shop.ir برو',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.text).toBe('برای خرید به https://shop.ir برو');
  });

  it('leaves a bare domain in content text alone', () => {
    const result = ContentItemSchema.safeParse({
      type: AutomationContentTypesEnum.TEXT,
      text: 'قیمت را در shop.ir ببین',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.text).toBe('قیمت را در shop.ir ببین');
  });

  it('upgrades a button template text and its button url', () => {
    const result = ContentItemSchema.safeParse({
      type: AutomationContentTypesEnum.TEXT,
      buttonTemplate: {
        text: 'اینجا ببین http://shop.ir',
        buttons: [
          {
            postbackPayloadType: ButtonTypeEnum.URL,
            title: 'خرید',
            url: 'http://shop.ir/product',
          },
        ],
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.buttonTemplate?.text).toBe('اینجا ببین https://shop.ir');
    expect(result.data.buttonTemplate?.buttons[0]).toMatchObject({
      url: 'https://shop.ir/product',
    });
  });

  it('prepends https to a bare-domain button url', () => {
    const result = ContentItemSchema.safeParse({
      type: AutomationContentTypesEnum.TEXT,
      buttonTemplate: {
        text: 'ok',
        buttons: [{ postbackPayloadType: ButtonTypeEnum.URL, title: 'خرید', url: 'shop.ir' }],
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.buttonTemplate?.buttons[0]).toMatchObject({
      url: 'https://shop.ir',
    });
  });

  it('applies to quickReplies url buttons too — they share ButtonSchema', () => {
    const result = ContentItemSchema.safeParse({
      type: AutomationContentTypesEnum.TEXT,
      text: 'hi',
      quickReplies: [
        { postbackPayloadType: ButtonTypeEnum.URL, title: 'خرید', url: 'http://shop.ir' },
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.quickReplies?.[0]).toMatchObject({ url: 'https://shop.ir' });
  });

  it('still rejects an invalid url — the transform does not paper over bad input', () => {
    const result = ContentItemSchema.safeParse({
      type: AutomationContentTypesEnum.TEXT,
      buttonTemplate: {
        text: 'ok',
        buttons: [{ postbackPayloadType: ButtonTypeEnum.URL, title: 'خرید', url: 'not a url !!' }],
      },
    });

    expect(result.success).toBe(false);
  });

  it('does NOT rewrite consentText — out of scope', () => {
    const result = ContentItemSchema.safeParse({
      type: AutomationContentTypesEnum.TEXT,
      text: 'hi',
      consentText: 'قوانین در http://shop.ir/terms',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.consentText).toBe('قوانین در http://shop.ir/terms');
  });
});

describe('automation schema — http links upgraded in the remaining message fields', () => {
  const base = {
    isDirect: true,
    isComment: false,
    isNoCondition: true,
    conditionType: 'noCondition' as const,
    instagramIds: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
    contents: [{ type: AutomationContentTypesEnum.TEXT, text: 'hi' }],
    justFollowers: false,
    isRemindersEnabled: false,
    reminders: [],
    isCommentContentTargetEnabled: false,
    isReplyCommentEnabled: false,
  };

  it('upgrades an http link in followMessage but leaves followCheckMessage alone — it is a short button label, not a message', () => {
    const result = AutomationFormSchema.safeParse({
      ...base,
      justFollowers: true,
      followMessage: 'دنبال کن http://shop.ir',
      followCheckMessage: 'فالو کردم http://shop.ir',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.followMessage).toBe('دنبال کن https://shop.ir');
    expect(result.data.followCheckMessage).toBe('فالو کردم http://shop.ir');
  });

  it('upgrades an http link in commentStartText/commentStartTitle', () => {
    const result = AutomationFormSchema.safeParse({
      ...base,
      isComment: true,
      commentStartText: 'لینک http://shop.ir را ببین',
      commentStartTitle: 'عنوان http://shop.ir',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.commentStartText).toBe('لینک https://shop.ir را ببین');
    expect(result.data.commentStartTitle).toBe('عنوان https://shop.ir');
  });

  it('upgrades an http link in a reminder text, mirroring contents[].text', () => {
    const result = AutomationFormSchema.safeParse({
      ...base,
      isRemindersEnabled: true,
      reminderTime: '1h',
      reminders: [
        {
          type: AutomationContentTypesEnum.TEXT,
          text: 'یادآوری http://shop.ir',
        },
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.reminders[0].text).toBe('یادآوری https://shop.ir');
  });

  it('does not touch the automation title — it is a plain Input, not a message', () => {
    const result = AutomationFormSchema.safeParse({
      ...base,
      title: 'کمپین http://shop.ir',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.title).toBe('کمپین http://shop.ir');
  });
});
