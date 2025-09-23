import baseConfig from "@befroosh/tailwind-config";
import type { Config } from "tailwindcss";

const config: Config = {
  presets: [baseConfig],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "../../packages/**/*.{js,ts,jsx,tsx}",
  ],
};

export default config;
