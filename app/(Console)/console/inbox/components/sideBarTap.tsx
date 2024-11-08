import {Tabs , TabsContent, TabsList, TabsTrigger } from "@/registry/new-york/ui/TabOverRide";
import { useTabStore } from "@/store/tabActiveStore";

export function SideBarTab() {
  const { activeTab, setActiveTab } = useTabStore();

  return (
    <Tabs className="w-full " defaultValue="chat ">
      <TabsList className="flex w-full ">
        <TabsTrigger
          value="comment"
          onClick={() => setActiveTab("comment")}
          className={`w-full text-center ${activeTab === "comment" ? "bg-none" : "bg-none"}`}
        >
          کامنت ها
        </TabsTrigger>
        <TabsTrigger
          value="direct"
          onClick={() => setActiveTab("direct")}
          className={`w-full bg-none text-center ${activeTab === "direct" ? "" : ""}`}
        >
          دایرکت ها
        </TabsTrigger>
        <TabsTrigger
          value="chat"
          onClick={() => setActiveTab("chat")}
          className={`w-full text-center ${activeTab === "chat" ? "bg-" : ""}`}
        >
          پیام ها
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
