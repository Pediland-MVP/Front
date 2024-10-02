import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/registry/new-york/ui/dialog";
import { Button } from '@/registry/new-york/ui/button';
import { Label } from '@/registry/new-york/ui/label';

export default function ModalPost() {
  return (
    <div> <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here. Click save when
        you&apos;re done.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter>
      {/* <Button type="submit">Save changes</Button> */}
    </DialogFooter>
  </DialogContent>
</div>
  )
}
