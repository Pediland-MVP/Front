import { Button } from "@/components/ui";
import { LifebuoyIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function SupportButton() {
    const t = useTranslations()
    return (
        <Link className="flex justify-center items-center w-full text-center mt-4" href={'/support'}>
            <Button variant="link" className="text-xs">
                {t('support')}
            </Button>
        </Link>
    )
}