'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useHeaderFeatures } from '@/lib/stores/useHeaderFeaturesStore';
import { usePermissions } from '@/hooks/usePermissions';

import { Button } from '@/components/ui';
import { LayoutPage } from '@/components/Layout/LayoutPage';
import { CategoryTree } from '@/components/Commerce/Taxonomy/CategoryTree';
import { CollectionsList } from '@/components/Commerce/Taxonomy/CollectionsList';

export default function Page() {
  const t = useTranslations('Commerce.Taxonomy');
  const { can } = usePermissions();
  // Both dialogs' create submit is gated on `product:edit` (verified against the real
  // backend controllers — see `CategoryDialog.tsx`/`CollectionDialog.tsx`), so the header
  // buttons that open them are hidden the same way `ProductListPage.tsx` hides its own
  // "new product" button without `product:create`.
  const canEdit = can('product:edit');

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);

  const setButtons = useHeaderFeatures((s) => s.setButtons);
  const clearButtons = useHeaderFeatures((s) => s.clearButtons);

  // Both panes' primary "new" actions live in the header, same convention
  // `ProductListPage.tsx` uses for its own single "new product" button.
  const HeaderButtons = useMemo(
    () =>
      canEdit ? (
        <>
          <Button type="button" variant="outline" onClick={() => setIsCollectionDialogOpen(true)}>
            {t('newCollection')}
          </Button>
          <Button type="button" onClick={() => setIsCategoryDialogOpen(true)}>
            {t('newCategory')}
          </Button>
        </>
      ) : null,
    [t, canEdit],
  );

  useEffect(() => {
    setButtons(HeaderButtons);
  }, [HeaderButtons, setButtons]);

  useEffect(() => {
    return () => clearButtons();
  }, [clearButtons]);

  return (
    <LayoutPage>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategoryTree
          isCreateDialogOpen={isCategoryDialogOpen}
          onCreateDialogOpenChange={setIsCategoryDialogOpen}
        />
        <CollectionsList
          isCreateDialogOpen={isCollectionDialogOpen}
          onCreateDialogOpenChange={setIsCollectionDialogOpen}
        />
      </div>
    </LayoutPage>
  );
}
