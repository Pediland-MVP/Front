'use client'
import { toast } from "@/components/ui/use-toast";
import { fetcher } from "@/hooks/swr/fetcher";
import { InstagramNamespace } from "@/types/instagram";
import Image from "next/image";
import { FC, useEffect } from "react";
import useSWR from "swr";


const ChatsList: FC = () => {

    const {data: chats, isLoading: isChatsLoading, error: chatsError} = useSWR<InstagramNamespace.GET['Conversations']>(`${process.env.NEXT_PUBLIC_BACK_API_URL}/message/conversations?page=1&limit=100&messageLimit=1`, fetcher)


    useEffect(() => {
        
        if (!chatsError) return;

        toast({
            title: 'خطایی رخ داده است',
            variant: 'destructive'
        })
        
    }, [chatsError])

    return (
        <div className="w-full flex justify-center items-center  p-4">
            {
                Array.isArray(chats?.items) && chats.items?.map((chat, index) => {
                    return (
                        <div key={chat.id} className="w-full p-4 rounded-md select-none cursor-pointer hover:bg-gray-100/50 duration-100 flex justify-start items-center gap-x-2">
                            <Image src={chat.profilePic} alt={chat.firstname} width={70} height={70} className="rounded-full" />
                            <div>
                                <div>{chat.firstname} {chat.lastname && chat.lastname}</div>
                                <div className='truncate text-gray-500 w-[40ch]'>{chat.messages.text}</div>
                            </div>
                        </div>
                    )
                })
            }

        </div>
    )

}

export default ChatsList