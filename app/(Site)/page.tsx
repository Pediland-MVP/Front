import React from "react";
import { Metadata } from "next";
import { useTranslations } from "next-intl";
import HeroSection from "./components/heroSection";
import SecOne from "./components/secOne";
import Features from "./components/features";
import SecTwo from "./components/secTwo";

export const metadata: Metadata = {
  title: "Befroosh: Manage & Automate your instagram",
  description: "This is first version of Befroosh application.",
};

export default function Home() {
  const t = useTranslations("General");

  return (
    <main className="mt-20">
      <HeroSection />

      <SecOne />

      <Features />

      <SecTwo />
    </main>
  );
}
