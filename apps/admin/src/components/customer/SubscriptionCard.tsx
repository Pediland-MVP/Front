'use client';

import { useState } from 'react';
import dayjs from '@/lib/dayjs-jalali';
import { formatNumber } from '@/lib/formatNumber';
import { cn } from '@/lib/utils';
import { Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr/InstagramLogo';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function SubscriptionAvatar({
  instagram,
}: {
  instagram?: { username: string; profilePictureUrl: string | null } | null;
}) {
  const [imgError, setImgError] = useState(false);

  if (instagram?.profilePictureUrl && !imgError) {
    return (
      <img
        src={instagram.profilePictureUrl}
        alt={instagram.username}
        className="h-10 w-10 shrink-0 rounded-xl object-cover"
        onError={() => setImgError(true)}
      />
    );
  }

  if (instagram) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-xs">
        <InstagramLogoIcon size={18} />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xs">
      <Receipt size={18} className="stroke-[1.8]" />
    </div>
  );
}

export function SubscriptionCard({ subscription }: { subscription: any }) {
  const [expanded, setExpanded] = useState(false);

  const createDate = dayjs(subscription.createDate).calendar('jalali').format('YYYY/MM/DD HH:mm');

  const expireDate = subscription.expire
    ? dayjs(subscription.expire).calendar('jalali').format('YYYY/MM/DD')
    : 'نامحدود';

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      active: { label: 'فعال', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
      reserved: { label: 'رزرو', className: 'bg-blue-50 text-blue-700 border-blue-100' },
      expired: { label: 'منقضی شده', className: 'bg-rose-50 text-rose-700 border-rose-100' },
      pending: { label: 'در انتظار', className: 'bg-amber-50 text-amber-700 border-amber-100' },
      canceled: { label: 'لغو شده', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    };

    const item = config[status] || { label: status, className: 'bg-slate-50 text-slate-600' };
    return (
      <span
        className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-bold', item.className)}
      >
        {item.label}
      </span>
    );
  };

  const planName = subscription.planDuration?.plan?.name || 'بسته عمومی';
  const durationName = subscription.planDuration?.name || 'سفارشی';
  const price = subscription.planDuration?.price || 0;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xs transition-shadow duration-150 hover:shadow-xs">
      <div
        className="flex cursor-pointer items-center justify-between p-3.5 transition-colors hover:bg-slate-50/40"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <SubscriptionAvatar instagram={subscription.instagram} />

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">
                {planName} ({durationName})
              </span>
              {subscription.instagram ? (
                <span className="text-xs font-semibold text-pink-600" dir="ltr">
                  @{subscription.instagram.username}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400">(بدون پیج خاص)</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] font-semibold text-slate-400">
              <span>شروع: {createDate}</span>
              <span className="hidden md:inline">•</span>
              <span>انقضا: {expireDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(subscription.status)}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-slate-50 bg-slate-50/20 p-4">
          <div className="grid grid-cols-1 gap-3.5 text-xs md:grid-cols-3">
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-400">شناسه اشتراک</span>
              <span className="block font-mono text-slate-700" dir="ltr">
                {subscription.id}
              </span>
            </div>
            {subscription.workspaceName && (
              <div className="space-y-1">
                <span className="block text-[10px] text-slate-400">فضای کاری</span>
                <span className="block font-bold text-slate-700">{subscription.workspaceName}</span>
              </div>
            )}
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-400">پیج اینستاگرام</span>
              {subscription.instagram ? (
                <span className="block font-bold text-slate-700" dir="ltr">
                  @{subscription.instagram.username}
                </span>
              ) : (
                <span className="block font-bold text-slate-700">بدون پیج خاص (استخر)</span>
              )}
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-400">مبلغ بسته</span>
              <span className="block font-bold text-indigo-700 text-slate-800">
                {formatNumber(price)} ریال
              </span>
            </div>
          </div>

          {/* Invoices inside Subscription */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Receipt className="h-4 w-4 text-indigo-500" />
              <span>صورتحساب‌های پرداخت شده:</span>
            </div>

            {subscription.invoices && subscription.invoices.length > 0 ? (
              <div className="shadow-3xs overflow-hidden rounded-xl border border-slate-100 bg-white">
                <Table className="text-[11px] leading-tight">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="py-2 text-right">شناسه فاکتور</TableHead>
                      <TableHead className="py-2 text-right">مبلغ</TableHead>
                      <TableHead className="py-2 text-right">وضعیت</TableHead>
                      <TableHead className="py-2 text-right">روش پرداخت</TableHead>
                      <TableHead className="py-2 text-right">تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscription.invoices.map((inv: any) => {
                      const invDate = dayjs(inv.createDate)
                        .calendar('jalali')
                        .format('YYYY/MM/DD HH:mm');

                      const payMethodLabels: Record<string, string> = {
                        card: 'کارت به کارت',
                        zarinpal: 'زرین‌پال',
                        manual: 'ثبت دستی',
                      };

                      const invStatusLabels: Record<string, { label: string; className: string }> =
                        {
                          paid: {
                            label: 'پرداخت شده',
                            className: 'text-emerald-600 font-semibold',
                          },
                          pending: {
                            label: 'در انتظار پرداخت',
                            className: 'text-amber-600 font-semibold',
                          },
                          failed: { label: 'ناموفق', className: 'text-rose-600 font-semibold' },
                        };

                      const invStatus = invStatusLabels[inv.status] || {
                        label: inv.status,
                        className: 'text-slate-600',
                      };

                      return (
                        <TableRow key={inv.id} className="hover:bg-slate-50/30">
                          <TableCell className="py-2 font-mono">{inv.id}</TableCell>
                          <TableCell className="py-2 font-bold">
                            {formatNumber(inv.amount)} ریال
                          </TableCell>
                          <TableCell className={cn('py-2', invStatus.className)}>
                            {invStatus.label}
                          </TableCell>
                          <TableCell className="py-2">
                            {payMethodLabels[inv.paymentMethod] || inv.paymentMethod || 'نامشخص'}
                          </TableCell>
                          <TableCell className="py-2">{invDate}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="rounded-xl border border-slate-100 bg-white p-3 text-center text-[11px] text-slate-400">
                صورتحسابی ثبت نشده است.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
