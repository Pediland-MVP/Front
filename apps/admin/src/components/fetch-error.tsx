// src/components/fetch-error.tsx

import { CloudSlashIcon } from "@phosphor-icons/react/dist/ssr";

export const FetchError = () => {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="flex flex-col items-center gap-3 text-red-600">
        <CloudSlashIcon size={28} weight="duotone" /> اختلال در ارتباط با سرور
        ...
      </p>
    </div>
  );
};
