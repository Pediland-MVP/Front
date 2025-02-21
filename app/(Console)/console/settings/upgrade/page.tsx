import { Card } from "@/components/theme/ui/card";
import PlanSelection from "./components/planSelection";
import SubscriptionInfo from "./components/subscriptionInfo";
import { UpgradeProvider } from "./context/upgrade.context";

export default function Upgrade() {

    return (
        <div className="_upgrade-page flex h-full w-full">
            <UpgradeProvider>
                <Card className="w-full p-6">
                    <SubscriptionInfo />
                    <PlanSelection />
                </Card>
            </UpgradeProvider>
        </div>
    )
}