// src/components/lead/DeleteItem.tsx

import { TrashIcon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import api from '@/hooks/swr/api-client';
import { toast } from 'sonner';
import DialogDelete from '../dialog-delete';
import { useState } from 'react';

type DeleteItemProps = {
  id: string;
  mutate?: () => void;
};

export default function DeleteItem({ id, mutate }: DeleteItemProps) {
  const [openDialog, setOpenDialog] = useState(false);

  const handleDeleteLead = async () => {
    try {
      await api.delete(`/marketingLeads/${id}`);
      setOpenDialog(false);
      mutate?.();
      toast.success('سرنخ با موفقیت حذف شد.');
    } catch (error) {
      console.error(error);
      toast.error('خطا در حذف سرنخ.');
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="link"
        color="destructive"
        className="hover:text-red-500"
        icon
        onClick={() => setOpenDialog(true)}
      >
        <TrashIcon />
      </Button>

      <DialogDelete open={openDialog} onOpenChange={setOpenDialog} onConfirm={handleDeleteLead} />
    </>
  );
}
