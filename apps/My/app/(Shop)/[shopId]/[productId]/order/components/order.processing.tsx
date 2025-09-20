import { useTranslations } from "next-intl"
import Image from "next/image";


export default function OrderProcessing() {
    const t = useTranslations('Checkout');
    return (
        <div className="_checkout h-svh flex flex-col justify-center items-center bg-white border rounded-xl p-5 md:p-10">
          <Image
            src={"/images/emojies/smiling-face-with-hearts.webp"}
            height={200}
            width={200}
            alt={"قلب"}
          />
          <p className="text-lg text-center">
            {t("orderProcessingDescription")}
          </p>
        </div>
    )

}