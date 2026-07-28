'use client';

import { useTranslations } from 'next-intl';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';

/**
 * One pending destructive question. The copy is built by whoever asked — "۳ تنوع با این مقدار
 * حذف می‌شود…" only makes sense where the count is known — so this component carries no
 * message of its own beyond the cancel label.
 */
export interface EditorConfirm {
  title: string;
  body: string;
  /** Label of the destructive button, e.g. `حذف ۳ تنوع`. */
  ok: string;
  run: () => void;
}

/**
 * The editor's single confirm surface. The Attributes, Media and bulk-delete flows all dispatch
 * into it instead of each owning a dialog, so there is exactly one place where "are you sure"
 * is drawn and exactly one place where a destructive action is actually fired.
 */
export const ConfirmDialog = ({
  confirm,
  onClose,
}: {
  confirm: EditorConfirm | null;
  onClose: () => void;
}) => {
  const t = useTranslations('Commerce.Editor.Confirm');

  return (
    <Dialog
      open={confirm !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{confirm?.title ?? ''}</DialogTitle>
          <DialogDescription className="leading-relaxed">{confirm?.body ?? ''}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            data-testid="confirm-run"
            onClick={() => {
              // Close FIRST. `run` usually removes rows the caller is still rendering; closing
              // afterwards would set state on the way out of a tree that just changed shape.
              const pending = confirm;
              onClose();
              pending?.run();
            }}
          >
            {confirm?.ok ?? ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
