"use client";

import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";

type ContentCycleSkeletonProps = {
  rowCount?: number;
};

export default function ContentCycleSkeleton({
  rowCount = 5,
}: ContentCycleSkeletonProps) {
  const rows = Array.from({ length: rowCount }, (_, index) => (
    <TableRow key={index}>
      <TableCell>
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
      </TableCell>
    </TableRow>
  ));
  return <>{rows}</>;
}
