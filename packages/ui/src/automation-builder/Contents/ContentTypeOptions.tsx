// src/components/Automations/form/Contents/contentTypeOptions.tsx

import { AutomationContentTypesEnum } from '../constants/automationContent.enum';
import {
  ChatTextIcon,
  InstagramLogoIcon,
  ShoppingBagIcon,
  RadioButtonIcon,
  ImageIcon,
  VideoIcon,
  MusicNoteSimpleIcon,
  CardsIcon,
  TimerIcon,
} from '@phosphor-icons/react/dist/ssr';
import React from 'react';

export interface ContentTypeOption {
  value: AutomationContentTypesEnum | 'media';
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
];
