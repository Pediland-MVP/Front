import { FC } from "react";
import { ChatLayout } from "./components/chat.layout";


type ChatsLayout = {
    children: React.ReactNode
}

const ChatsLayout: FC<ChatsLayout> = ({children}) => {
    return (
        <div className="flex">
            <ChatLayout >
                {children}
            </ChatLayout>
        </div>
    )

}

export default ChatsLayout