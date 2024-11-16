'use client'

import React, { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface Flow {
  getUserData: "getUserData";
  question: "question";
}

interface LeadInstagram {
  id: string;
  name: "SinaPirani";
  username: "sinapiranix";
}

interface Item {
  passedFlows: Flow[];
  id: number;
  createDate: Date;
  updateDate: Date;
  isEnabled: boolean;
  step: number;
  questionStep: number;
  flow: Flow | null;
  lastMid: null | string;
  leadInstagram: LeadInstagram;
}

interface Meta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface SessionResponse {
  items: Item[];
  meta: Meta;
}

interface SessionTableProps {
  contentCycleId?: string;
}

export default function SessionsTable({ contentCycleId }: SessionTableProps) {
  const [data, setData] = useState<SessionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async (page: number = 1, limit: number = 10) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/sessions?page=${page}&limit=${limit}${contentCycleId ? `&contentCycleId=${contentCycleId}` : ''}`, {
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
  }, [contentCycleId])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('fa-IR')
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
                  <TableHead className="text-right">شناسه</TableHead>
                  <TableHead className="text-right">نام کاربری اینستاگرام</TableHead>
                  <TableHead className="text-right">مرحله</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">تاریخ ایجاد</TableHead>
                  <TableHead className="text-right">تاریخ بروزرسانی</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-right">{item.id}</TableCell>
                    <TableCell className="text-right">{item.leadInstagram.username}</TableCell>
                    <TableCell className="text-right">{item.step}</TableCell>
                    <TableCell className="text-right">{item.isEnabled ? 'فعال' : 'غیرفعال'}</TableCell>
                    <TableCell className="text-right">{formatDate(item.createDate)}</TableCell>
                    <TableCell className="text-right">{formatDate(item.updateDate)}</TableCell>
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
    </div>
  )
}