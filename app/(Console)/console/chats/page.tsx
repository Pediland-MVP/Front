import { ChatLayout } from "./components/chat.layout";
import { cookies } from "next/headers";

export default function MailPage() {
  const layout = cookies().get("react-resizable-panels:layout");
  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;

  return <ChatLayout defaultLayout={defaultLayout} navCollapsedSize={8} />;
}
