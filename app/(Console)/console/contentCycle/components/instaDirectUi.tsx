"use client";
import React, { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/new-york/ui/avatar";
import { Button } from "@/registry/new-york/ui/button";
import { ScrollArea } from "@/registry/new-york/ui/scroll-area";
import { Textarea } from "@/registry/new-york/ui/textarea";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";

export default function InstaDirectUi() {
  const [messages] = useState([
    { id: 1, sender: "Ali", message: "Hey, how are you?" },
    { id: 2, sender: "You", message: "I'm good, thanks! What about you?" },
    { id: 3, sender: "Ali", message: "Doing well, just working on something." },
  ]);

  return (
    <div className=" w-full h-full flex bg-white rounded-2xl shadow-md px-4 py-4">
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
          {/* <Button variant="outline">Info</Button> */}
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 mb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "You" ? "justify-end gap-4 py-2" : "justify-start"
              }`}
            >
              <div
                className={`py-2 px-4 rounded-lg max-w-[70%] ${
                  msg.sender === "You"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))}
        </ScrollArea>

        {/* Message input area */}
        <div className="flex items-center gap-4 rounded-[3rem]">
          <Textarea
            placeholder="Type a message"
            className="flex-1 border rounded-full"
          />
          {/* <Button className="w-[100px]" variant="outline">
            Send
          </Button> */}
        </div>
      </div>
    </div>
  );
}
