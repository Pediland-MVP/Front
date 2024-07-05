import { getI18n } from "@/locales/server";
import React from "react";


export default async function Page({params}: {params: {locale: 'en' | 'fa'}}) {
    const t = await getI18n()
    return (
        <h1>{t('hello')}</h1>
    )
    
}