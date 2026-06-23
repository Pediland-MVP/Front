"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import {
  ConditionGroup,
  ConditionLeaf,
  isGroup,
  LabelFieldDef,
  ComparisonOperator,
} from "./types";

function defaultLeafFor(fields: LabelFieldDef[]): ConditionLeaf {
  const f = fields[0];
  return {
    field: f?.field ?? "sessions",
    operator: (f?.operators[0] ?? "gt") as ComparisonOperator,
    value: f?.valueType === "status" ? (f.statusOptions?.[0] ?? "") : 0,
  };
}

function LeafEditor({
  leaf,
  fields,
  onChange,
  onRemove,
}: {
  leaf: ConditionLeaf;
  fields: LabelFieldDef[];
  onChange: (l: ConditionLeaf) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("Labels");
  const def = fields.find((f) => f.field === leaf.field);
  const operators = def?.operators ?? ["gt", "gte", "lt", "lte", "eq", "neq"];

  const onFieldChange = (field: string) => {
    const nd = fields.find((f) => f.field === field);
    onChange({
      field,
      operator: (nd?.operators.includes(leaf.operator) ? leaf.operator : nd?.operators[0] ?? "eq") as ComparisonOperator,
      value: nd?.valueType === "status" ? (nd.statusOptions?.[0] ?? "") : 0,
      ...(nd?.windowable && leaf.windowDays != null ? { windowDays: leaf.windowDays } : {}),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={leaf.field} onValueChange={onFieldChange}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          {fields.map((f) => (
            <SelectItem key={f.field} value={f.field}>{t(`fieldNames.${f.field}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={leaf.operator} onValueChange={(op) => onChange({ ...leaf, operator: op as ComparisonOperator })}>
        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op} value={op}>{t(`operators.${op}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {def?.valueType === "status" ? (
        <Select value={String(leaf.value)} onValueChange={(v) => onChange({ ...leaf, value: v })}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(def.statusOptions ?? []).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type="number"
          className="w-28"
          value={Number(leaf.value)}
          onChange={(e) => onChange({ ...leaf, value: Number(e.target.value) })}
        />
      )}

      {def?.windowable && (
        <Input
          type="number"
          min={1}
          max={365}
          className="w-28"
          placeholder={t("windowDaysPlaceholder")}
          title={t("windowDaysLabel")}
          value={leaf.windowDays ?? ""}
          onChange={(e) =>
            onChange({
              ...leaf,
              windowDays: e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
        />
      )}

      <Button size="icon" variant="ghost" type="button" onClick={onRemove}>
        <TrashIcon size={16} />
      </Button>
    </div>
  );
}

function GroupEditor({
  group,
  fields,
  onChange,
  onRemove,
  depth,
}: {
  group: ConditionGroup;
  fields: LabelFieldDef[];
  onChange: (g: ConditionGroup) => void;
  onRemove?: () => void;
  depth: number;
}) {
  const t = useTranslations("Labels");

  const update = (i: number, node: ConditionGroup | ConditionLeaf) => {
    const next = group.conditions.slice();
    next[i] = node;
    onChange({ ...group, conditions: next });
  };
  const removeAt = (i: number) =>
    onChange({ ...group, conditions: group.conditions.filter((_, idx) => idx !== i) });

  return (
    <div className={`rounded-md border p-3 space-y-2 ${depth > 0 ? "bg-muted/40" : ""}`} dir="rtl">
      <div className="flex items-center gap-2">
        <Select value={group.op} onValueChange={(op) => onChange({ ...group, op: op as "and" | "or" })}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="and">{t("ruleAll")}</SelectItem>
            <SelectItem value="or">{t("ruleAny")}</SelectItem>
          </SelectContent>
        </Select>
        {onRemove && (
          <Button size="icon" variant="ghost" type="button" onClick={onRemove}>
            <TrashIcon size={16} />
          </Button>
        )}
      </div>

      <div className="space-y-2 pr-3">
        {group.conditions.map((node, i) =>
          isGroup(node) ? (
            <GroupEditor
              key={i}
              group={node}
              fields={fields}
              depth={depth + 1}
              onChange={(g) => update(i, g)}
              onRemove={() => removeAt(i)}
            />
          ) : (
            <LeafEditor
              key={i}
              leaf={node}
              fields={fields}
              onChange={(l) => update(i, l)}
              onRemove={() => removeAt(i)}
            />
          ),
        )}
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" type="button"
          onClick={() => onChange({ ...group, conditions: [...group.conditions, defaultLeafFor(fields)] })}>
          <PlusIcon size={16} className="ml-1" /> {t("addCondition")}
        </Button>
        <Button size="sm" variant="outline" type="button"
          onClick={() => onChange({ ...group, conditions: [...group.conditions, { op: "and", conditions: [] }] })}>
          <PlusIcon size={16} className="ml-1" /> {t("addGroup")}
        </Button>
      </div>
    </div>
  );
}

export function RuleBuilder({
  value,
  onChange,
  fields,
}: {
  value: ConditionGroup;
  onChange: (g: ConditionGroup) => void;
  fields: LabelFieldDef[];
}) {
  return <GroupEditor group={value} fields={fields} onChange={onChange} depth={0} />;
}
