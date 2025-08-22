// app/(Console)/automations/add/page.tsx

import { AutomationDetails, LayoutPage } from "@/components/index";

export default function page() {
  return (
    <LayoutPage col="half">
      <AutomationDetails />
    </LayoutPage>
  );
}
