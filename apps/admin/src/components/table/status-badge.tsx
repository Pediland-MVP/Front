import { statusLabels, statusToColor } from "@/constants/user-status";
import { cn } from "@/lib/utils";

export const StatusBadge = ({ status }: { status: string }) => {
  return (
    <div
      className={cn("rounded-full px-2 py-1 text-xs font-medium")}
      style={{ backgroundColor: statusToColor[status] }}
    >
      {statusLabels[status]}
    </div>
  );
};
