export namespace SessionNamespace {
  export type Sessions = _Sessions;
  export type SessionAnswers = _SessionAnswers;
}

export interface _Sessions {
  items: Item[];
  meta: Meta;
}

export interface Item {
  passedFlows: Flow[];
  id: number;
  createDate: Date;
  updateDate: Date;
  isEnabled: boolean;
  isCompleted: boolean;
  step: number;
  questionStep: number;
  flow: Flow | null;
  lastMid: null | string;
  leadInstagram: LeadInstagram;
}

export enum Flow {
  GetUserData = "getUserData",
  Question = "question",
}

export interface LeadInstagram {
  id: string;
  name: Name;
  username: Username;
}

export enum Name {
  SinaPirani = "Sina Pirani",
}

export enum Username {
  Sinapiranix = "sinapiranix",
}

export interface Meta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface Answer {
  id: string;
  text: string;
  question: {
    id: string;
    text: string;
  };
}

interface _SessionAnswers {
  passedFlows: any[];
  id: number;
  answers: Answer[];
}
