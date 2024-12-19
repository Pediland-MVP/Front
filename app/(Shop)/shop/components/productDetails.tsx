import Image from "next/image";
import { getTranslations } from "next-intl/server";

async function getProductData() {
  // Simulating a product fetch
  return {
    name: "کتونی مشکلی آدیداس سایز 42",
    description: "این کفش بسیار باکیفیت و بادوام است. ارجینال نیست ولی از بهترین کپی‌های موجود در کشور دوست و همسایه چین است. با این قیمت جنس بهتری دستت نمیدن داداش من. بخر، ببر حالش و ببر به جون ما هم دعا کن.",
    quantity: 1,
    image: "/images/sample.webp",
    priceValue: "500،000 تومان",
  };
}

export default async function ProductDetails() {
  const t = await getTranslations("Products");
  const product = await getProductData();

  return (
    <div className="_product-details md:col-span-4">
      <div className="flex flex-col gap-4 md:flex-row items-start md:gap-6">
        <div className="relative w-full md:w-1/3 h-full aspect-square">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="rounded-xl object-cover"
            sizes="(max-width: 768px) 96px, (max-width: 1024px) 192px, 256px"
          />
        </div>

        <div className="md:w-2/3 flex items-center h-full">
          <div className="_wrapper flex flex-col gap-5">
            <h2 className="text-xl md:text-2xl font-semibold flex items-center">
              {product.name}
            </h2>
            <div className="text-gray-600">{product.description}</div>
            <div>{t("stock")}: {product.quantity}</div>
            <div className="text-lg"><span className="font-medium text-gray-400">{t("price")}:</span> <span className="font-bold text-green-700">{product.priceValue}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
