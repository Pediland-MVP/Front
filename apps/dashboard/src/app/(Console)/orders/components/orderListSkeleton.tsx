import { Skeleton } from '@/components/ui/skeleton';
import { TableRow, TableCell } from '@/components/ui/table';

interface OrderListSkeletonProps {
  rowCount?: number;
}

export default function OrderListSkeleton({ rowCount = 5 }: OrderListSkeletonProps = {}) {
  return (
    <>
      {[...Array(rowCount)].map((_, index) => (
        <TableRow key={index}>
          {/* ستون عکس پروفایل (اول) */}
          <TableCell className="text-center lg:w-[7%]">
            <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          </TableCell>

          {/* ستون نام کاربر (دوم) */}
          <TableCell className="lg:w-[25%]">
            <Skeleton className="h-4 w-3/4" />
          </TableCell>

          {/* ستون اینستاگرام آیدی (سوم) */}
          <TableCell className="text-center lg:w-[25%]">
            <Skeleton className="mx-auto h-4 w-3/4" />
          </TableCell>

          {/* ستون تعداد پیام (چهارم) */}
          <TableCell className="text-center lg:w-[8%]">
            <Skeleton className="mx-auto h-4 w-1/2" />
          </TableCell>

          {/* ستون خالی (پنجم) */}
          <TableCell className="lg:w-[27%]">
            <Skeleton className="h-4 w-full" />
          </TableCell>

          {/* ستون اکشن (ششم) */}
          <TableCell className="text-center lg:w-[7%]">
            <Skeleton className="mx-auto h-5 w-5" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
