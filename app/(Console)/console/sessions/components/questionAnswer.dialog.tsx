"use client";

import { useTranslations } from 'next-intl';
import * as React from "react";
import { useMediaQuery } from "@react-hook/media-query";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Mailbox } from "@phosphor-icons/react/dist/ssr";
import useSWRImmutable from "swr/immutable";
import { fetcher } from "@/hooks/swr/fetcher";
import { SessionNamespace } from "@/types/session";
import { Skeleton } from "@/components/ui/skeleton";

type QuestionAndAnswerProps = {
    questionId: number
    leadInstagram: SessionNamespace.Sessions['items'][0]['leadInstagram']
}

export default function QuestionAndAnswerDialog({questionId, leadInstagram}:QuestionAndAnswerProps) {
  const t = useTranslations('Sessions.QuestionAnswerDialog');
  const [open, setOpen] = React.useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

  const { data: sessionData, error: sessionError, isLoading: isSessionLoading } = useSWRImmutable<SessionNamespace.SessionAnswers>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/sessions/answers/${questionId}`, fetcher)

  const ChatSkeleton = () => (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[70px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full pr-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <React.Fragment key={index}>
                <Skeleton className="h-10 w-[75%] rounded-lg" />
                <Skeleton className="h-10 w-[75%] rounded-lg ml-auto" />
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  const ChatContent = () => (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center">
        <div className="flex gap-x-2 items-center space-x-4">
          <Avatar>
            <AvatarImage src={leadInstagram.profilePicture?.url} alt={t('userAvatar')} />
            <AvatarFallback>{leadInstagram.username[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{leadInstagram.username}</p>
            <p className="text-sm text-muted-foreground">#{sessionData!.id}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full pr-4">
          <div className="space-y-4">
            {sessionData!.answers.map((answer) => (
              <React.Fragment key={answer.id}>
                <div
                  className={cn(
                    "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                    "bg-muted"
                  )}
                >
                  {answer.question.text}
                </div>
                <div
                  className={cn(
                    "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                    "ml-auto bg-primary text-primary-foreground"
                  )}
                >
                  {answer.text}
                </div>
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
        <Button variant="ghost" size="sm">
          <Mailbox className="h-4 w-4 ml-2" />
          {t('answers')}
        </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mt-4 mx-4">
            {
              isSessionLoading ? (
                <ChatSkeleton />
              ) : (
                <ChatContent />
              )
            }
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Mailbox className="h-4 w-4 ml-2" />
          {t('answers')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0">
        {
          isSessionLoading ? (
            <ChatSkeleton />
          ) : (
            <ChatContent />
          )
        }
        
      </DialogContent>
    </Dialog>
  );
}

