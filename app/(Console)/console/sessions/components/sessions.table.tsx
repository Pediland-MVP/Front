"use client";

import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { SessionNamespace } from "@/types/session";
import QuestionAnswerDialog from "./questionAnswer.dialog";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import Link from "next/link";
// Just UI Imports Below
import { Card } from "@/components/theme/ui/card";
import { ChatCircleText } from "@phosphor-icons/react/dist/ssr";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/theme/ui/table";
import { Button } from "@/components/theme/ui/button";
import useSWR from "swr";

interface SessionTableProps {
  contentCycleId?: string;
}

export default function SessionsTable({ contentCycleId }: SessionTableProps) {
  const t = useTranslations("Sessions.List");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: sessions,
    error: sessionsError,
    isLoading: isSessionsLoading,
    mutate: mutateSessions,
  } = useSWR<SessionNamespace.Sessions>(
    `/sessions?page=${currentPage}&limit=10${contentCycleId ? `&contentCycleId=${contentCycleId}` : ""}`
  );

  const nextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
    mutateSessions();
  };

  const prevPage = () => {
    setCurrentPage((prevPage) => prevPage - 1);
    mutateSessions();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("fa-IR");
  };

  if (isSessionsLoading || !sessions) {
    return (
      <Card className="border-b-2 border-gray-100">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-b-2 border-gray-100">
      {sessionsError ? (
        <div className="text-center text-red-500">{sessionsError}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t("id")}</TableHead>
                  <TableHead className="text-right">{t("profile")}</TableHead>
                  <TableHead className="text-right">
                    {t("instagramUsername")}
                  </TableHead>
                  <TableHead className="text-right">{t("status")}</TableHead>
                  <TableHead className="text-right">{t("startDate")}</TableHead>
                  <TableHead className="text-right">
                    {t("updateDate")}
                  </TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions?.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-right">{item.id}</TableCell>
                    <TableCell className="text-right">
                      <Avatar>
                        <AvatarImage
                          src={item.leadInstagram.profilePicture?.url}
                          alt={t("userAvatar")}
                        />
                        <AvatarFallback>
                          {item.leadInstagram.username[0]}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.leadInstagram.username}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.isCompleted ? (
                        <Badge variant={"success"}>{t("completed")}</Badge>
                      ) : item.isEnabled ? (
                        <Badge variant={"default"}>{t("inProgress")}</Badge>
                      ) : (
                        <Badge variant={"destructive"}>{t("cancelled")}</Badge>
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
                        <QuestionAnswerDialog
                          questionId={item.id}
                          leadInstagram={item.leadInstagram}
                        />
                        <Link
                          href={`/console/inbox/${item.leadInstagram.lead.id}`}
                        >
                          <Button variant="ghost" size="sm">
                            <ChatCircleText className="h-4 w-4 ml-2" />
                            {t("viewChat")}
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {sessions.meta && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                <ChevronRight className="h-4 w-4 ml-2" />
                {t("previous")}
              </Button>
              <span>
                {t("pageOf", {
                  current: currentPage,
                  total: sessions.meta.totalPages,
                })}
              </span>
              <Button
                variant="outline"
                onClick={nextPage}
                disabled={currentPage === sessions.meta.totalPages}
              >
                {t("next")}
                <ChevronLeft className="h-4 w-4 mr-2" />
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
