"use client";

import { DirectionProvider } from "@radix-ui/react-direction";

export function RadixDirectionProvider({
  dir,
  children,
}: {
  dir: "ltr" | "rtl";
  children: React.ReactNode;
}) {
  return <DirectionProvider dir={dir}>{children}</DirectionProvider>;
}
