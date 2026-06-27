'use client';

import useUser from '@/hooks/useUser';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { toast } from 'sonner';
import useSWRImmutable from 'swr/immutable';
import ProductForm from '@/components/Products/ProductForm';
import ProductFormSkeleton from '../components/product.form.skeleton';
import { useSearchParams } from 'next/navigation';

export default function Product({ id }: { id: string }) {
  const t = useTranslations('Products');
  const { isAuthenticated } = useUser();

  const searchParams = useSearchParams();
  const type = searchParams.get('t') as 'p' | 'v';

  const url = !isAuthenticated ? null : type === 'p' ? `/products/${id}` : `/vitrin/${id}`;

  const { data, error, mutate } = useSWRImmutable(url, {
    refreshInterval: 30_000,
    revalidateOnMount: true,
  });

  useEffect(() => {
    if (error) toast.error(t('notFound'));
  }, [error]);

  if (!data) {
    return <ProductFormSkeleton />;
  }

  return (
    <div className="_edit-product overflow-auto">
      <ProductForm shouldBeEdit={data} type={type} />
    </div>
  );
}
