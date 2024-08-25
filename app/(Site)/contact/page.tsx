import React from "react";
import FeatureBox from "./(components)/socialsBox";
import {
  ChatCircle,
  EnvelopeSimple,
  InstagramLogo,
  TelegramLogo,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { PhoneIncoming } from "@phosphor-icons/react";
import { Wheat } from "lucide-react";
import InlineBox from "./(components)/inlineBox";

export default function page() {
  return (
    <div>
      <FeatureBox
        features={[
          {
            title: "اینستاگرام",
            icon: <InstagramLogo size={48} weight="bold" />,
            url: "", // Replace with your Instagram URL
          },
          {
            title: "تلگرام",
            icon: <TelegramLogo size={48} weight="bold" />,
            url: "", // Replace with your Telegram URL
          },
          {
            title: "ایمیل",
            icon: <EnvelopeSimple size={48} weight="bold" />,
            url: "", // Replace with your email address
          },
          {
            title: "واتساپ",
            icon: <WhatsappLogo size={48} weight="bold" />,
            url: "",
          },
        ]}
      />

      <InlineBox
        data={[
          {
            title: "ادرس ما",
            text: "رشت، وشهرداری، وپارک علم و فناوری",
            button: false,
          },
          { title: "شماره تماس", text: "09123456789", button: false },
          { title: " پشتیبانی ", text: "پشتیبانی 24 ساعته", button: true },
        ]}
      />
    </div>
  );
}
