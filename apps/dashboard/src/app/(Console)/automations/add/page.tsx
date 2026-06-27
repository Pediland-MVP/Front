import { AutomationForm } from '@/components/Automations/AutomationForm';
import { LayoutPage } from '@/components/Layout/LayoutPage';

export default function page() {
  return (
    <LayoutPage col="half">
      <AutomationForm />
    </LayoutPage>
  );
}
