
import { SessionPage } from "./sessionPage";

export default async function SessionsPageWrapper(props: {
  searchParams: Promise<{ contentCycleId?: string }>;
}) {
  return (
    <SessionPage
      contentCycleId={(await props.searchParams).contentCycleId || undefined}
    />
  );
}
