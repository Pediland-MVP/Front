// src/components/Automations/form/Contents/contentTypeOptions.tsx

import { AutomationContentTypesEnum } from '../constants/automationContent.enum';
import { ChatTextIcon } from '@phosphor-icons/react/dist/ssr/ChatText';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import { ShoppingBagIcon } from '@phosphor-icons/react/dist/ssr/ShoppingBag';
import { RadioButtonIcon } from '@phosphor-icons/react/dist/ssr/RadioButton';
import { ImageIcon } from '@phosphor-icons/react/dist/ssr/Image';
import { VideoIcon } from '@phosphor-icons/react/dist/ssr/Video';
import { MusicNoteSimpleIcon } from '@phosphor-icons/react/dist/ssr/MusicNoteSimple';
import { CardsIcon } from '@phosphor-icons/react/dist/ssr/Cards';
import { TimerIcon } from '@phosphor-icons/react/dist/ssr/Timer';
import { StackIcon } from '@phosphor-icons/react/dist/ssr/Stack';
import React from 'react';

export interface ContentTypeOption {
  // `'media'` and `'template'` are non-enum sentinels: `'media'` is remapped to
  // `AutomationContentTypesEnum.IMAGE` on select (see `Contents.tsx`'s
  // `selectAutomationTypeHandler`); `'template'` never reaches that per-type default
  // payload branch at all — it's intercepted first to open the `TemplatePicker` instead
  // (see Task 27's `Contents.tsx` changes).
  value: AutomationContentTypesEnum | 'media' | 'template';
  label: string;
  icon: React.ReactNode;
}

export const contentTypeOptions: ContentTypeOption[] = [
  {
    value: AutomationContentTypesEnum.TEXT,
    label: 'Text',
    icon: <ChatTextIcon size={30} />,
  },
  {
    value: AutomationContentTypesEnum.IMAGE,
    label: 'Image',
    icon: <ImageIcon size={30} />,
  },
  {
    value: AutomationContentTypesEnum.VIDEO,
    label: 'Video',
    icon: <VideoIcon size={30} />,
  },
  {
    value: AutomationContentTypesEnum.AUDIO,
    label: 'Audio',
    icon: <MusicNoteSimpleIcon size={30} />,
  },
  {
    value: AutomationContentTypesEnum.BUTTON_TEMPLATE,
    label: 'Button',
    icon: <RadioButtonIcon size={30} />,
  },
  {
    value: AutomationContentTypesEnum.INSTAGRAM_POST,
    label: 'Instagram Post',
    icon: <InstagramLogoIcon size={30} />,
  },
  {
    value: AutomationContentTypesEnum.PRODUCT,
    label: 'Product',
    icon: <ShoppingBagIcon size={30} />,
  },
  {
    value: AutomationContentTypesEnum.QUESTION,
    label: 'Question',
    icon: <ChatTextIcon size={30} />,
  },
  {
    value: AutomationContentTypesEnum.VITRIN,
    label: 'Vitrin',
    icon: <CardsIcon size={30} />,
  },
  {
    value: AutomationContentTypesEnum.DELAY,
    label: 'Delay',
    icon: <TimerIcon size={30} />,
  },
  // Last option, by design (Task 27) — inserts an existing template's content steps
  // (not its triggers) at the end of the current automation's contents. Hidden entirely
  // in `mode="template"` (a template can't embed another template) — see `Contents.tsx`.
  {
    value: 'template',
    label: 'Template',
    icon: <StackIcon size={30} />,
  },
];
