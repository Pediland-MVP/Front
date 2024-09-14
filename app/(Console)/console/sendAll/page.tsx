import React from "react";
import Table1 from "./component/table";
import { ResizablePanel } from "@/registry/new-york/ui/resizable";
import { TabsContent } from "@/registry/new-york/ui/tabs";
import { Card } from "@/registry/new-york/ui/card";

export default function page() {
  return (
    // <ResizablePanel
    //   defaultSize={80}
    //   minSize={30}
    //   // className="px-4"
    // >
    <div className="w-full pr-6">
        <Card>
          <Table1 />
        </Card>
    </div>
    // </ResizablePanel>
  );
}
