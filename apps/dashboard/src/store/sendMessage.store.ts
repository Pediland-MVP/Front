import { create } from 'zustand'
import { devtools } from 'zustand/middleware'


export interface NewMessage {
    text:        string;
    leadId:      string;
    instagramId: string;
}

type UseSendMessageType = {
    setSendMessage: (messageSender: Function) => void
    sendMessage: (newMessage: NewMessage) => void
}
const useSendMessage = create()(
    devtools(
        (set) => ({
            setSendMessage: (messageSender: Function) => set((state: UseSendMessageType) => ({ ...state, messageSender })),
            sendMessage: (newMessage: NewMessage) => set((state: UseSendMessageType) => ({ ...state, newMessage })),
        })
    )
)