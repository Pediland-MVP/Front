import { FC } from "react";
import { CommentsLayout } from "./components/commentsLayout";
import { useTranslations } from "next-intl";

type ChatsLayout = {
  children: React.ReactNode;
};

const ChatsLayout: FC<ChatsLayout> = ({ children }) => {
  const t = useTranslations('Comments')
  return (
    <div className="_direct max-h-full overflow-hidden">
      <div className="_header flex justify-between items-center mb-5 h-9">
        <h1 className="text-xl font-bold">{t('title')}</h1>

        <div className="_tools"></div>
      </div>
      <CommentsLayout>{children}</CommentsLayout>
    </div>
  );
};

export default ChatsLayout;
