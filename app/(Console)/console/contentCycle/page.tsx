import React from "react";
import ContentCycle from "./components/contentCycle";
import InstaDirectUi from "./components/instaDirectUi";

export default function page() {
  return (
    <div className="h-full flex gap-4">
      <div className="w-4/5 h-screen min-h-screen pl-2">
        <ContentCycle />
      </div>
      <div className="fixed left-4 bottom-4 top-4">
        <InstaDirectUi />
      </div>
    </div>
  );
}
