import { Skeleton } from "@/components/theme/ui/skeleton";
import { TableRow, TableCell } from "@/components/theme/ui/table";

interface ContactListSkeletonProps {
  rowCount?: number;
}

export default function ContactListSkeleton({
  rowCount = 5,
}: ContactListSkeletonProps = {}) {
  return (
    <>
      {[...Array(rowCount)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="flex items-center justify-center">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </TableCell>

          <TableCell>
            <Skeleton className="h-4 w-3/4" />
          </TableCell>

          <TableCell>
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </TableCell>

          <TableCell>
            <Skeleton className="h-4 w-1/4 mx-auto" />
          </TableCell>

          <TableCell>
            <div className="flex items-center justify-center gap-2">
              <Skeleton className="h-5 w-5" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
