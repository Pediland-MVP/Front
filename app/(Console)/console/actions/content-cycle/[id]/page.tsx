import { log } from "console";
import { isUUID } from "class-validator";
import { redirect } from "next/navigation";
import ContentCycle from "../../components/contentCycle";
import InstaDirectUi from "@/components/global/instaDirectUi";

type ContentCycleEditPageProps = {
  params: {
    id: string;
  };
};
export default function ContentCycleEditPage({
  params: { id },
}: ContentCycleEditPageProps) {
  if (!isUUID(id, "4")) {
    redirect("/console/actions/content-cycle");
  }

  return (
    <div className="h-full flex gap-4">
      <div className="w-2/3 overflow-y-scroll h-[calc(100vh-2rem)] bg-white shadow rounded-2xl p-4">
        <ContentCycle id={id} />
      </div>
      <div className="w-1/3 h-[calc(100vh-2rem)] bg-white shadow rounded-2xl p-4">
        <InstaDirectUi/>
      </div>
    </div>
  );
}
