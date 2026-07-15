// packages/ui/src/automation-builder/Contents/remapTemplateContents.ts

import { AutomationContentTypesEnum } from '../constants/automationContent.enum';
import { ButtonTypeEnum } from '../types/buttons.enum';

/**
 * Normalizes a single raw button row (`ButtonTemplateItem`, whether it comes from a
 * content's `buttonTemplate.buttons` or a vitrin's `buttons`) into the shape the shared
 * `ButtonSchema` discriminates on (`postbackPayloadType`), and strips server-only /
 * back-reference fields (`id`, timestamps, the FK back to its owning `buttonTemplate` or
 * `contentCycleVitrin`).
 *
 * Mirrors the dashboard's own `transformButtons` (`apps/dashboard/src/components/
 * Automations/AutomationForm.tsx`) / the admin's `TemplateForm.tsx` copy of the same
 * logic. Kept defensive even though `GET /templates/:id` already writes a
 * frontend-compatible `postbackPayloadType` at template create/update time — a button
 * with a stale-cased value (e.g. `'TEXT'` instead of the schema's literal `'text'`) would
 * otherwise fail the shared `ContentItemSchema`'s `z.discriminatedUnion` validation once
 * appended.
 */
function remapButton(raw: any): any {
  const {
    id: _id,
    createDate: _createDate,
    updateDate: _updateDate,
    deleteDate: _deleteDate,
    buttonTemplateId: _buttonTemplateId,
    buttonTemplate: _buttonTemplate,
    contentCycleVitrinId: _contentCycleVitrinId,
    contentCycleVitrin: _contentCycleVitrin,
    ...rest
  } = raw ?? {};
  const button: any = { ...rest };

  const typeToNormalize = button.postbackPayloadType || button.type;
  if (typeToNormalize) {
    const lowerType = String(typeToNormalize).toLowerCase();
    if (lowerType === 'text' || lowerType === ButtonTypeEnum.TEXT.toLowerCase()) {
      button.postbackPayloadType = ButtonTypeEnum.TEXT;
    } else if (lowerType === 'url' || lowerType === ButtonTypeEnum.URL.toLowerCase()) {
      button.postbackPayloadType = ButtonTypeEnum.URL;
    } else if (
      lowerType === 'contentcycle' ||
      lowerType === 'automation' ||
      lowerType === ButtonTypeEnum.START_AUTOMATION.toLowerCase()
    ) {
      button.postbackPayloadType = ButtonTypeEnum.START_AUTOMATION;
    } else if (lowerType === ButtonTypeEnum.CONSENT.toLowerCase()) {
      button.postbackPayloadType = ButtonTypeEnum.CONSENT;
    }
  }

  if (
    button.postbackPayloadType === ButtonTypeEnum.START_AUTOMATION &&
    button.destinationContentCycle
  ) {
    button.destinationContentCycleId = button.destinationContentCycle.id;
  }

  return button;
}

/**
 * Normalizes a single raw `ContentCycleVitrin` row: derives `imageId`/`imageUrl` from its
 * `images[0]` relation (the shape `VitrinItemSchema` expects), remaps its own `buttons`
 * the same way as a content's `buttonTemplate.buttons`, and strips server-only /
 * back-reference fields (`id`, timestamps, the FK back to its owning content).
 */
function remapVitrin(raw: any): any {
  const {
    id: _id,
    createDate: _createDate,
    updateDate: _updateDate,
    deleteDate: _deleteDate,
    contentId: _contentId,
    content: _content,
    images,
    ...rest
  } = raw ?? {};
  const vitrin: any = { ...rest };

  vitrin.imageId = images?.[0]?.id;
  vitrin.imageUrl = images?.[0]?.url;

  if (vitrin.buttons?.length) {
    vitrin.buttons = vitrin.buttons.map(remapButton);
  }

  return vitrin;
}

/**
 * Takes the raw `contents[]` returned by `GET /templates/:id` (a raw
 * `ContentCycleContent[]` entity graph) and strips server-only fields (`id`,
 * `createDate`, `updateDate`, `deleteDate`, `contentCycleId`, the `contentCycle`
 * back-ref), deriving the same client-only computed fields `AutomationForm`/
 * `TemplateForm` already derive when loading a real automation/template — `delayUnit`
 * from `delayMs`, vitrin `imageId`/`imageUrl` from `images[0]`, button
 * `postbackPayloadType` normalization — so an appended item validates against the shared
 * `ContentItemSchema` exactly like a freshly hand-added content item, and carries no
 * residual pointer back to the source template/automation it was copied from.
 *
 * Pure function: no network calls, no side effects — independently unit-testable (see
 * `__tests__/remapTemplateContents.test.ts`).
 */
export function remapTemplateContents(rawContents: any[]): any[] {
  return (rawContents ?? []).map((raw) => {
    const {
      id: _id,
      createDate: _createDate,
      updateDate: _updateDate,
      deleteDate: _deleteDate,
      contentCycleId: _contentCycleId,
      contentCycle: _contentCycle,
      ...rest
    } = raw ?? {};
    const content: any = { ...rest };

    if (content.type === AutomationContentTypesEnum.DELAY) {
      if (content.delayMs >= 1000 * 60 * 60) content.delayUnit = 'hour';
      else if (content.delayMs >= 1000 * 60) content.delayUnit = 'min';
      else content.delayUnit = 'sec';
    }

    if (content.buttonTemplate?.buttons) {
      content.buttonTemplate = {
        ...content.buttonTemplate,
        buttons: content.buttonTemplate.buttons.map(remapButton),
      };
    }

    if (content.vitrins?.length) {
      content.vitrins = content.vitrins.map(remapVitrin);
    }

    return content;
  });
}
