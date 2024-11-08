"use client";
import { FC } from "react";

type ContactLayoutProps = {
  children: React.ReactNode;
};

const ContactLayout: FC<ContactLayoutProps> = ({ children }) => {
  return <>{children}</>;
};

export default ContactLayout;
