"use client";

import { cn } from "@/lib/utils";
import { ProductNamespace } from "@/types/product";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { memo } from "react";

import { Button, Card, CardContent, CardFooter, CardImage } from "@components";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { CircleXIcon, PencilIcon } from "lucide-react";

interface ProductCardComponentProps {
  product: ProductNamespace.Product;
  handleDelete: (id: string) => void;
}

const ProductCardComponent = ({
  product,
  handleDelete,
}: ProductCardComponentProps) => {
  const router = useRouter();
  const t = useTranslations("Products.Card");

  return (
    <Card className="gap-0 border-violet-200 p-0 shadow-violet-200">
      <CardContent className="flex-1 p-2">
        <div className="flex gap-2">
          <div className="relative h-20 w-20">
            <CardImage
              src={product.images?.[0]?.url || "/images/placeholder.webp"}
              alt={product.title}
            />
          </div>
          <div className="flex flex-1 flex-col space-y-1.5 p-1">
            <div className="text-secondary text-sm font-semibold">
              {product.title}
            </div>
            <div className="flex flex-1 items-center justify-center gap-2">
              <div className="text-secondary space-y-1.5 text-[13px]">
                <div className="flex items-center gap-1">
                  <div>
                    {product.status ? (
                      <CheckCircleIcon size={16} className="text-green-600" />
                    ) : (
                      <CheckCircleIcon size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    {product.isDigital ? t("digital") : t("physical")}
                  </div>
                </div>
                <div className="font-medium">
                  {product.quantity === 0 ? (
                    t("unlimited")
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-[15px]">{product.quantity}</span>
                      <span>{t("number")}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-1 items-center justify-end gap-2">
                <div className="flex flex-col items-end justify-center">
                  <span
                    className={cn(
                      "",
                      typeof product?.discountPrice === "number"
                        ? "text-muted-foreground text-sm line-through"
                        : "text-primary font-semibold",
                    )}
                  >
                    {product?.price.toLocaleString()}
                  </span>
                  {typeof product.discountPrice === "number" && (
                    <span className="text-primary font-semibold">
                      {product.discountPrice?.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="text-[13px] text-gray-400">{t("tooman")}</div>
              </div>
            </div>
          </div>
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
          {t("edit")}
        </Button>

        <Button
          className="hover:text-destructive text-muted-foreground h-9 w-full flex-1 rounded-none rounded-bl-xl hover:bg-red-100"
          variant="ghost"
          type="button"
          size="sm"
          onClick={() => handleDelete(product.id)}
        >
          <CircleXIcon className="text-destructive" />
          {t("delete")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export const ProductCard = memo(ProductCardComponent);
