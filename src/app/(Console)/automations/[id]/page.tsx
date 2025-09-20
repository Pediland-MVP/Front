// src/app/(Console)/automations/[id]/page.tsx

import { AutomationForm, LayoutPage } from "@/components";
import { isUUID } from "class-validator";
import { redirect } from "next/navigation";

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
