import { styles } from "@/registry/styles";
import React from "react";
import Header from "./layout/header";
import HeroSection from "./(layout)/components/heroSection";
import ExplainApp from "./(layout)/components/explainApp";
import ExplainApp2 from "./(layout)/components/explainApp2";
import ExplainApp3 from "./(layout)/components/explainApp3";
import ExplainUser from "./(layout)/components/explainUser";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ExplainUser/>
      <ExplainApp/>
      <ExplainApp2/>
      <ExplainApp3/>

    </>
  );
}
