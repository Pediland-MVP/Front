import { FC } from 'react';

type CommentsLayout = {
  children: React.ReactNode;
};

const CommentsLayout: FC<CommentsLayout> = ({ children }) => {
  return <div className="lg:w-2/3">{children}</div>;
};

export default CommentsLayout;
