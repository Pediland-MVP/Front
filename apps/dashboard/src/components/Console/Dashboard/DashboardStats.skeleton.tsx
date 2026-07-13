import { ItemsStatisticCardSkeleton } from './ItemsStatisticCard.skeleton';

const MAX_STAT_CARDS = 6;

export const DashboardStatsSkeleton = () => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
        {Array.from({ length: MAX_STAT_CARDS }).map((_, i) => (
          <ItemsStatisticCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};
