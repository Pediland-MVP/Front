"use client"
import { FC } from "react";
import ContactListCard from "./components/contactListCard";

type ContactLayoutProps = {
    children: React.ReactNode;
};

const ContactLayout: FC<ContactLayoutProps> = ({ children }) => {
    return (
        <div className="flex gap-4">
            <div className="h-[calc(100vh-2rem)] w-1/5 bg-white shadow rounded-2xl px-2 py-4">
                <div className="_title font-semibold h-8 border-b border-dashed mb-2 text-center">
                    <h1>ارتباطات</h1>
                </div>
                <ContactListCard />
            </div>

            <div className="flex-grow">
                {children}
            </div>
        </div>
    );
};

export default ContactLayout;
