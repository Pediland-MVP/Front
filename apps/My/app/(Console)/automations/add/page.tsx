// app/(Console)/automations/add/page.tsx

import { AutomationForm, LayoutPage } from "@/components/index";

export default function page() {
  return (
    <LayoutPage col="half">
      <AutomationForm />
    </LayoutPage>
  );
}
