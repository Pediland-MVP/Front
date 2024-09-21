"use client"
import { FC } from "react";

type ContactLayoutProps = {
    children: React.ReactNode;
};

const ContactLayout: FC<ContactLayoutProps> = ({ children }) => {
    return (
        <div className="flex gap-4">
            <div className="h-[calc(100vh-2rem)] w-1/5 bg-white shadow rounded-2xl px-2 py-3">
                <div className="_title font-semibold px-1 pb-2 border-b border-dashed">
                    <h1>ارتباطات</h1>
                </div>
            </div>

            <div className="flex-grow">
                {children}
            </div>
        </div>
    );
};

export default ContactLayout;
