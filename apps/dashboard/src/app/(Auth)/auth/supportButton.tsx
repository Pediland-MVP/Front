import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

type SupportButtonPropsType = {
  type: 'internal' | 'external';
  className?: string;
};

const supportButtonTypesLinkMap = {
  internal: '/help/support',
  external: 'support',
};

export default function SupportButton({ className, type }: SupportButtonPropsType) {
  const t = useTranslations();
  return (
    <Link
      className={cn('mt-4 flex w-full items-center justify-center text-center', className)}
      href={`${supportButtonTypesLinkMap[type]}`}
    >
      <Button variant="link" className="text-xs">
        {t('support')}
      </Button>
    </Link>
  );
}
