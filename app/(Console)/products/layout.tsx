"use client";
import { FC } from "react";

type ProductsLayoutProps = {
  children: React.ReactNode;
};

const ProductsLayout: FC<ProductsLayoutProps> = ({ children }) => {
  return <>{children}</>;
};

export default ProductsLayout;
