import { VideoComp } from "@/components/Global/VideoComp";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { WizardVideoLinks } from "./wizardVideoLinks.conf";

export function ContnetCycleTableWizard() {
  const t = useTranslations("Automations.TableWizard");

  return (
    <div className="flex w-full flex-col items-center justify-start">
      <div className="flex w-full max-w-[320px] flex-col items-center justify-center">
        <div className="mb-5 flex flex-col">
          <h2 className="text-primary mt-10 text-lg font-semibold">
            {t("title")}
          </h2>
          <p>{t("description")}</p>
        </div>
        <VideoComp
          controls
          loop
          playsInline
          className="mb-4"
          variant="bordered"
          poster={WizardVideoLinks.Automations.table.poster}
          src={WizardVideoLinks.Automations.table.video}
          shape="vertical"
        />
        <Link href={"/automations/add"}>
          <Button variant={"iconed"} className="w-[260px]">
            <Plus />
            {t("Cta.title")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
