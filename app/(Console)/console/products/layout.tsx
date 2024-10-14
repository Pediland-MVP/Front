"use client"
import { FC } from "react";
import ProductListTable from "./components/productListTable";
// import ContactListCard from "./components/contactListCard";

type ProductsLayoutProps = {
    children: React.ReactNode;
};

const ProductsLayout: FC<ProductsLayoutProps> = ({ children }) => {
    return (
        <div className="flex gap-4">
            <div className="h-[calc(100vh-2rem)] w-full bg-white shadow rounded-2xl px-2 py-4">
                <div className="_title font-semibold h-8 border-b border-dashed mb-2 text-center">
                    <h1>محصولات</h1>
                </div>
                {/* <ContactListCard /> */}
                <ProductListTable/>
            </div>

            {/* <div className="flex-grow">
                {children}
            </div> */}
        </div>
    );
};

export default ProductsLayout;
