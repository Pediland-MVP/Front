import SidebarTrigger from "@/components/theme/ui/sidebar";
import React from "react";
import { BreadcrumbGenerator } from "./breadcrumbGenerator";
import { useHeaderTools } from "./context/headerToolsContext";


const Header = () => {
    const { tools } = useHeaderTools()

    return (
        <header className="bg-white px-4 py-3 flex xl:h-16 xl:flex-row xl:justify-between xl:items-center gap-4 border-b-2 border-gray-100">
            <div className="_wrap flex items-center gap-4">
                <SidebarTrigger />
                <BreadcrumbGenerator />
            </div>

            {tools && <div className="_tools">{tools}</div>}
        </header>
    );
};

export default Header;
