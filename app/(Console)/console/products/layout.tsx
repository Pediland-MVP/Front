"use client"
import { FC } from "react";
// import ContactListCard from "./components/contactListCard";

type ProductsLayoutProps = {
    children: React.ReactNode;
};

const ProductsLayout: FC<ProductsLayoutProps> = ({ children }) => {
    return (
        <>{children}</>
    )
};

export default ProductsLayout;
