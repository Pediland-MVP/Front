// src/app/leads/dialog-new.tsx

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import LeadForm from './form-lead';
import { PlusCircleIcon } from '@phosphor-icons/react/dist/ssr/PlusCircle';
import { MarketingLead } from '@/types/lead';

export default function DialogFormLead({
  open,
  onOpenChange,
  data,
  mutate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: MarketingLead;
  mutate?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            <PlusCircleIcon weight="duotone" />
            {data ? 'ویرایش سرنخ' : ' ایجاد سرنخ جدید'}
          </DialogTitle>
          <DialogDescription></DialogDescription>

          <LeadForm data={data} onOpenChange={onOpenChange} mutateLeads={mutate} />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
