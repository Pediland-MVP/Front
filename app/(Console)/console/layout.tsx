"use client";

import * as React from "react";
import { Nav } from "@/app/(Console)/console/components/nav";
import { navLinks } from "@/app/(Console)/console/navlink";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="_wrap flex w-full h-full">
      <Nav links={navLinks} />
      <main className="w-full px-12 py-4">{children}</main>
    </div>
  );
};

export default Layout;
