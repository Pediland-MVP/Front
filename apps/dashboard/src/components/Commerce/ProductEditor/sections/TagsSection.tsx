'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import useSWRImmutable from 'swr/immutable';
import { XIcon } from 'lucide-react';

import { usePermissions } from '@/hooks/usePermissions';
import type { PaginatedResult } from '@/types/commerce';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  Input,
} from '@/components/ui';

import type { ProductFormValues } from '../productForm.schema';

/**
 * The workspace's tag pool, used only for suggestions. Read-only by design: tags are created as
 * a side effect of saving the product (the payload carries NAMES, and the backend
 * resolves-or-creates each against the pool), so there is no create-tag call to make here.
 */
const TAG_POOL_KEY = '/commerce/tags';

/** How many unused pool tags to offer at once — the pool itself is unbounded. */
const SUGGESTION_LIMIT = 8;

const normalise = (value: string) => value.trim();

export const TagsSection = ({ mode }: { mode: 'create' | 'edit' }) => {
  const t = useTranslations('Commerce.Editor.Tags');
  const { can } = usePermissions();
  const canEdit = can(mode === 'create' ? 'product:create' : 'product:edit');
  const { control } = useFormContext<ProductFormValues>();
  const [draft, setDraft] = useState('');

  const { data } = useSWRImmutable<PaginatedResult<string[]>>(TAG_POOL_KEY);
  const pool = data?.items ?? [];

  return (
    <FormField
      control={control}
      name="tags"
      render={({ field }) => {
        const tags = field.value;

        // Case-insensitive so "Running" cannot be added next to "running" — the backend
        // de-duplicates the same way, and letting the UI disagree would show a tag that
        // silently vanishes on save.
        const has = (name: string) =>
          tags.some((existing) => existing.toLowerCase() === name.toLowerCase());

        const add = (raw: string) => {
          const name = normalise(raw);
          if (!name || has(name)) {
            setDraft('');
            return;
          }
          field.onChange([...tags, name]);
          setDraft('');
        };

        const suggestions = pool.filter((name) => !has(name)).slice(0, SUGGESTION_LIMIT);

        return (
          <Card>
            <CardHeader>
              <CardTitle>{t('title')}</CardTitle>
              <p className="text-muted-foreground text-sm">{t('description')}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((name) => (
                    <Badge key={name} variant="secondary" className="gap-1 ps-2 pe-1">
                      {name}
                      {canEdit && (
                        <button
                          type="button"
                          aria-label={t('remove', { name })}
                          data-testid={`tag-remove-${name}`}
                          onClick={() => field.onChange(tags.filter((item) => item !== name))}
                          className="hover:text-destructive"
                        >
                          <XIcon className="size-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}

              {canEdit && (
                <div className="flex gap-2">
                  <Input
                    value={draft}
                    data-testid="tag-input"
                    placeholder={t('placeholder')}
                    onChange={(e) => setDraft(e.target.value)}
                    // Enter adds without submitting the whole product form.
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      e.preventDefault();
                      add(draft);
                    }}
                    className="h-9 max-w-64"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => add(draft)}>
                    {t('add')}
                  </Button>
                </div>
              )}

              {canEdit && suggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground text-xs">{t('suggestions')}</span>
                  {suggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      data-testid={`tag-suggestion-${name}`}
                      onClick={() => add(name)}
                    >
                      <Badge variant="outline">{name}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      }}
    />
  );
};
