import { FC } from "react";
import { CommentsLayout } from "./components/commentsLayout";

type ChatsLayout = {
  children: React.ReactNode;
};

const ChatsLayout: FC<ChatsLayout> = ({ children }) => {
  return (
    <div className="_direct max-h-full overflow-hidden">
      <div className="_header flex justify-between items-center mb-5 h-9">
        <h1 className="text-xl font-bold">لیست کامنت‌ها</h1>

        <div className="_tools"></div>
      </div>
      <CommentsLayout>{children}</CommentsLayout>
    </div>
  );
};

export default ChatsLayout;
