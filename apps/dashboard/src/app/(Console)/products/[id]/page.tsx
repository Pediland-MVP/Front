import { LayoutPage } from "@/components/Layout/LayoutPage";
import Product from "./product";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <LayoutPage>
      <Product id={id} />
    </LayoutPage>
  );
}
