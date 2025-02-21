import { FC } from "react";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import CommentsList from "./components/commentsList";
import { CommentsProvider } from "./context/comments.context";

type ChatsLayout = {
  children: React.ReactNode;
};

const ChatsLayout: FC<ChatsLayout> = ({ children }) => {
  const t = useTranslations("Comments");
  return (
    <div className="_direct flex flex-col h-full max-h-full overflow-hidden">
      <div className="_chat-layout min-h-[calc(100vh-5.5rem)] w-full flex flex-col lg:flex-row overflow-auto">
        <CommentsProvider>
          <CommentsList />
          {children}
        </CommentsProvider>
      </div>
    </div>
  );
};

export default ChatsLayout;
