import logger from "@/app/utils/logger";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { z } from "zod";
import LoadingButton from '@/components/ui/button-loading';

type ResendButtonProps = {
    mobile: string
}
export default function ResetButton({ mobile }: ResendButtonProps) {
    const t = useTranslations('Auth.ResetPassword')
    const [remainingTime, setRemainingTime] = useState(120)
    const [isLoading, setIsLoading] = useState(false)

    const resend = async () => {
        setIsLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/mobile/sendResetPasswordCode`, {
                method: "PATCH",
                body: JSON.stringify({ mobile }),
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                }
            })

            if (!res.ok) {

                if (res.status === 429) {
                    toast({
                        title: t("tryAgainLater"),
                        variant: "destructive",
                    });
                    return
                }

                toast({
                    title: t("resetRequestError"),
                    description: t("resetRequestErrorDescription"),
                    variant: "destructive",
                });
                return
            }

            toast({
                title: t("resetRequestSent"),
                description: t("checkMobile"),
            });

        }
        catch (e) {
            toast({
                title: t("resetRequestError"),
                description: t("resetRequestErrorDescription"),
                variant: "destructive",
            });
            return
        }
        finally {
            setIsLoading(false);
            setRemainingTime(120)
        }
    };

    const remainingTimeHandler = () => {
        setRemainingTime((old) => {
            if (old > 0) {
                return old - 1
            }
            return old
        })
    }

    useEffect(() => {
        const timer = setInterval(remainingTimeHandler, 1000);
        return () => {
            clearInterval(timer)
        }
    }, [])

    return (
        <div className="w-full flex justify-center items-center gap-x-4">
            <p className="w-2/3 text-center text-lg">0{Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}</p>
            <LoadingButton isLoading={isLoading} disabled={remainingTime > 0} className="w-1/3 text-gray-600" onClick={resend} type="button" variant={"outline"}>
                {t('resend')}
            </LoadingButton>
        </div>
    )

}