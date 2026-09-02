import { LayoutCard } from '@/components/Layout/LayoutCard';
import { OrderDetailPage } from '@/components/Commerce/Orders/OrderDetailPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

// A server component, because in the App Router `params` is a promise and has to be awaited
// before anything reads it -- same convention as `products/[id]/page.tsx`.
export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <LayoutCard className="_products">
      <OrderDetailPage orderId={id} />
    </LayoutCard>
  );
}
