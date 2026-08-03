'use client';

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { WorkspaceDrawerContent } from './WorkspaceDrawerContent';

interface WorkspaceDrawerProps {
  children: React.ReactNode;
}

export const WorkspaceDrawer = ({ children }: WorkspaceDrawerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent dir="rtl">
        <WorkspaceDrawerContent onClose={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  );
};
