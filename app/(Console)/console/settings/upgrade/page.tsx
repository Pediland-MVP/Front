import PlanSelection from "./components/planSelection";
import SubscriptionInfo from "./components/subscriptionInfo";
import { UpgradeProvider } from "./context/upgrade.context";

export default function Upgrade() {

    return (
        <UpgradeProvider>
            <div className="w-full min-h-full flex flex-col justify-center items-center">
                <SubscriptionInfo/>
                <PlanSelection/>
            </div>
        </UpgradeProvider>
    )

}