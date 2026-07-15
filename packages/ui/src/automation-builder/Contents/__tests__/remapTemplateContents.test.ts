import { describe, it, expect } from 'vitest';
import { remapTemplateContents } from '../remapTemplateContents';
import { AutomationContentTypesEnum } from '../../constants/automationContent.enum';

describe('remapTemplateContents', () => {
  it('strips server-only ids/timestamps and keeps type + content payload per item', () => {
    const raw = [
      {
        id: 'server-id-1',
        createDate: '2026-01-01',
        updateDate: '2026-01-01',
        type: AutomationContentTypesEnum.TEXT,
        text: 'سلام!',
      },
      { id: 'server-id-2', type: AutomationContentTypesEnum.DELAY, delayMs: 60000 },
    ];
    const result = remapTemplateContents(raw);
    expect(result).toEqual([
      { type: AutomationContentTypesEnum.TEXT, text: 'سلام!' },
      { type: AutomationContentTypesEnum.DELAY, delayMs: 60000, delayUnit: 'min' },
    ]);
  });

  it('derives delayUnit as hour/sec at the other delayMs boundaries', () => {
    const raw = [
      { id: 'a', type: AutomationContentTypesEnum.DELAY, delayMs: 1000 * 60 * 60 * 2 },
      { id: 'b', type: AutomationContentTypesEnum.DELAY, delayMs: 5000 },
    ];
    const result = remapTemplateContents(raw);
    expect(result[0].delayUnit).toBe('hour');
    expect(result[1].delayUnit).toBe('sec');
  });

  it('remaps buttonTemplate.buttons the same way AutomationForm normalizes them on load', () => {
    const raw = [
      {
        id: 'server-id-3',
        type: AutomationContentTypesEnum.BUTTON_TEMPLATE,
        buttonTemplate: {
          text: 'انتخاب کنید',
          buttons: [{ postbackPayloadType: 'TEXT', title: 'باشه', priority: 1 }],
        },
      },
    ];
    const result = remapTemplateContents(raw);
    expect(result[0].buttonTemplate.buttons[0].title).toBe('باشه');
    // Case-normalized to the literal the shared ButtonSchema discriminates on ('text'),
    // not the raw backend value ('TEXT') — otherwise zod's discriminatedUnion would
    // reject the appended item.
    expect(result[0].buttonTemplate.buttons[0].postbackPayloadType).toBe('text');
  });

  it('strips server-only ids from buttonTemplate.buttons and derives destinationContentCycleId', () => {
    const raw = [
      {
        id: 'server-id-4',
        type: AutomationContentTypesEnum.BUTTON_TEMPLATE,
        buttonTemplate: {
          text: 'ادامه',
          buttons: [
            {
              id: 'btn-id-1',
              createDate: '2026-01-01',
              updateDate: '2026-01-01',
              deleteDate: null,
              postbackPayloadType: 'contentCycle',
              title: 'برو به اتوماسیون',
              priority: 1,
              destinationContentCycle: { id: 'other-automation-id' },
              buttonTemplateId: 'server-id-4',
            },
          ],
        },
      },
    ];
    const result = remapTemplateContents(raw);
    const button = result[0].buttonTemplate.buttons[0];
    expect(button.id).toBeUndefined();
    expect(button.buttonTemplateId).toBeUndefined();
    expect(button.postbackPayloadType).toBe('startAutomation');
    expect(button.destinationContentCycleId).toBe('other-automation-id');
  });

  it('derives vitrin imageId/imageUrl from images[0] and strips server-only fields', () => {
    const raw = [
      {
        id: 'server-id-5',
        type: AutomationContentTypesEnum.VITRIN,
        vitrins: [
          {
            id: 'vitrin-id-1',
            createDate: '2026-01-01',
            updateDate: '2026-01-01',
            contentId: 'server-id-5',
            title: 'کالای من',
            description: 'توضیح',
            images: [{ id: 12, url: 'https://example.com/a.png' }],
            buttons: [],
          },
        ],
      },
    ];
    const result = remapTemplateContents(raw);
    const vitrin = result[0].vitrins[0];
    expect(vitrin.imageId).toBe(12);
    expect(vitrin.imageUrl).toBe('https://example.com/a.png');
    expect(vitrin.id).toBeUndefined();
    expect(vitrin.contentId).toBeUndefined();
    expect(vitrin.images).toBeUndefined();
  });
});
