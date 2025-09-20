import { FC } from "react";

type ChatsLayout = {
  children: React.ReactNode;
};

const ChatsLayout: FC<ChatsLayout> = ({ children }) => {
  return <div className="lg:w-2/3">{children}</div>;
};

export default ChatsLayout;
