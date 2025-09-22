import Link from "next/link";
import { Button } from "@befroosh/ui";
import { useTranslations } from "next-intl";

export function SiteHeader(): JSX.Element {
  const t = useTranslations("SiteHeader");

  return (
    <header className="py-5">
      <div className="container max-w-5xl px-5">
        <div className="flex items-center justify-between">
          <div className="_logo">
            <Link href="/" className="text-gradient text-2xl font-extrabold">
              {t("logo")}
            </Link>
          </div>
          <Button asChild size={"sm"}>
            <Link href="https://console.befroosh.app/auth/signup">
              {t("button")}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
