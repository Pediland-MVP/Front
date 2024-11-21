import { FC } from "react";
import { ChatLayout } from "./components/chat.layout";
import { useTranslations } from "next-intl";

type ChatsLayout = {
  children: React.ReactNode;
};

const ChatsLayout: FC<ChatsLayout> = ({ children }) => {
  const t = useTranslations('Inbox');
  return (
    <div className="_direct max-h-full overflow-hidden">
      <div className="_header flex justify-between items-center mb-5 h-9">
        <h1 className="text-xl font-bold">{t('directsList')}</h1>

        <div className="_tools"></div>
      </div>
      <ChatLayout>{children}</ChatLayout>
    </div>
  );
};

export default ChatsLayout;
