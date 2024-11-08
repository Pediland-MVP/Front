'use client'

import ProductFormSkeleton from "../components/product.form.skeleton"
import ProductForm from "../components/product.form"
import InstaDirectUi from "@/components/global/instaDirectUi"
import { redirect } from "next/navigation"

export default async function Page({params}: {params: Promise<{id: string}>}) {

    const { id } = await params 

    const product = await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/products/${id}`, {
        credentials: 'include'
    }).then(res => {
        if (!res.ok) {
            redirect(`/console/products`)
        }
        return res.json()
    }).catch(e => {
        redirect(`/console/products`)
    })
    

    if (!product) {
        return <ProductFormSkeleton/>
    }
    
    return (
        <div className="h-full flex gap-4">
        <div className="w-2/3 h-[calc(100vh-2rem)] bg-white shadow rounded-2xl p-4">
          <ProductForm shouldBeEdit={product} />
        </div>
        <div className="w-1/3 h-[calc(100vh-2rem)] bg-white shadow rounded-2xl p-4">
          <InstaDirectUi />
        </div>
      </div>
    )

}