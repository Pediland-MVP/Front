import React from "react";
import ContentCycle from "./components/contentCycle";
import InstaDirectUi from "./components/instaDirectUi";

export default function page() {
  return (
    <div className=" relative h-full flex">
      <div className="w-[77.3%] h-screen min-h-screen pl-2">
        <ContentCycle />
      </div>
      <div className="fixed w-[21%] left-4 bottom-4 top-4">
        <InstaDirectUi />
      </div>
    </div>
  );
}
