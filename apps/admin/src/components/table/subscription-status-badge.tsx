// src/components/table/subscription-status-badge.tsx

import { Badge } from "@/components/ui/badge";
import { 
  subscriptionStatusLabels, 
  subscriptionStatusToColor 
} from "@/constants/subscription-status";
import { SubscriptionStatusEnum } from "@/types/subscription";

export const SubscriptionStatusBadge = ({ status }: { status: SubscriptionStatusEnum }) => {
  return (
    <Badge variant={"table"} color={subscriptionStatusToColor[status]}>
      {subscriptionStatusLabels[status]}
    </Badge>
  );
};