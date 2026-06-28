export type ComparisonOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
export type ScheduleType = 'interval' | 'daily';

export const LABEL_TARGET_TYPES = ['user', 'workspace', 'instagram'] as const;
export type LabelTargetType = (typeof LABEL_TARGET_TYPES)[number];

export type PeriodSpec = { type: 'trailingDays'; days: number };

export interface ConditionLeaf {
  field: string;
  operator: ComparisonOperator;
  value: number | string;
  windowDays?: number;
  growth?: { period: PeriodSpec };
}
export interface ConditionGroup {
  op: 'and' | 'or';
  conditions: Array<ConditionGroup | ConditionLeaf>;
}
export type LabelRule = ConditionGroup;

export function isGroup(node: ConditionGroup | ConditionLeaf): node is ConditionGroup {
  return (
    (node as ConditionGroup).op !== undefined && Array.isArray((node as ConditionGroup).conditions)
  );
}

export function emptyGroup(): ConditionGroup {
  return { op: 'and', conditions: [] };
}

// One entry from GET /labels/fields
export interface LabelFieldDef {
  field: string;
  valueType: 'number' | 'status';
  operators: ComparisonOperator[];
  statusOptions?: string[];
  windowable?: boolean;
  targets: LabelTargetType[];
}

export interface LabelListItem {
  id: string;
  name: string;
  color?: string | null;
  description?: string | null;
  scheduleType: ScheduleType;
  intervalMinutes?: number | null;
  dailyAtHour?: number | null;
  isActive: boolean;
  lastRunAt?: string | null;
  lastMatchedCount?: number | null;
  lastMatchedCounts?: Partial<Record<LabelTargetType, number>> | null;
  targetTypes: LabelTargetType[];
  nextRunAt: string;
}

export interface Label extends LabelListItem {
  rule: LabelRule;
}

export interface CreateLabelPayload {
  name: string;
  color?: string;
  description?: string;
  rule: LabelRule;
  targetTypes: LabelTargetType[];
  scheduleType: ScheduleType;
  intervalMinutes?: number;
  dailyAtHour?: number;
  isActive?: boolean;
}
