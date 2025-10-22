import { useTranslations } from "next-intl";
import Link from "next/link";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
} from "@components";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

export const ConnectInstagramAlert = () => {
  const t = useTranslations("ConnectInstagramAlert");

  return (
    <div className="space-y-2">
      <Alert variant={"destructive"}>
        <WarningCircleIcon />
        <AlertTitle>{t("title")}</AlertTitle>
        <AlertDescription>{t("description")}</AlertDescription>
      </Alert>
      <Button variant={"destructive"} asChild className="w-full md:w-auto">
        <Link href={"/settings/instagram"}>{t("connect")}</Link>
      </Button>
    </div>
  );
};
