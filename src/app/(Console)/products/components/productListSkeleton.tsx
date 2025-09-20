"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
    TableRow,
    TableCell,
    TableBody,
} from "@/components/ui/table";

interface ProductListSkeletonProps {
    rowCount?: number;
}

export default function ProductListSkeleton({
    rowCount = 5,
}: ProductListSkeletonProps = {}) {
    return (
        <TableBody>
            {[...Array(rowCount)].map((_, index) => (
                <TableRow key={index}>
                    {/* Image Column */}
                    <TableCell className="flex justify-center">
                        <Skeleton className="h-12 w-12 rounded-sm" />
                    </TableCell>

                    {/* Title Column */}
                    <TableCell>
                        <Skeleton className="h-4 w-3/4" />
                    </TableCell>

                    {/* Type Column */}
                    <TableCell className="text-center">
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                    </TableCell>

                    {/* Price Column */}
                    <TableCell className="text-center">
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                    </TableCell>

                    {/* Quantity Column */}
                    <TableCell className="text-center">
                        <Skeleton className="h-4 w-1/4 mx-auto" />
                    </TableCell>

                    {/* Creation Date Column */}
                    <TableCell className="text-center">
                        <Skeleton className="h-4 w-2/3 mx-auto" />
                    </TableCell>

                    {/* Status Column */}
                    <TableCell className="text-center">
                        <Skeleton className="h-4 w-1/3 mx-auto" />
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell>
                        <div className="flex gap-2 justify-center">
                            <Skeleton className="h-5 w-5" />
                            <Skeleton className="h-5 w-5" />
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    );
}
