'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SessionNamespace } from '@/types/session';
import { Mailbox } from '@phosphor-icons/react/dist/ssr';
import { useMediaQuery } from '@react-hook/media-query';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import useSWRImmutable from 'swr/immutable';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

type QuestionAndAnswerProps = {
  questionId: number;
  leadInstagram: SessionNamespace.Sessions['items'][0]['leadInstagram'];
};

export default function QuestionAndAnswerDialog({
  questionId,
  leadInstagram,
}: QuestionAndAnswerProps) {
  const t = useTranslations('Sessions.QuestionAnswerDialog');
  const [open, setOpen] = React.useState(false);
  const isMobile = useMediaQuery('(max-width: 640px)');

  const {
    data: sessionData,
    error: sessionError,
    isLoading: isSessionLoading,
  } = useSWRImmutable<SessionNamespace.SessionAnswers>(`${API_URL}/sessions/answers/${questionId}`);

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
                <Skeleton className="ml-auto h-10 w-[75%] rounded-lg" />
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const ChatContent = () => (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center">
        <div className="flex items-center gap-x-2 space-x-4">
          <Avatar>
            <AvatarImage src={leadInstagram.profilePicture?.url} alt={t('userAvatar')} />
            <AvatarFallback>{leadInstagram.username[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm leading-none font-medium">{leadInstagram.username}</p>
            <p className="text-muted-foreground text-sm">#{sessionData!.id}</p>
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
                    'flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm',
                    'bg-muted',
                  )}
                >
                  {answer.questionContent?.text}
                </div>
                <div
                  className={cn(
                    'flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm',
                    'bg-primary text-primary-foreground ml-auto',
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
            <Mailbox className="ml-2 h-4 w-4" />
            {t('answers')}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-4 mt-4">{isSessionLoading ? <ChatSkeleton /> : <ChatContent />}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Mailbox className="ml-2 h-4 w-4" />
          {t('answers')}
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 sm:max-w-[425px]">
        {isSessionLoading ? <ChatSkeleton /> : <ChatContent />}
      </DialogContent>
    </Dialog>
  );
}
