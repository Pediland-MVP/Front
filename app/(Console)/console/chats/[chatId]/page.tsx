
import { ResizablePanel } from "@/components/ui/resizable";
import { Chat } from "../components/chat";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";



export default async function ChatPage({params: {chatId}}: {params: {chatId: string}}) {
    const layout = cookies().get("react-resizable-panels:layout");
    const defaultLayout = layout ? JSON.parse(layout.value) : [undefined];
    
    return (
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        <Chat
          leadId={chatId}
        />
      </ResizablePanel> 
    )

}