'use client';

import { useHeaderFeatures } from '@/lib/stores/useHeaderFeaturesStore';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import useSWRImmutable from 'swr/immutable';

import { LayoutCard } from '@/components/Layout/LayoutCard';
import { ProducstCardList } from '@/components/Products/ProducstCardList';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui-custom/SearchInput';
import { SearchToggleButton } from '@/components/ui-custom/SearchToggleButton';
import { CircleFadingPlusIcon } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

export default function Page() {
  const router = useRouter();
  const t = useTranslations('Products');
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [effectiveSearch, setEffectiveSearch] = useState<string>('');

  const setTools = useHeaderFeatures((s) => s.setTools);
  const clearTools = useHeaderFeatures((s) => s.clearTools);
  const setButtons = useHeaderFeatures((s) => s.setButtons);
  const clearButtons = useHeaderFeatures((s) => s.clearButtons);
  const error = useHeaderFeatures((s) => s.error);

  const { data: cardToCardData } = useSWRImmutable(`/payments/cardToCard`, {
    revalidateOnMount: true,
  });

  const { can } = usePermissions();
  const allowAdd = !!cardToCardData && can('product:create');

  const HeaderButton = useMemo(() => {
    return (
      <>
        <SearchToggleButton
          isSearchVisible={isSearchVisible}
          setIsSearchVisible={setIsSearchVisible}
        />

        {can('product:create') && (
          <Button
            type="button"
            size="md"
            disabled={error || !cardToCardData}
            onClick={() => router.push('/products/add?t=p')}
          >
            {t('add')}
            <CircleFadingPlusIcon />
          </Button>
        )}
      </>
    );
  }, [isSearchVisible, setIsSearchVisible, error, router, cardToCardData, can]);

  const HeaderTools = useMemo(
    () => (
      <SearchInput
        value={search}
        onChange={setSearch}
        onEffectiveSearchChange={setEffectiveSearch}
        visible={isSearchVisible}
        disabled={error}
      />
    ),
    [search, isSearchVisible, setSearch, error, setEffectiveSearch],
  );

  useEffect(() => {
    setButtons(HeaderButton);
    setTools(HeaderTools);
  }, [HeaderButton, HeaderTools, setButtons, setTools]);

  useEffect(() => {
    return () => {
      clearButtons();
      clearTools();
    };
  }, [clearButtons, clearTools]);

  return (
    <LayoutCard className="_products">
      <ProducstCardList search={effectiveSearch} allowAdd={allowAdd} />
    </LayoutCard>
  );
}
