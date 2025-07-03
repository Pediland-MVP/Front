import { useTranslations } from "next-intl";
import { Control, UseFormGetValues } from "react-hook-form";
import { contentCycleFormSchema } from "../contentCycle";
import { z } from "zod";
// Just UI Imports Below
import { FormField, FormMessage, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/theme/ui/textarea";
import HelpmeDialog from "@/components/global/helpme.dialog";
import { WizardVideoLinks } from "../../wizardVideoLinks.conf";

type TriggerProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
};

export default function Trigger({ control, getValues }: TriggerProps) {
  const t = useTranslations("Automations.Trigger");

  return (
    <>
      <div className="_trigger gap-4 flex items-center relative">
        <p className="text-sm font-medium">{t("userIn")}</p>
        <div className="flex gap-6 items-center">
          <FormField
            control={control}
            name="isDirect"
            render={({ field }) => (
              <div className="flex gap-2 items-center">
                <FormMessage />
                <Switch
                  dir="ltr"
                  id="direct"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FormLabel htmlFor="direct">{t("direct")}</FormLabel>
              </div>
            )}
          ></FormField>
          <FormField
            control={control}
            name="isComment"
            render={({ field }) => (
              <div className="flex gap-2 items-center">
                <Switch
                  type="button"
                  dir="ltr"
                  id="direct"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FormLabel htmlFor="direct">{t("comment")}</FormLabel>
              </div>
            )}
          ></FormField>
        </div>
          <HelpmeDialog noAbsolute title={t('Help.title')} description={t('Help.description')} videoSrc={WizardVideoLinks.Automations.Hints.Triggers.video} />
      </div>
    </>
  );
}
