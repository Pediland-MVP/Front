// src/components/Automations/form/Contents/contentTypeOptions.tsx

import { AutomationContentTypesEnum } from "@/constants/automationContent.enum";
import {
  ChatTextIcon,
  InstagramLogoIcon,
  ShoppingBagIcon,
  RadioButtonIcon,
  PaperclipIcon,
} from "@phosphor-icons/react/dist/ssr";
import React from "react";

export interface ContentTypeOption {
  value: AutomationContentTypesEnum | "media";
  label: string;
  icon: React.ReactNode;
}

export const contentTypeOptions: ContentTypeOption[] = [
  {
    value: AutomationContentTypesEnum.TEXT,
    label: "Text",
    icon: <ChatTextIcon size={30} />,
  },
  {
    value: AutomationContentTypesEnum.INSTAGRAM_POST,
    label: "Instagram Post",
    icon: <InstagramLogoIcon size={30} />,
  },
  {
    value: AutomationContentTypesEnum.PRODUCT,
    label: "Product",
    icon: <ShoppingBagIcon size={30} />,
  },
  {
    value: AutomationContentTypesEnum.BUTTON_TEMPLATE,
    label: "Button",
    icon: <RadioButtonIcon size={30} />,
  },
  {
    value: AutomationContentTypesEnum.QUESTION,
    label: "Question",
    icon: <ChatTextIcon size={30} />,
  },
  //BUG: Dont change my order!
  {
    value: "media",
    label: "Media",
    icon: <PaperclipIcon size={30} />,
  },
];
