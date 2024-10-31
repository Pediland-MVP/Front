// types/nodeTypes.ts

import { Node } from "reactflow";

export type TriggerType = 'onComment' | 'onDirect';
export type ActionType = 'question' | 'answer';
export type QuestionType = 'number' | 'phoneNumber' | 'email' | 'text';

export interface TriggerData {
  type: TriggerType;
  condition: string;
}

export interface ActionData {
  type: ActionType;
  questionType?: QuestionType;
  errorMessage?: string;
  answer?: string;
}

export type ActionNode = Node<ActionData>
