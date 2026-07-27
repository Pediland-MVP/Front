'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { PlusIcon, Trash2Icon } from 'lucide-react';

import { usePermissions } from '@/hooks/usePermissions';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
} from '@/components/ui';

import type { ProductFormValues } from '../productForm.schema';

/** Mirrors the backend's `@ArrayMaxSize(50)` on `specs` so the UI refuses before the API does. */
const SPEC_LIMIT = 50;

/**
 * Static product facts shown to the buyer — "جنس رویه: مش تنفسی".
 *
 * Not to be confused with `CommerceProductField`, which is the buyer's *input* form on the
 * product page. These are ordered `{title, body}` pairs stored as jsonb on the product, because
 * they are only ever read whole with it — never filtered, searched or joined.
 */
export const SpecsSection = ({ mode }: { mode: 'create' | 'edit' }) => {
  const t = useTranslations('Commerce.Editor.Specs');
  const { can } = usePermissions();
  const canEdit = can(mode === 'create' ? 'product:create' : 'product:edit');
  const { control } = useFormContext<ProductFormValues>();

  const specs = useFieldArray({ control, name: 'specs', keyName: '_sid' });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {specs.fields.length === 0 && <p className="text-muted-foreground text-sm">{t('empty')}</p>}

        {specs.fields.map((row, index) => (
          <div key={row._sid} className="flex items-start gap-2">
            <FormField
              control={control}
              name={`specs.${index}.title`}
              render={({ field }) => (
                <FormItem className="w-44 space-y-0">
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!canEdit}
                      data-testid={`spec-title-${index}`}
                      placeholder={t('titlePlaceholder')}
                      className="h-9 font-semibold"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`specs.${index}.body`}
              render={({ field }) => (
                <FormItem className="flex-1 space-y-0">
                  <FormControl>
                    <Input
                      {...field}
                      disabled={!canEdit}
                      data-testid={`spec-body-${index}`}
                      placeholder={t('bodyPlaceholder')}
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('remove')}
                data-testid={`spec-remove-${index}`}
                onClick={() => specs.remove(index)}
                className="text-muted-foreground hover:text-destructive size-9"
              >
                <Trash2Icon className="size-4" />
              </Button>
            )}
          </div>
        ))}

        {canEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="spec-add"
            // Capped to match the backend's ArrayMaxSize(50): better a disabled button than a
            // 400 after the merchant has typed the 51st row.
            disabled={specs.fields.length >= SPEC_LIMIT}
            onClick={() => specs.append({ title: '', body: '' })}
            className="self-start"
          >
            <PlusIcon className="size-4" />
            {t('add')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
