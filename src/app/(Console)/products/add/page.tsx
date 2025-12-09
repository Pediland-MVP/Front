import { LayoutPage } from "@/components/Layout/LayoutPage";
import ProductForm from "../components/product.form";

export default function Page() {
  return (
    <LayoutPage className="_add-product p-0!">
      <ProductForm />
    </LayoutPage>
  );
}
