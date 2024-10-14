import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import ProductSkeleton from "./product.skeleton";

const UpdateProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  quantity: z.number().min(0, "Quantity must be a positive number"),
  price: z.string().min(1, "Price is required"),
  description: z.string().min(1, "Description is required"),
  imageId: z.string().min(1, "Image ID is required"),
});

type UpdateProductFormData = z.infer<typeof UpdateProductSchema>;

export type ProductFormProps = {
  productId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ProductForm: React.FC<ProductFormProps> = ({ productId, open, setOpen }) => {
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [product, setProduct] = useState<UpdateProductFormData | null>(null);
  const [productError, setProductError] = useState<Error | null>(null);
  const [isProductLoading, setIsProductLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateProductFormData>({
    resolver: zodResolver(UpdateProductSchema),
  });

  const fetchProduct = async () => {
    setIsProductLoading(true);
    setProduct(null);
    setProductError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/products/${productId}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }

      const data = await response.json();
      setProduct(data);
    } catch (error) {
      setProductError(error as Error);
    } finally {
      setIsProductLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    return () => {
      setProduct(null);
      reset();
    };
  }, []);

  useEffect(() => {
    if (!product || !open || isProductLoading) return;
    reset(product);
  }, [product, open, isProductLoading]);

  const onSubmit = async (values: UpdateProductFormData) => {
    setIsSubmitLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/products/${productId}`,
        {
          method: "PUT",
          body: JSON.stringify(values),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      toast({
        title: "Product updated successfully",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error updating product",
        description: (error as Error).message,
      });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  if (isProductLoading || !product) {
    return <ProductSkeleton />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          {...register("quantity", { valueAsNumber: true })}
        />
        {errors.quantity && (
          <p className="text-sm text-red-500">{errors.quantity.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="price">Price</Label>
        <Input id="price" {...register("price")} />
        {errors.price && (
          <p className="text-sm text-red-500">{errors.price.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="imageId">Image ID</Label>
        <Input id="imageId" {...register("imageId")} />
        {errors.imageId && (
          <p className="text-sm text-red-500">{errors.imageId.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Save Changes
        {isSubmitLoading && <LoadingSpinner className="ml-2" size={20} />}
      </Button>
    </form>
  );
};

export default ProductForm;