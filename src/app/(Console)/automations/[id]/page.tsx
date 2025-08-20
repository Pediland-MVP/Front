// app/(Console)/automations/[id]/page.tsx

import { isUUID } from "class-validator";
import { redirect } from "next/navigation";
import ContentCycle from "../components/contentCycle";
import { getTranslations } from "next-intl/server";

type ContentCycleEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};
export default async function ContentCycleEditPage({
  params,
}: ContentCycleEditPageProps) {
  const { id } = await params;

  if (!isUUID(id, "4")) {
    redirect("/automations");
  }
  const t = await getTranslations("Automations");

  return (
    <div className="_update-automation-page h-full overflow-auto">
      <ContentCycle id={id} />
    </div>
  );
}
