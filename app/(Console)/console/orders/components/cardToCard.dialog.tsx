import ImageWithFallback from "@/components/ui/imageWithCallback";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useState } from "react";

type CardToCardDialog = {
  url: string
}
export default function CardToCardDialog({ url }: CardToCardDialog) {
  const t = useTranslations('Orders.List')
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    return (
        <Dialog
        open={isImageModalOpen}
        onOpenChange={setIsImageModalOpen}
      >
        <DialogTrigger asChild>
          <Button variant="ghost" className="w-full p-0 h-auto">
            <ImageWithFallback
              src={url}
              alt={t("cardToCardImage")}
              fallbackSrc='/images/no-image.png'
              width={70}
              height={70}
              className=" rounded-md"
            />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <ImageWithFallback
            src={url}
            fallbackSrc='/images/no-image.png'
            alt={t("cardToCardImage")}
            width={1200}
            height={800}
            className="w-full h-auto object-contain"
          />
        </DialogContent>
      </Dialog>
    )

}