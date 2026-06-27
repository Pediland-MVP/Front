import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

interface ContactListSkeletonProps {
  rowCount?: number;
}

export default function ContactListSkeleton({ rowCount = 5 }: ContactListSkeletonProps = {}) {
  return (
    <>
      {[...Array(rowCount)].map((_, index) => (
        <TableRow key={index}>
          <TableCell className="w-[5%]">
            <Skeleton className="h-4 w-4" />
          </TableCell>
          <TableCell className="w-[15%]">
            <div className="flex justify-center">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </TableCell>
          <TableCell className="w-[25%]">
            <Skeleton className="h-4 w-full" />
          </TableCell>
          <TableCell className="w-[25%]">
            <Skeleton className="h-4 w-full" />
          </TableCell>
          <TableCell className="w-[10%]">
            <Skeleton className="h-4 w-full" />
          </TableCell>
          <TableCell className="w-[10%]">
            <Skeleton className="h-4 w-full" />
          </TableCell>
          <TableCell className="w-[10%]">
            <div className="flex justify-center gap-2">
              <Skeleton className="h-5 w-5" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
