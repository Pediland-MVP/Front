// app/(Console)/automations/add/page.tsx

import { AutomationForm, LayoutPage } from "@/components";

export default function page() {
  return (
    <LayoutPage col="half">
      <AutomationForm />
    </LayoutPage>
  );
}
