import { useEffect, useRef } from "react";


export default function StartKit() {
    const divRef = useRef<HTMLDivElement>(null);

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
        <div className="_startkit-page h-full flex items-center justify-center">
            <div className="p-6 bg-red-100">
                <h2 className="font-semibold text-primary mb-1">
                    سینا پیرانی عزیز، خوش آمدید!
                </h2>
                <p className="mb-4">لطفا برای استفاده از خدمات بفروش ابتدا ویدئو زیر را تماشا کنید.</p>
                <div id="17718987968" ref={divRef} />
            </div>
        </div>
    )
}