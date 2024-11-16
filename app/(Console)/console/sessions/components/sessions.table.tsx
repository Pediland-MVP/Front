"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { SessionNamespace } from "@/types/session";
import { Mailbox } from "@phosphor-icons/react";
import QuestionAnswerDialog from "./questionAnswer.dialog";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

interface SessionTableProps {
  contentCycleId?: string;
}

export default function SessionsTable({ contentCycleId }: SessionTableProps) {
  const [data, setData] = useState<SessionNamespace.Sessions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async (page: number = 1, limit: number = 10) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/sessions?page=${page}&limit=${limit}${contentCycleId ? `&contentCycleId=${contentCycleId}` : ""}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("خطا در دریافت اطلاعات");
      }
      const result = await response.json();
      setData(result);
      setCurrentPage(page);
    } catch (error) {
      setError("خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.");
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contentCycleId]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("fa-IR");
  };

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
                  <TableHead className="text-right">پروفایل</TableHead>
                  <TableHead className="text-right">
                    نام کاربری اینستاگرام
                  </TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">تاریخ شروع</TableHead>
                  <TableHead className="text-right">تاریخ بروزرسانی</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-right">{item.id}</TableCell>
                    <TableCell className="text-right">
                      <Avatar>
                        <AvatarImage
                          src={item.leadInstagram.profilePicture?.url}
                          alt="User"
                        />
                        <AvatarFallback>{item.leadInstagram.username[0]}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.leadInstagram.username}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.isCompleted ? (
                        <Badge variant={"success"}>پایان</Badge>
                      ) : item.isEnabled ? (
                        <Badge variant={"default"}>درحال انجام</Badge>
                      ) : (
                        <Badge variant={"destructive"}>لغو شده</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDate(item.createDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDate(item.updateDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center space-x-2">
                        <QuestionAnswerDialog questionId={item.id} leadInstagram={item.leadInstagram}/>
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
              <span>
                صفحه {currentPage} از {data.meta.totalPages}
              </span>
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
  );
}
