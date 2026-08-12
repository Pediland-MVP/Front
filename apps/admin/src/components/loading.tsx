// src/components/loading.tsx

import { SpinnerGapIcon } from '@phosphor-icons/react/dist/ssr/SpinnerGap';

export const Loading = () => {
  return (
    <div className="flex flex-1 items-center justify-center">
      <SpinnerGapIcon className="text-secondary animate-spin" size={28} />
    </div>
  );
};
