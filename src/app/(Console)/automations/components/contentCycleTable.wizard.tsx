import { Video } from "@/components/global/video";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Plus } from '@phosphor-icons/react/dist/ssr'
import Link from "next/link";
import { WizardVideoLinks } from "../wizardVideoLinks.conf";

export function ContnetCycleTableWizard() {

    const t= useTranslations("Automations.TableWizard");

    return (
        <div className="w-full flex flex-col justify-start items-center">
            <div className="w-full max-w-[320px] flex flex-col justify-center items-center" >
                <div className="flex flex-col  mb-5">
                    <h2 className="font-semibold text-lg mt-10 text-primary">{t('title')}</h2>
                    <p>{t('description')}</p>
                </div>
                <Video controls loop playsInline className="mb-4" variant="bordered" poster={WizardVideoLinks.Automations.table.poster} src={WizardVideoLinks.Automations.table.video} shape="vertical" />
                <Link href={'/automations/add'}>
                    <Button variant={'iconed'} className="w-[260px]">
                        <Plus/>
                        {t('Cta.title')}
                    </Button>
                </Link>
            </div>

        </div>
    )

}