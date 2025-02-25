import { Button } from "@/components/theme/ui/button";
import useUser from "@/hooks/useUser";
import { Basket, Plug } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePlanSelection } from "../settings/upgrade/hooks/usePlanSelection";
import DiscountText from "@/components/discountText";


export default function StartKit() {
    const divRef = useRef<HTMLDivElement>(null);

    const { hasSubscription, hasInstagram, isLoading, error } = useUser();

    useEffect(() => {
        if (divRef.current) {
            const script = document.createElement("script");
            script.type = "text/javascript";
            script.src =
                "https://www.aparat.com/embed/b916r5v?data[rnddiv]=17718987968&data[responsive]=yes&titleShow=true";
            script.async = true;
            divRef.current.appendChild(script);
        }
    }, []);

    return (
        <div className="_startkit-page h-full flex items-center justify-center md:max-w-[480px] mx-auto">
            <div className="p-6">
                <h2 className="font-semibold text-primary mb-1">
                    سینا پیرانی عزیز، خوش آمدید!
                </h2>
                <p className="mb-4 text-[15px]">لطفا برای استفاده از خدمات بفروش ابتدا ویدئو زیر را تماشا کنید.</p>
                <div id="17718987968" ref={divRef} />
                <DiscountText/>
                <div className="text-center">
                    <Button className="bg-green-500 text-white hover:bg-blue-100 mt-4" asChild>
                        <Link href={!hasSubscription ? '/console/settings/upgrade' : '/console/settings/accounts'}>
                            {!hasSubscription ? (
                                <>
                                    <Basket weight="duotone" className="w-5 h-5" />
                                    خرید اشتراک
                                </>
                            ) : (
                                <>
                                    <Plug weight="duotone" className="w-5 h-5" />
                                    اتصال اکانت
                                </>
                            )}
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );

}