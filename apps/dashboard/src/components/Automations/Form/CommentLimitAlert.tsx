'use client'
import { Alert, AlertDescription } from "@/components/ui"
import { AutomationFormType } from "@/schemas/automationForm"
import { useTranslations } from "next-intl"
import { useFormContext } from "react-hook-form"

export const CommentLimitAlert = () => {
    const t = useTranslations("Automations.TargetPostComment");
    const { watch } = useFormContext<AutomationFormType>()

    if (!watch('isComment')) {
        return null;
    }

    return (

        <Alert variant="note">
            <AlertDescription icon>
                {t("note")}
            </AlertDescription>
        </Alert>
    )
}