import { isUUID } from "class-validator";
import { redirect } from "next/navigation";

import { AutomationForm, LayoutPage } from "@components";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  if (!isUUID(id, "4")) {
    redirect("/automations");
  }

  return (
    <LayoutPage col="half">
      <AutomationForm id={id} />
    </LayoutPage>
  );
}
