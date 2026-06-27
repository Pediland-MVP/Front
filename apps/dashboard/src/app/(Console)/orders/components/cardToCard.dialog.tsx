import ImageWithFallback from '@/components/ui/imageWithCallback';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type CardToCardDialog = {
  url: string;
};
export default function CardToCardDialog({ url }: CardToCardDialog) {
  const t = useTranslations('Orders.List');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  return (
    <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="relative h-16 w-16 p-0">
          <ImageWithFallback
            fill
            src={url}
            alt={t('cardToCardImage')}
            fallbackSrc="/images/no-image.png"
            className="rounded-md"
          />
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[90vh] max-h-[90vh] max-w-3xl">
        <ImageWithFallback
          src={url}
          fallbackSrc="/images/no-image.png"
          alt={t('cardToCardImage')}
          fill
          className="h-auto w-full object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
