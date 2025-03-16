import SidebarTrigger from "@/components/theme/ui/sidebar";
import React from "react";
import { BreadcrumbGenerator } from "./breadcrumbGenerator";
import { useHeaderFeatures } from "./context/headerFeaturesContext";
import { Separator } from "@/components/ui/separator";

const Header = () => {
  const { buttons, tools } = useHeaderFeatures();

  return (
    <header className="bg-white px-4 py-3 flex flex-col xl:h-16 xl:flex-row xl:justify-between xl:items-center gap-0 xl:gap-4 border-b-2 border-gray-100">
      <div className="_wrap flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 xl:gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <BreadcrumbGenerator />
        </div>
        {buttons && <div className="_buttons">{buttons}</div>}
      </div>

      {tools && <div className="_tools">{tools}</div>}
    </header>
  );
};

export default Header;
