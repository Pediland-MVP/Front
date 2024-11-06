'use client'

import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Pencil, Trash2, ChevronRight, ChevronLeft } from "lucide-react"
import Link from 'next/link'
import { DeleteConfirmationDialog } from './contentCycleDeleteConfirmation'
import { toast } from '@/components/ui/use-toast'

type ContentCycle = {
  title: string
  id: string
  conditions: Array<{ type: string; value: string }>
  contents: Array<{
    id: string
    text: string | null
  }>
}

type ContentCycleResponse = {
  items: ContentCycle[]
  meta: {
    currentPage: number
    itemCount: number
    itemsPerPage: number
    totalItems: number
    totalPages: number
  }
}

export default function ContentCycleTable() {
  const [data, setData] = useState<ContentCycleResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async (page: number = 1, limit: number = 10, force: boolean = false) => {
    if ((currentPage === data?.meta?.totalPages || currentPage === 0) && !force) {
        // Last page and first page
        return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/contentCycle?page=${page}&limit=${limit}`, {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error('خطا در دریافت اطلاعات')
      }
      const result = await response.json()
      setData(result)
      setCurrentPage(page)
    } catch (error) {
      setError('خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.')
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      console.log('itemToDelete', itemToDelete);
      
      setIsLoading(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/contentCycle/${itemToDelete}`, {
          method: "DELETE",
          credentials: 'include'
        })

        if (!res.ok) {
          toast({
            title: 'خطا',
            description: 'مشکلی پیش آمده است',
            variant: 'destructive'
          })
          return;
        }

        toast({
          title: 'حذف شد',
        })
        await fetchData(currentPage, undefined, true) // Refresh data after deletion
      } catch (error) {
        setError('خطا در حذف مورد. لطفاً دوباره تلاش کنید.')
        console.error('Error deleting item:', error)
      } finally {
        setIsLoading(false)
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      }
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setItemToDelete(null)
  }



  return (
    <div className="rtl bg-white rounded-lg p-7" dir="rtl">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                <TableHead className="text-right">عنوان</TableHead>
                  <TableHead className="text-right">مقدار شرط</TableHead>
                  <TableHead className="text-right">پیام اول</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-right">{item.title}</TableCell>
                    <TableCell className="text-right">{item.conditions[0]?.value || 'موجود نیست'}</TableCell>
                    <TableCell className="text-right">{item.contents[0]?.text || 'موجود نیست'}</TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-2 space-x-reverse">
                        <Link href={`/console/actions/content-cycle/${item.id}`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4 ml-2" />
                            ویرایش
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(item.id)}>
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {data?.meta && (
            <div className="flex justify-between items-center mt-4">
              <Button 
                variant="outline" 
                onClick={() => fetchData(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronRight className="h-4 w-4 ml-2" />
                قبلی
              </Button>
              <span>صفحه {currentPage} از {data.meta.totalPages}</span>
              <Button 
                variant="outline" 
                onClick={() => fetchData(currentPage + 1)}
                disabled={currentPage === data.meta.totalPages}
              >
                بعدی
                <ChevronLeft className="h-4 w-4 mr-2" />
              </Button>
            </div>
          )}
        </>
      )}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemId={itemToDelete || ''}
      />
    </div>
  )
}