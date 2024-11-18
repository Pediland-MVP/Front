import React from "react";
import ContentCycle from "@/app/(Console)/console/actions/content-cycle/components/contentCycle";
import InstaDirectUi from "@/components/global/instaDirectUi";

export default function page() {
  return (
    <div className="_automation">
      <div className="_header flex justify-between items-center mb-5 h-9">
        <h1 className="text-xl font-bold">جزئیات اتوماسیون</h1>

        <div className="_tools"></div>
      </div>
      <ContentCycle />
    </div>
  );
}
