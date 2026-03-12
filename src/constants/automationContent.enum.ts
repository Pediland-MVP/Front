export enum AutomationContentTypesEnum {
  AUDIO = "audio",
  BUTTON_TEMPLATE = "button_template",
  IMAGE = "image",
  INSTAGRAM_POST = "instagram_post",
  PRODUCT = "product",
  TEXT = "text",
  VIDEO = "video",
  QUESTION = 'question',
  VITRIN="vitrin"
}

export type AutomationContentFileType = AutomationContentTypesEnum.AUDIO | AutomationContentTypesEnum.IMAGE | AutomationContentTypesEnum.VIDEO

export enum AutomationContentModeEnum {
  AUTOMATION = "automation",
  REMINDER = "reminder",
}
