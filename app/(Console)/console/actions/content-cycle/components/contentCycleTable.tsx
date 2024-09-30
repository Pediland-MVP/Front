'use client'

import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Loader2, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteConfirmationDialog } from './contentCycleDeleteConfirmation'

type ContentCycle = {
  id: string
  conditions: Array<{ type: string; value: string }>
  messages: Array<{
    id: string
    text: string | null
    priority: number
    isConsent: boolean
    isCta: boolean
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

  const fetchData = async (page: number = 1, limit: number = 10) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`http://localhost:3001/v1/actions/contentCycle?page=${page}&limit=${limit}`, {
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

  const handleEdit = (id: string) => {
    console.log('Edit item with id:', id)
    // Implement edit functionality
  }

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      setIsLoading(true)
      try {
        // Implement actual delete API call here
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulating API call
        console.log('Deleted item with id:', itemToDelete)
        await fetchData(currentPage) // Refresh data after deletion
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

  const getFirstValidMessage = (messages: ContentCycle['messages']) => {
    return messages.find(msg => msg.priority === 1 && msg.text && !msg.isConsent && !msg.isCta)?.text || 'موجود نیست'
  }

  return (
    <div className="container mx-auto py-10 rtl" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-right">جدول چرخه محتوا</CardTitle>
        </CardHeader>
        <CardContent>
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
                      <TableHead className="text-right">مقدار شرط</TableHead>
                      <TableHead className="text-right">پیام اول</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-right">{item.conditions[0]?.value || 'موجود نیست'}</TableCell>
                        <TableCell className="text-right">{getFirstValidMessage(item.messages)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end space-x-2 space-x-reverse">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(item.id)}>
                              <Pencil className="h-4 w-4 ml-2" />
                              ویرایش
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(item.id)}>
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
                <Pagination className="mt-4 flex justify-center">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => fetchData(currentPage - 1)}
                        isActive={currentPage !== 1}
                      >
                        قبلی
                      </PaginationPrevious>
                    </PaginationItem>
                    {[...Array(data.meta.totalPages)].map((_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink 
                          onClick={() => fetchData(index + 1)}
                          isActive={currentPage === index + 1}
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => fetchData(currentPage + 1)}
                        isActive={currentPage !== data.meta.totalPages}
                      >
                        بعدی
                      </PaginationNext>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemId={itemToDelete || ''}
      />
    </div>
  )
}