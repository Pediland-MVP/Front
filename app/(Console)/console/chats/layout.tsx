import { cookies } from "next/headers";
import { FC } from "react";
import { ChatLayout } from "./components/chat.layout";


type ChatsLayout = {
    children: React.ReactNode
}

const ChatsLayout: FC<ChatsLayout> = ({children}) => {
    const layout = cookies().get("react-resizable-panels:layout");
    const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
    return (
        <>
            <ChatLayout defaultLayout={defaultLayout} navCollapsedSize={8} >
                {children}
            </ChatLayout>
        </>
    )

}

export default ChatsLayout