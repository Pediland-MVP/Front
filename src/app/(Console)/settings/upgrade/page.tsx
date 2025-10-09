import PlanSelection from "./components/planSelection";
import SubscriptionInfo from "./components/subscriptionInfo";
import { UpgradeProvider } from "./context/upgrade.context";

export default function Upgrade() {
  return (
    <UpgradeProvider>
      <SubscriptionInfo />
      <PlanSelection />
    </UpgradeProvider>
  );
}
