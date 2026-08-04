'use client';

import { useTranslations } from 'next-intl';
import { DesktopIcon } from '@phosphor-icons/react/dist/csr/Desktop';
import { DeviceMobileIcon } from '@phosphor-icons/react/dist/csr/DeviceMobile';
import { DeviceTabletIcon } from '@phosphor-icons/react/dist/csr/DeviceTablet';
import { InfoIcon } from '@phosphor-icons/react/dist/csr/Info';
import { QuestionIcon } from '@phosphor-icons/react/dist/csr/Question';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { toJalaliDateTime } from '@/utils/jalali';
import { AccountSessionItem, AccountSessionNamespace } from '@/types/accountSession';
import { useTerminateSession } from './hooks/useTerminateSession';

const deviceIcon: Record<AccountSessionNamespace.DeviceType, typeof DesktopIcon> = {
  mobile: DeviceMobileIcon,
  tablet: DeviceTabletIcon,
  desktop: DesktopIcon,
  unknown: QuestionIcon,
};

interface Props {
  sessions: AccountSessionItem[];
  onTerminated: () => void;
}

export function AccountSessionsTable({ sessions, onTerminated }: Props) {
  const t = useTranslations('Settings.AccountSessions');
  const { terminate, terminatingId } = useTerminateSession(onTerminated);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">{t('device')}</TableHead>
            <TableHead className="text-right">{t('name')}</TableHead>
            <TableHead className="text-right">{t('type')}</TableHead>
            <TableHead className="text-right">{t('workspace')}</TableHead>
            <TableHead className="text-right">{t('loginDate')}</TableHead>
            <TableHead className="text-right">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => {
            const Icon = deviceIcon[session.deviceType] ?? QuestionIcon;
            const isTerminating = terminatingId === session.id;

            return (
              <TableRow
                key={session.id}
                className={session.isCurrent ? 'bg-blue-50/60' : undefined}
              >
                <TableCell className="text-right">
                  <div className="flex items-center gap-2">
                    <Icon className="text-secondary size-5" weight="duotone" />
                    <span className="text-muted-foreground text-sm">
                      {t(`device_${session.deviceType}`)}
                    </span>
                    {session.isCurrent && <Badge variant="success">{t('current_session')}</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">{session.name}</TableCell>
                <TableCell className="text-right">{session.type}</TableCell>
                <TableCell className="text-right">{session.workspaceName}</TableCell>
                <TableCell className="text-right">{toJalaliDateTime(session.loginDate)}</TableCell>
                <TableCell className="text-right">
                  {session.canTerminate ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isTerminating}>
                          {isTerminating ? <Spinner /> : null}
                          {t('terminate')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('terminate_dialog_title')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('terminate_dialog_description')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => terminate(session.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {t('terminate_confirm')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    // Session can't be terminated — clicking explains why instead of a
                    // dead disabled button. Reason: current session vs. younger than 5 days.
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-muted-foreground">
                          <InfoIcon className="size-4" weight="duotone" />
                          {t('terminate')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('cannot_terminate_title')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {session.isCurrent
                              ? t('cannot_terminate_current')
                              : t('cannot_terminate_recent')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('understood')}</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
