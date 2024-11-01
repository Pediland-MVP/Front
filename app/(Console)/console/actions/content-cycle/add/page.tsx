import React from "react";
import ContentCycle from "@/app/(Console)/console/actions/content-cycle/components/contentCycle";
import InstaDirectUi from "@/components/global/instaDirectUi";

export default function page() {
  return (
    <div className="h-full flex gap-4">
      <div className="w-2/3 overflow-y-scroll h-[calc(100vh-2rem)] bg-white shadow rounded-2xl p-4">
        <ContentCycle />
      </div>
      <div className="w-1/3 h-[calc(100vh-2rem)] bg-white shadow rounded-2xl p-4">
        <InstaDirectUi />
      </div>
    </div>
  );
}
