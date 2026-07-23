'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';

import api from '@/hooks/swr/api-client';
import type { ExceptionMessage } from '@/types/exceptionMessage';
import type { IResponseMessage } from '@/types/responseMessage';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { Spinner } from '@/components/ui/spinner';
import { FileUploader } from '@/components/ui-custom/FileUploader';

import { isTerminalImportState, useImportJobPolling } from './useImportJobPolling';
import type { CommerceImportJobStatus } from './useImportJobPolling';

type WizardStep = 'upload' | 'processing' | 'result';

/** Real backend fixed column order (`importRow.parser.ts`'s `IMPORT_COLUMNS`) — must match
 * `commerce-import-sample.csv`'s header row exactly, in the same order. */
const IMPORT_COLUMNS = [
  'title',
  'description',
  'status',
  'kind',
  'category',
  'option1Name',
  'option1Value',
  'option2Name',
  'option2Value',
  'option3Name',
  'option3Value',
  'sku',
  'price',
  'compareAtPrice',
  'stock',
  'trackInventory',
  'weight',
] as const;

const SAMPLE_FILE_HREF = '/commerce-import-sample.csv';
const ACCEPTED_TYPES = '.csv,.xlsx,.xls';

export const ImportWizard = () => {
  const t = useTranslations('Commerce.Import');
  const t_ec = useTranslations('ERROR_CODES');

  const [step, setStep] = useState<WizardStep>('upload');
  const [jobId, setJobId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { status } = useImportJobPolling(jobId);

  // The "processing" -> "result" transition is derived, not a separate effect: once the
  // polled `state` turns terminal, render the result step straight off `status` on the very
  // next tick — no extra `useEffect` needed to flip a second piece of state.
  const effectiveStep: WizardStep =
    step === 'processing' && isTerminalImportState(status?.state) ? 'result' : step;

  const handleFileSelected = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post<IResponseMessage<{ jobId: string }>>(
        '/commerce/import',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setJobId(res.data.data.jobId);
      setStep('processing');
    } catch (e) {
      const code = isAxiosError<ExceptionMessage>(e) ? e.response?.data?.code : undefined;
      toast.error(code ? t_ec(code) : t('upload.genericError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setJobId(null);
    setStep('upload');
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <WizardStepsIndicator step={effectiveStep} />

      {effectiveStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('upload.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">{t('upload.description')}</p>

            <div className="bg-muted rounded-md p-3">
              <p className="mb-2 text-sm font-medium">{t('upload.columnsHintTitle')}</p>
              <p dir="ltr" className="text-left font-mono text-xs break-words">
                {IMPORT_COLUMNS.join(', ')}
              </p>
            </div>

            <a
              href={SAMPLE_FILE_HREF}
              download
              className="text-primary inline-block text-sm font-medium underline underline-offset-4"
            >
              {t('upload.downloadSample')}
            </a>

            <FileUploader
              type="file"
              accept={ACCEPTED_TYPES}
              multiple={false}
              isUploading={isUploading}
              onChange={handleFileSelected}
            />
          </CardContent>
        </Card>
      )}

      {effectiveStep === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('processing.title')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Spinner className="size-8" />
            <p className="text-muted-foreground text-sm">{t('processing.description')}</p>
            <p className="text-lg font-semibold" data-testid="import-processed-count">
              {t('processing.processedCount', { count: status?.processed ?? 0 })}
            </p>
          </CardContent>
        </Card>
      )}

      {effectiveStep === 'result' && status && <ResultStep status={status} onReset={handleReset} />}
    </div>
  );
};

const WizardStepsIndicator = ({ step }: { step: WizardStep }) => {
  const t = useTranslations('Commerce.Import');
  const steps: WizardStep[] = ['upload', 'processing', 'result'];
  const currentIndex = steps.indexOf(step);

  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      {steps.map((s, index) => (
        <div key={s} className="flex items-center gap-2">
          <span
            className={
              index <= currentIndex
                ? 'bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs'
                : 'bg-muted text-muted-foreground flex size-6 items-center justify-center rounded-full text-xs'
            }
          >
            {index + 1}
          </span>
          <span className={index <= currentIndex ? 'font-medium' : 'text-muted-foreground'}>
            {t(`steps.${s}`)}
          </span>
          {index < steps.length - 1 && <span className="text-muted-foreground mx-1">-</span>}
        </div>
      ))}
    </div>
  );
};

const ResultStep = ({
  status,
  onReset,
}: {
  status: CommerceImportJobStatus;
  onReset: () => void;
}) => {
  const t = useTranslations('Commerce.Import');
  const jobFailed = status.state === 'failed';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('result.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobFailed ? (
          <p className="text-destructive text-sm">{t('result.jobFailed')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <SummaryTile
              label={t('result.processed')}
              value={status.processed}
              testId="import-result-processed"
            />
            <SummaryTile
              label={t('result.failed')}
              value={status.failed}
              destructive={status.failed > 0}
              testId="import-result-failed"
            />
          </div>
        )}

        {status.errorReportFileId != null && <ErrorReportDownload />}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onReset}>
            {t('result.importAnother')}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/products">{t('result.backToProducts')}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const SummaryTile = ({
  label,
  value,
  destructive,
  testId,
}: {
  label: string;
  value: number;
  destructive?: boolean;
  testId: string;
}) => (
  <div className="bg-muted rounded-md p-4 text-center">
    <p
      className={`text-2xl font-bold ${destructive ? 'text-destructive' : ''}`}
      data-testid={testId}
    >
      {value}
    </p>
    <p className="text-muted-foreground text-sm">{label}</p>
  </div>
);

// KNOWN GAP — see task-10-report.md "Concerns": `errorReportFileId` (from
// `GET /commerce/import/:jobId`) is a raw numeric `FileEntity` id, not a resolved `url`. Every
// other place in this codebase that shows a file to the user (media tiles, product covers)
// gets an ALREADY-RESOLVED `url` back from its own endpoint — see the comment on
// `CommerceProductMedia` in `types/commerce.ts` ("no productId/fileId ... never exposed once
// the url is resolved server-side"). The excel-export features the design spec pointed at
// (`excelExportOrders.drawer.tsx` etc.) don't expose a fileId + download route either — they
// email the finished file. So there is NO existing "resolve a bare FileEntity id into a
// download URL" route anywhere in this app to reuse, and inventing one here would be exactly
// the kind of guessed backend contract the task brief warned against. This renders a real,
// visible affordance (not silently dropped) but keeps it honestly disabled until Back adds a
// companion download route (e.g. `GET /commerce/import/:jobId/error-report`, workspace-scoped
// like the status endpoint already is).
const ErrorReportDownload = () => {
  const t = useTranslations('Commerce.Import');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button type="button" variant="outline" disabled className="w-full">
            {t('result.downloadErrorReport')}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{t('result.downloadErrorReportUnavailable')}</TooltipContent>
    </Tooltip>
  );
};
