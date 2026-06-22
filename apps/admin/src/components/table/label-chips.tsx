"use client";

import { AssignedLabel } from "@/types/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// How many label chips render inline before collapsing the rest into a "+N"
// overflow chip. Keeps the table cell on a single line so row height and
// horizontal layout stay stable regardless of how many labels a user holds.
const MAX_VISIBLE = 3;

export function LabelChips({ labels }: { labels?: AssignedLabel[] }) {
  if (!labels || labels.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  const visible = labels.slice(0, MAX_VISIBLE);
  const overflow = labels.slice(MAX_VISIBLE);

  return (
    <div className="flex max-w-[240px] flex-nowrap items-center gap-1 overflow-hidden">
      {visible.map((ul) => (
        <Badge
          key={ul.labelId}
          title={ul.label.name}
          className="min-w-0 max-w-[96px] shrink-0"
          style={
            ul.label.color
              ? { backgroundColor: ul.label.color, color: "#fff" }
              : undefined
          }
        >
          <span className="truncate">{ul.label.name}</span>
        </Badge>
      ))}

      {overflow.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="shrink-0 cursor-default tabular-nums"
            >
              +{overflow.length}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1">
              {overflow.map((ul) => (
                <span key={ul.labelId} className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: ul.label.color || "#888" }}
                  />
                  {ul.label.name}
                </span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
