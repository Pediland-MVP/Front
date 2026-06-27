'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
} from '@/components/ui';
import { ArrowsLeftRight } from '@phosphor-icons/react';
import { useWorkspaces } from '@/hooks/useWorkspaces';

interface WorkspaceSwitcherDialogProps {
  trigger?: React.ReactNode;
}

export function WorkspaceSwitcherDialog({ trigger }: WorkspaceSwitcherDialogProps) {
  const t = useTranslations('Console');
  const { workspaces, isLoading, changeWorkspace } = useWorkspaces();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary hover:text-primary h-8 w-8 shrink-0 bg-transparent"
          >
            <ArrowsLeftRight size={20} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('switchWorkspace')}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-2">
          {isLoading ? (
            <div className="text-secondary py-4 text-center text-sm">{t('loading')}</div>
          ) : workspaces.length === 0 ? (
            <div className="text-secondary py-4 text-center text-sm">{t('noData')}</div>
          ) : (
            workspaces.map((ws) => (
              <Button
                key={ws.id}
                variant="outline"
                className="w-full justify-start text-right"
                onClick={() => {
                  changeWorkspace(ws.id);
                  setOpen(false);
                }}
              >
                {ws.name}
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
