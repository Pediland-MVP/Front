"use client";
import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/new-york/ui/avatar";
import { Textarea } from "@/registry/new-york/ui/textarea";
import {
  Camera,
  CaretLeft,
  Phone,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import {
  useContentStore,
  useCurrentTextAreaValue,
} from "@/src/store/contentCycleStore";
import { Button } from "@/registry/default/ui/button";

export default function InstaDirectUi() {
  const { adminContentCycle } = useContentStore();
  const { currentTextAreaValue, setCurrentTextAreaValue } =
    useCurrentTextAreaValue();
  // console.log(adminContentCycle);

  return (
    <div className="w-full h-full flex">
      {/* Main chat area */}
      <div className="flex flex-col w-full">
        {/* Chat header */}
        <div className="flex flex-row-reverse items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-xl">Ali</p>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <CaretLeft size={28} color="#242324" />
          </div>
          <div className="flex gap-4">
            <VideoCamera size={28} color="#1a191a" />
            <Phone size={28} color="#1a191a" />
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-grow flex flex-col justify-end mb-4">
          {adminContentCycle.length > 0 &&
            adminContentCycle?.map(
              (value, index) =>
                value && ( // Only render if the value is truthy
                  <div
                    key={index}
                    className="flex flex-col justify-end items-end gap-4 py-2"
                  >
                    <div className="py-3 px-6 rounded-[2rem] max-w-[70%] bg-gray-200 break-words">
                      {value}
                    </div> <div className="flex justify-end gap-2">
                      <Button variant="secondary" className="rounded-2xl">دکمه</Button>
                    </div>
                  </div>
                )
            )}


        </div>

        {/* Message input area */}
        <div className="relative flex items-center gap-4 rounded-[3rem]">
          <Textarea
            value={currentTextAreaValue}
            placeholder="message ..."
            className="flex-1 border pl-[3rem] rounded-full"
            dir="ltr"
          />
          <div className="absolute left-2 bg-blue-500 rounded-full p-1">
            <Camera size={26} color="#232223" />
          </div>
        </div>
      </div>
    </div>
  );
}
