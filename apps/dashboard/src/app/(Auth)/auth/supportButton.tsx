import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";

type SupportButtonPropsType = {
    type: 'internal' | 'external'
    className?: string
}

const supportButtonTypesLinkMap = {
    internal: '/help/support',
    external: 'support'
}

export default function SupportButton({className, type}: SupportButtonPropsType) {
    const t = useTranslations()
    return (
        <Link className={cn("flex justify-center items-center w-full text-center mt-4", className)} href={`${supportButtonTypesLinkMap[type]}`}>
            <Button variant="link" className="text-xs">
                {t('support')}
            </Button>
        </Link>
    )
}