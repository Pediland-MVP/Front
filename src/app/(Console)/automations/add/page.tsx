// app/(Console)/automations/add/page.tsx

import ContentCycle from "@/app/(Console)/automations/components/contentCycle";
import { useTranslations } from "next-intl";

// Just UI Imports Below
export default function page() {
  const t = useTranslations("Automations");

  return (
    <div className="_add-automation-page h-full overflow-auto">
      <ContentCycle />
    </div>
  );
}
