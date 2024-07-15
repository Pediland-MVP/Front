'use client'
import React from "react";
import type ParamBaseInterface from "@/interfaces/paramBase.interface";
import { useI18n } from "@/locales/client";


export default  function Page({params}: ParamBaseInterface) {
    const t = useI18n()
    return (
        <h1>{t('console.welcome', {name: params.locale})}</h1>
    )
    
}
