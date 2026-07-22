'use client';

import { CommerceProductListItem } from '@/types/commerce';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { memo } from 'react';

import { Badge, Button, Card, CardContent, CardFooter } from '@/components/ui';
import {
  CircleXIcon,
  FileDigitIcon,
  PackageIcon,
  PencilIcon,
  TriangleAlertIcon,
} from 'lucide-react';

interface CommerceProductCardProps {
  product: CommerceProductListItem;
  handleDelete: (id: string) => void;
}

const CommerceProductCardComponent = ({ product, handleDelete }: CommerceProductCardProps) => {
  const router = useRouter();
  const t = useTranslations('Commerce.List');
  const isPhysical = product.kind === 'physical';
  const TypeIcon = isPhysical ? PackageIcon : FileDigitIcon;

  const hasPriceRange =
    typeof product.minPrice === 'number' && typeof product.maxPrice === 'number';
  const isSinglePrice = hasPriceRange && product.minPrice === product.maxPrice;

  return (
    <Card className="gap-0 overflow-hidden border-violet-200 p-0 shadow-violet-200">
      <CardContent className="p-0">
        <div className="relative aspect-[4/3] w-full bg-gray-100">
          {product.coverMediaUrl ? (
            <img
              src={product.coverMediaUrl}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <TypeIcon className="size-10 text-gray-300" />
            </div>
          )}

          {product.needsStockReview && (
            <Badge
              variant="outline"
              className="absolute top-2 right-2 flex items-center gap-1 border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600"
            >
              <TriangleAlertIcon className="size-3.5" />
              {t('Card.needsStockReview')}
            </Badge>
          )}
        </div>

        <div className="space-y-1.5 p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="text-secondary line-clamp-1 text-[15px] font-semibold">
              {product.title}
            </div>
            <Badge
              variant="outline"
              className="h-5 shrink-0 rounded-full border-gray-200/60 bg-gray-100 px-2 py-0 text-[11px] font-medium text-gray-500"
            >
              {isPhysical ? t('Card.physical') : t('Card.digital')}
            </Badge>
          </div>

          {hasPriceRange && (
            <div className="text-primary text-[14px] font-semibold">
              {isSinglePrice
                ? `${product.minPrice!.toLocaleString()} ${t('Card.tooman')}`
                : t('Card.priceFrom', { price: product.minPrice!.toLocaleString() })}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex rounded-b-xl bg-gray-100 p-0">
        <Button
          className="text-muted-foreground h-9 w-full flex-1 rounded-none rounded-br-xl hover:bg-green-100 hover:text-green-800"
          variant="ghost"
          type="button"
          size="sm"
          onClick={() => router.push(`/products/${product.id}`)}
        >
          <PencilIcon className="text-green-600" />
          {t('Card.edit')}
        </Button>

        <Button
          className="hover:text-destructive text-muted-foreground h-9 w-full flex-1 rounded-none rounded-bl-xl hover:bg-red-100"
          variant="ghost"
          type="button"
          size="sm"
          onClick={() => handleDelete(product.id)}
        >
          <CircleXIcon className="text-destructive" />
          {t('Card.delete')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export const CommerceProductCard = memo(CommerceProductCardComponent);
