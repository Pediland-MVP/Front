import {
  ConditionGroup,
  ConditionLeaf,
  isGroup,
  LabelFieldDef,
  LabelRule,
  LABEL_TARGET_TYPES,
  LabelTargetType,
} from './types';

// Every field name referenced anywhere in the rule tree (deduped, order-stable).
export function collectFields(rule: LabelRule): string[] {
  const out = new Set<string>();
  const walk = (node: ConditionGroup | ConditionLeaf) => {
    if (isGroup(node)) node.conditions.forEach(walk);
    else out.add(node.field);
  };
  walk(rule);
  return [...out];
}

// Targets allowed by the current field set = intersection of each used field's
// supported targets. With no fields chosen yet, all three targets are allowed.
// A field missing from the catalog imposes no constraint (defensive).
export function targetsForFields(
  usedFields: string[],
  catalog: LabelFieldDef[],
): LabelTargetType[] {
  const byField = new Map(catalog.map((f) => [f.field, f.targets]));
  return LABEL_TARGET_TYPES.filter((target) =>
    usedFields.every((field) => (byField.get(field) ?? LABEL_TARGET_TYPES).includes(target)),
  );
}

// The auto-untick step: keep only selected targets the field set still supports,
// preserving canonical order.
export function reconcileTargets(
  selected: LabelTargetType[],
  usedFields: string[],
  catalog: LabelFieldDef[],
): LabelTargetType[] {
  const allowed = new Set(targetsForFields(usedFields, catalog));
  return LABEL_TARGET_TYPES.filter((t) => selected.includes(t) && allowed.has(t));
}
