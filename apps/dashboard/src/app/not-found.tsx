'use client';

import '@/styles/globals.css';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { CloudSlashIcon } from '@phosphor-icons/react/dist/csr/CloudSlash';
import { CloudXIcon } from '@phosphor-icons/react/dist/csr/CloudX';
import { CoffeeIcon } from '@phosphor-icons/react/dist/csr/Coffee';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { Button } from '@/components/ui/button';

function NotFoundContent() {
  const params = useSearchParams();
  const status = params.get('status');

  return (
    <div
      className="font-Yekan flex h-screen flex-col items-center justify-center gap-3 bg-linear-to-t from-violet-300 to-blue-200 antialiased"
      dir="rtl"
    >
      <div>
        {status === 'network' ? (
          <CloudSlashIcon size={60} weight="duotone" className="text-primary" />
        ) : status === 'server' ? (
          <CloudXIcon size={60} weight="duotone" className="text-primary" />
        ) : (
          <CoffeeIcon size={60} weight="duotone" className="text-primary" />
        )}
      </div>
      <div className="text-secondary text-center">
        {status === 'network' ? (
          <p>
            <span className="text-lg font-semibold">ارتباط موقتا برقرار نیست</span>
            <br />
            <span className="text-[15px] font-medium">
              این مشکل میتواند به دلیل اینترنت شما یا اختلال کوتاه مدت سرور باشد. چند دقیقه دیگر
              دوباره تلاش کنید.
            </span>
          </p>
        ) : status === 'server' ? (
          <p>
            <span className="text-lg font-semibold">اخـتـلال در ارتـبـاط بـا سـرور</span>
            <br />
            <span className="text-[15px] font-medium">لطفا چند لحظه دیگر تلاش کنید.</span>
          </p>
        ) : (
          <p className="text-lg font-semibold">صـفـحـه مـورد نـظـر وجـود نـدارد.</p>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        {status === 'network' || status === 'server' ? (
          <>
            <Button asChild size="md">
              <Link href="/">تلاش مجدد</Link>
            </Button>
            <Button asChild size="md">
              <Link href="/" target="_blank">
                پشتیبانی
              </Link>
            </Button>
          </>
        ) : (
          <Button asChild size="md">
            <Link href="/support" target="_blank">
              صفحه اصلی
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<LoaderSpin />}>
      <NotFoundContent />
    </Suspense>
  );
}
