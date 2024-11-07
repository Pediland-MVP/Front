import { FC } from "react";
import { CommentsLayout } from "./components/commentsLayout";


type ChatsLayout = {
    children: React.ReactNode
}

const ChatsLayout: FC<ChatsLayout> = ({children}) => {
    return (
        <div className="flex">
            <CommentsLayout >
                {children}
            </CommentsLayout>
        </div>
    )

}

export default ChatsLayout