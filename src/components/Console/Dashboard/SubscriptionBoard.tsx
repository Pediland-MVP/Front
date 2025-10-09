import { Button, CardSimple, ProgressRadial } from "@components";
import { ChevronLeftIcon } from "lucide-react";

export const SubscriptionBoard = () => {
  return (
    <CardSimple>
      <div className="flex items-center gap-4">
        <ProgressRadial percentage={51} size={70} strokeWidth={9} />
        <div className="text-secondary flex flex-1 flex-col justify-center">
          <div className="text-muted-foreground text-[13px]">
            باقی مانده اشتراک شما
          </div>
          <div className="text-gradient text-xl font-bold">12 روز</div>
        </div>
        <div>
          <Button variant="link" size="sm" className="gap-0 !px-0 text-xs">
            مشاهده
            <ChevronLeftIcon />
          </Button>
        </div>
      </div>
    </CardSimple>
  );
};
