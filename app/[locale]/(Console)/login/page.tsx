'use client'

import { GoogleLogo } from "@/components/phosphore-icons";
import { useI18n } from "@/locales/client";
import { Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";

export default function Page() {
  const t = useI18n()
  
  const router = useRouter()
  const login = () => {
    router.push(`${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/google/login`)
  }

  return (
    <div className="flex justify-center items-center h-screen w-full ">
      <div className='flex flex-col justify-center align-items text-center'>
        <p className="text-2xl font-bold">{t('login.title')}</p>
        <p>{t('login.description')}</p>
        <Button onClick={login} endContent={<GoogleLogo size={23}/>} className="mt-5">ورود با گوگل</Button>
      </div>
    </div>
  );
}
