import { FC } from "react";

type ChatsLayout = {
  children: React.ReactNode;
};

const ChatsLayout: FC<ChatsLayout> = ({ children }) => {
  return <div className="w-full bg-">{children}</div>;
};

export default ChatsLayout;
