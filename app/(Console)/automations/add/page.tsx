import ContentCycle from "@/app/(Console)/automations/components/contentCycle";
import { useTranslations } from "next-intl";
// Just UI Imports Below

export default function page() {
  const t = useTranslations("Automations");

  return (
    <div className="_add-automation">
      <div className="min-h-[calc(100vh-5.5rem)] w-full xl:w-1/2 2xl:w-1/3">
        <ContentCycle />
      </div>
    </div>
  );
}
