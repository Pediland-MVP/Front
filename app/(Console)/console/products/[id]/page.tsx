'use client'

import { toast } from "@/components/ui/use-toast"
import { ProductNamespace } from "@/types/product"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ProductFormSkeleton from "../components/product.form.skeleton"
import ProductForm from "../components/product.form"
import InstaDirectUi from "@/components/global/instaDirectUi"

export default function Page({params: {id}}: {params: {id: string}}) {

    const [product, setProduct] = useState<ProductNamespace.Product>()

    useEffect(() => {
        console.log(product);
    }, [product])

    const router = useRouter()

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/products/${id}`, {
                    credentials: 'include'
                })
                if (!response.ok) {
                    router.push(`/console/products`)
                    toast({
                        title: 'پیدا نشد',
                        variant: 'destructive',
                    })
                }
                const data = await response.json()
                setProduct(data)
            }
            catch(e) {
                router.push(`/console/products`)
                toast({
                    title: 'پیدا نشد',
                    variant: 'destructive',
                })
            }
        }

        fetchProduct()
    }, [])
    console.log(typeof product, !!product);
    

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