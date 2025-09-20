// components/InstagramAlert.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const ConnectInstagramAlert = () => {
  const t = useTranslations("ConnectInstagramAlert");

  return (
    <Alert variant={"destructive"} className="mx-auto mb-5 w-full">
      <WarningCircleIcon />
      <AlertTitle className="text-white">{t("title")}</AlertTitle>
      <AlertDescription>{t("description")}</AlertDescription>
      <Link href={"/settings/instagram"}>
        <Button variant={"destructive"} size={"sm"} className="mt-3 text-white">
          {t("connect")}
        </Button>
      </Link>
    </Alert>
  );
};
