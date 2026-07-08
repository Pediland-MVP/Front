'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import api from '@/hooks/swr/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LayoutTable } from '@/components/layout/LayoutTable';
import dayjs from '@/lib/dayjs-jalali';

export interface JobRunView {
  trigger: string;
  status: 'running' | 'success' | 'failed' | 'skipped';
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  rowsAffected: number | null;
  error: string | null;
}
export interface JobView {
  name: string;
  app: 'core' | 'admin';
  description: string;
  cron: string;
  timezone: string | null;
  prodOnly: boolean;
  nextRunAt: string | null;
  lastRun: JobRunView | null;
}

const statusVariant: Record<string, 'success' | 'destructive' | 'secondary' | 'default'> = {
  success: 'success',
  failed: 'destructive',
  skipped: 'secondary',
  running: 'default',
};

function fmt(iso: string | null) {
  return iso ? dayjs(iso).calendar('jalali').format('YYYY/MM/DD HH:mm') : '—';
}

export default function JobsTable({
  jobs,
  isRefetching,
  mutate,
}: {
  jobs: JobView[];
  isRefetching?: boolean;
  mutate: () => void;
}) {
  const t = useTranslations('Jobs');
  const t_ec = useTranslations('ERROR_CODES');
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmJob, setConfirmJob] = useState<string | null>(null);

  // Job names/descriptions come from the backend catalog in English. Look up a
  // Persian label keyed by the job id (dots → underscores, since next-intl uses
  // dots for nesting), falling back to the raw catalog value when unmapped.
  const jobKey = (name: string) => name.replace(/\./g, '_');
  const jobLabel = (name: string) =>
    t.has(`name.${jobKey(name)}`) ? t(`name.${jobKey(name)}`) : name;
  const jobDesc = (job: JobView) =>
    t.has(`desc.${jobKey(job.name)}`) ? t(`desc.${jobKey(job.name)}`) : job.description;

  const run = async (name: string) => {
    setBusy(name);
    try {
      await api.post(`/jobs/${name}/run`);
      toast.success(t('runTriggered'));
      mutate();
    } catch (err: any) {
      toast.error(t_ec(err?.response?.data?.code) || t('runError'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <LayoutTable isRefetching={isRefetching}>
      <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
        <h1 className="text-lg font-semibold">{t('title')}</h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('colJob')}</TableHead>
              <TableHead>{t('colApp')}</TableHead>
              <TableHead>{t('colSchedule')}</TableHead>
              <TableHead>{t('colNextRun')}</TableHead>
              <TableHead>{t('colLastRun')}</TableHead>
              <TableHead>{t('colStatus')}</TableHead>
              <TableHead>{t('colAction')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.name}>
                <TableCell>
                  <div className="font-medium">{jobLabel(job.name)}</div>
                  <div className="text-muted-foreground font-mono text-xs">{job.name}</div>
                  <div className="text-muted-foreground text-xs">{jobDesc(job)}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={job.app === 'core' ? 'default' : 'secondary'}>{job.app}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {job.cron}
                  {job.prodOnly && (
                    <span className="text-muted-foreground"> ({t('prodOnly')})</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">{fmt(job.nextRunAt)}</TableCell>
                <TableCell className="text-xs">{fmt(job.lastRun?.startedAt ?? null)}</TableCell>
                <TableCell>
                  {job.lastRun ? (
                    <Badge variant={statusVariant[job.lastRun.status] ?? 'secondary'}>
                      {t(`status_${job.lastRun.status}`)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    className="min-w-16"
                    disabled={busy === job.name}
                    aria-label={busy === job.name ? t('running') : t('runNow')}
                    onClick={() => setConfirmJob(job.name)}
                  >
                    {busy === job.name ? <Spinner /> : t('runNow')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmJob} onOpenChange={(o) => !o && setConfirmJob(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmBody', { name: confirmJob ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmJob) run(confirmJob);
                setConfirmJob(null);
              }}
            >
              {t('confirmRun')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LayoutTable>
  );
}
