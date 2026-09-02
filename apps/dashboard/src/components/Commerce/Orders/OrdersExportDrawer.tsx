'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@/components/ui';
import api from '@/hooks/swr/api-client';
import type { OrdersFilters } from '@/types/commerceOrders';

interface OrdersExportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The list screen's CURRENT filters (`OrdersListPage.filtersFromParams`) -- the seller exports
   * exactly what they are looking at, not a separately-configured range.
   */
  filters: OrdersFilters;
}

// Deliberately simple: `CommerceOrdersExportDto.email` is `@IsEmail()`, and the backend is the
// real gate. This only needs to catch an obviously-wrong value before a network round trip.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * `POST /commerce/orders/excelExport` (`CommerceOrdersExportDto`) has NO `page`/`limit` fields --
 * unlike `OrdersFilters`/`ReadOrdersDto`, the export is the full filtered result set, not one
 * page of it. Only `status`/`search`/`from`/`to` (plus the delivery `email`) travel here; `page`
 * and `limit` from `filters` are intentionally dropped.
 *
 * The controller's docstring says the worker builds the spreadsheet and EMAILS it to the given
 * address -- there is no stored file and no signed URL to hand back, so this drawer never renders
 * a download link or implies a file will appear in the browser. Success just means the request
 * was queued.
 */
export function OrdersExportDrawer({ open, onOpenChange, filters }: OrdersExportDrawerProps) {
  const t = useTranslations('Commerce.Orders.export');
  const tDialogs = useTranslations('Commerce.Orders.dialogs');
  const t_ec = useTranslations('ERROR_CODES');

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setEmail('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError(t('emailInvalid'));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post('/commerce/orders/excelExport', {
        email: trimmed,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.from && { from: filters.from }),
        ...(filters.to && { to: filters.to }),
      });
      toast.success(t('queued'));
      handleOpenChange(false);
    } catch (err: any) {
      // Mirrors `OrderDetailPage`'s error-toast convention: `code` is only guaranteed on a
      // request that reached the API and came back structured -- a network error has no `code`,
      // and `t_ec` returns the truthy literal key path for a missing key, so branching on `code`
      // first is required for the server-message fallback to ever be reached.
      const code = err?.response?.data?.code;
      toast.error(code ? t_ec(code) : err?.response?.data?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="orders-export-email" className="text-secondary text-xs font-medium">
            {t('emailLabel')}
          </label>
          <Input
            id="orders-export-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError(null);
            }}
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" disabled={isSubmitting} onClick={() => void handleSubmit()}>
            {t('submit')}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
          >
            {tDialogs('cancelAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
