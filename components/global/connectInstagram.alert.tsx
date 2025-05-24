// components/InstagramAlert.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { Button } from "@/components/theme/ui/button";
import Link from "next/link";

export function ConnectInstagramAlert() {
  const t = useTranslations("ConnectInstagramAlert");

  return (
    <Alert variant={"destructive"} className="w-full mx-auto mb-5">
      <WarningCircle />
      <AlertTitle>{t("title")}</AlertTitle>
      <AlertDescription>{t("description")}</AlertDescription>
      <Link href={"/settings/instagram"}>
        <Button variant={"destructive"} size={"sm"} className="mt-3">
          {t("connect")}
        </Button>
      </Link>
    </Alert>
  );
}
