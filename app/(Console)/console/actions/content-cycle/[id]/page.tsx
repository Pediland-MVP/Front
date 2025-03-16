import { isUUID } from "class-validator";
import { redirect } from "next/navigation";
import ContentCycle from "../components/contentCycle";
// Just UI Imports Below
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
    redirect("/console/actions/content-cycle");
  }
  const t = await getTranslations("Automations");

  return (
    <div className="_add-automation">
      <div className="min-h-[calc(100vh-5.5rem)]">
        <ContentCycle id={id} />
      </div>
    </div>
  );
}
