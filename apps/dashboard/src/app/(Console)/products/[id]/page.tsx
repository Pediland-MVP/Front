import { LayoutPage } from '@/components/Layout/LayoutPage';
import Product from './product';

interface PageProps {
  params: Promise<{ id: string }>;
}

// A server component, because in the App Router `params` is a promise and has to be awaited
// before anything reads it.
export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <LayoutPage>
      <Product id={id} />
    </LayoutPage>
  );
}
