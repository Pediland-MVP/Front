"use client";
import { mails } from "@/app/(Console)/console/data";
import { Input } from "@/registry/new-york/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
} from "@/registry/new-york/ui/resizable";
import { Separator } from "@/registry/new-york/ui/separator";
import { MailList } from "@/app/(Console)/console/components/mail-list";
import { MagnifyingGlass } from '@phosphor-icons/react'
import ChatsList from "./components/chats";

export default function MailPage() {
  return (
    <>
      <ResizablePanel defaultSize={80} minSize={30}>
        <div className="flex items-center px-4 py-2">
          <h1 className="text-xl font-bold">پیام‌ها</h1>
        </div>
        <Separator />
        <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <form>
            <div className="relative">
              <MagnifyingGlass className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="جستجو" className="pl-8" />
            </div>
          </form>
        </div>
        {/* <MailList items={mails} /> */}
        <ChatsList/>
      </ResizablePanel>
      <ResizableHandle withHandle />
    </>
  );
}
