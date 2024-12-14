import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Package } from "@phosphor-icons/react/dist/ssr";

async function getProductData() {
  // Simulating a product fetch
  return {
    name: "Sample Product",
    description: "This is a sample product description.",
    quantity: 1,
    image: "/images/sample.webp",
  };
}

export default async function ProductDetails() {
  const t = await getTranslations("Product");
  const product = await getProductData();

  return (
    <div className="flex flex-col md:flex-row items-start md:space-x-6">
      <div className="relative w-24 h-24 md:w-48 md:h-48 lg:w-64 lg:h-64">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="rounded-md object-cover"
          sizes="(max-width: 768px) 96px, (max-width: 1024px) 192px, 256px"
        />
      </div>
      <div className="mt-4 md:mt-0">
        <h2 className="text-xl md:text-2xl font-semibold flex items-center">
          <Package className="mr-2" size={24} />
          {product.name}
        </h2>
        <p className="text-gray-600 mt-2">{product.description}</p>
        <p className="mt-2 md:mt-4">
          {t("quantity")}: {product.quantity}
        </p>
      </div>
    </div>
  );
}
