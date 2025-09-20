import { useState } from "react";
import { mutate } from "swr";

export interface NewMessage {
  text: string;
  leadId: string;
  instagramId: string;
}


const useSendMessage = () => {
  const [isMessageSendLoading, setIsMessageSendLoading] = useState(false);

  const sendMessage = async (newMessage: NewMessage) => {
    setIsMessageSendLoading(true);
    return await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/message/sendMessage`,
      {
        method: "POST",
        body: JSON.stringify(newMessage),
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        }
      }
    )
      .then(async (res) => {
        mutate(`${process.env.NEXT_PUBLIC_BACK_API_URL}/message/conversations/${newMessage.leadId}?limit=20&page=1`)
        return await res.json();
      })
      .catch((e) => {
        return e;
      })
      .finally(() => {
        setIsMessageSendLoading(false);
      });
  };

  return {
    sendMessage,
    isMessageSendLoading,
  };

};

export default useSendMessage;
