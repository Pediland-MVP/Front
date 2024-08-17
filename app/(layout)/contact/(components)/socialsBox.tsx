import React from "react";
import {
  InstagramLogo,
  TelegramLogo,
  Envelope,
  WhatsappLogo,
} from "phosphor-react"; // Import specific icons

type Feature = {
  title: string; // Social media or contact method name
  icon: React.ReactNode; // The icon component
  url: string; // URL for the link
};

type FeatureBoxProps = {
  features: Feature[];
};

export default function FeatureBox({ features }: FeatureBoxProps) {
  return (
    <div className="max-w-[80rem] mx-auto md:px-8 px-4 xl:px-0 md:mt-[6rem] mt-16 ">
      <h2 className="md:py-10 py-6  text-xl font-semibold">با ما در ارتباط باشید</h2>
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <a
            key={index}
            href={feature.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-100 p-12 rounded-2xl text-center block"
          >
            <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center">
              {feature.icon} {/* Render the icon */}
            </div>
            <h3 className="text-xl font-bold text-blueKommo">
              {feature.title}
            </h3>
          </a>
        ))}
      </div>
    </div>
  );
}
