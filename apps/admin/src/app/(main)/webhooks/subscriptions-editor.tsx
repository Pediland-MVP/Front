"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  EventGroup,
  groupEventTypes,
  patternsToSelected,
  selectedToPatterns,
} from "./patterns";

interface SubscriptionsEditorProps {
  types: string[];
  value: string[];
  onChange: (patterns: string[]) => void;
}

export function SubscriptionsEditor({ types, value, onChange }: SubscriptionsEditorProps) {
  const t = useTranslations("Webhooks");
  const groups: EventGroup[] = useMemo(() => groupEventTypes(types), [types]);
  const selected = useMemo(() => patternsToSelected(value, types), [value, types]);

  const emit = (next: Set<string>) => onChange(selectedToPatterns(next, groups));

  const toggleLeaf = (type: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(type);
    else next.delete(type);
    emit(next);
  };

  const toggleGroup = (group: EventGroup, checked: boolean) => {
    const next = new Set(selected);
    for (const l of group.leaves) {
      if (checked) next.add(l.type);
      else next.delete(l.type);
    }
    emit(next);
  };

  const toggleAll = (checked: boolean) => {
    if (checked) emit(new Set(types));
    else emit(new Set());
  };

  const allChecked = types.length > 0 && selected.size === types.length;

  return (
    <div className="space-y-3 rounded-md border p-3" dir="rtl">
      <label className="flex items-center gap-2 font-medium">
        <Checkbox checked={allChecked} onCheckedChange={(c) => toggleAll(c === true)} />
        {t("allEvents")}
      </label>
      <div className="h-px bg-border" />
      <div className="space-y-3 max-h-72 overflow-y-auto">
        {groups.map((group) => {
          const groupChecked = group.leaves.every((l) => selected.has(l.type));
          const groupIndeterminate =
            !groupChecked && group.leaves.some((l) => selected.has(l.type));
          return (
            <div key={group.parent} className="space-y-1">
              <label className="flex items-center gap-2 font-medium">
                <Checkbox
                  checked={groupIndeterminate ? "indeterminate" : groupChecked}
                  onCheckedChange={(c) => toggleGroup(group, c === true)}
                />
                <span className="font-mono text-sm">{group.parent}.*</span>
              </label>
              <div className="ms-6 space-y-1">
                {group.leaves.map((leaf) => (
                  <label key={leaf.type} className="flex items-center gap-2">
                    <Checkbox
                      checked={selected.has(leaf.type)}
                      onCheckedChange={(c) => toggleLeaf(leaf.type, c === true)}
                    />
                    <span className="font-mono text-xs text-muted-foreground">{leaf.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {!types.length ? (
        <Label className="text-xs text-muted-foreground">{t("loadingTypes")}</Label>
      ) : null}
    </div>
  );
}
