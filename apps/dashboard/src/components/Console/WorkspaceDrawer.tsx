'use client';

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { WorkspaceDrawerContent } from './WorkspaceDrawerContent';

interface WorkspaceDrawerProps {
  children: React.ReactNode;
}

export const WorkspaceDrawer = ({ children }: WorkspaceDrawerProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent dir="rtl">
          <WorkspaceDrawerContent onClose={() => setOpen(false)} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent dir="rtl" className="max-w-2xl gap-0 p-0">
        <WorkspaceDrawerContent onClose={() => setOpen(false)} isDialog />
      </DialogContent>
    </Dialog>
  );
};
