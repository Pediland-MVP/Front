// Pure helpers for the subscriptions editor. Mirror the backend matcher
// (apps/admin/src/analyticsWebhooks/event-taxonomy.ts): a pattern is an exact
// type, a parent prefix `parent.*`, or global `*`.

export interface EventLeaf {
  /** Full event type, e.g. "subscription.purchased.active". */
  type: string;
  /** Label shown under the group, e.g. "purchased.active". */
  label: string;
}

export interface EventGroup {
  /** First dot-segment, e.g. "subscription". */
  parent: string;
  leaves: EventLeaf[];
}

/** Group the flat catalog by first dot-segment, preserving first-seen order. */
export function groupEventTypes(types: string[]): EventGroup[] {
  const order: string[] = [];
  const map = new Map<string, EventLeaf[]>();
  for (const type of types) {
    const dot = type.indexOf(".");
    const parent = dot === -1 ? type : type.slice(0, dot);
    const label = dot === -1 ? type : type.slice(dot + 1);
    if (!map.has(parent)) {
      map.set(parent, []);
      order.push(parent);
    }
    map.get(parent)!.push({ type, label });
  }
  return order.map((parent) => ({ parent, leaves: map.get(parent)! }));
}

/**
 * Selected full leaf types -> minimal patterns. All selected -> ["*"]; a group
 * with >1 leaf all selected -> "parent.*"; otherwise the individual leaf types.
 */
export function selectedToPatterns(selected: Set<string>, groups: EventGroup[]): string[] {
  const totalLeaves = groups.reduce((n, g) => n + g.leaves.length, 0);
  if (totalLeaves > 0 && selected.size === totalLeaves) return ["*"];
  const patterns: string[] = [];
  for (const g of groups) {
    const allSelected = g.leaves.every((l) => selected.has(l.type));
    if (allSelected && g.leaves.length > 1) {
      patterns.push(`${g.parent}.*`);
    } else {
      for (const l of g.leaves) if (selected.has(l.type)) patterns.push(l.type);
    }
  }
  return patterns;
}

/** Existing patterns -> selected leaf set (for editing). Expands *, parent.*, exact. */
export function patternsToSelected(patterns: string[], types: string[]): Set<string> {
  const selected = new Set<string>();
  for (const p of patterns) {
    if (p === "*") {
      types.forEach((t) => selected.add(t));
      continue;
    }
    if (p.endsWith(".*")) {
      const prefix = p.slice(0, -2);
      types.forEach((t) => {
        if (t === prefix || t.startsWith(prefix + ".")) selected.add(t);
      });
      continue;
    }
    if (types.includes(p)) selected.add(p);
  }
  return selected;
}
