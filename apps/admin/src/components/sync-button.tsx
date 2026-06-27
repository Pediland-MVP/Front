// src/components/sync-button.tsx
'use client';

import { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const handleClick = () => {
    startTransition(async () => {
      const res = await fetch('/api/sync', { method: 'POST' });

      if (res.ok) {
        toast.success('Synced successfully!');
        setLastSync(new Date());
      } else {
        toast.error('Sync failed.');
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? 'در حال بروزرسانی...' : 'بروزرسانی'}
      </Button>
      {lastSync && (
        <p className="text-muted-foreground text-sm">
          آخرین بروزرسانی در {lastSync.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
