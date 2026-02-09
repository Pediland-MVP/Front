"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { SessionNamespace } from "@/types/session";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
// Just UI Imports Below
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui";
import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";
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
    `/sessions?page=${currentPage}&limit=10${contentCycleId ? `&contentCycleId=${contentCycleId}` : ""}`,
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
    return <LoaderSpin />;
  }

  return (
    <div>
      {sessionsError ? (
        <div className="text-center text-red-500">{sessionsError}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t("profile")}</TableHead>
                  <TableHead className="text-right">
                    {t("mobile")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("instagramUsername")}
                  </TableHead>
                  <TableHead className="text-right">{t("status")}</TableHead>
                  <TableHead className="text-right">{t("startDate")}</TableHead>
                  <TableHead className="text-right">
                    {t("updateDate")}
                  </TableHead>
                  {/* <TableHead className="text-right">{t("actions")}</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions?.items.map((item) => (
                  <TableRow key={item.id}>
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
                      {item.leadInstagram.lead?.contact?.mobile}
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
                    {/* <TableCell className="text-right">
                      <div className="flex items-center space-x-2">
                        <QuestionAnswerDialog
                          questionId={item.id}
                          leadInstagram={item.leadInstagram}
                        />
                      </div>
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {sessions.meta && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                <ChevronRight className="ml-2 h-4 w-4" />
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
                <ChevronLeft className="mr-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
