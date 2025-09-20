// app/(Console)/automations/add/page.tsx

import { AutomationForm, LayoutPage } from "@befroosh/ui";

export default function page() {
  return (
    <LayoutPage col="half">
      <AutomationForm />
    </LayoutPage>
  );
}
