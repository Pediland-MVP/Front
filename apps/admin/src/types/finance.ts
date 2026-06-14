// src/types/finance.ts

import type { SeriesResolution } from "@/hooks/use-platform-metrics";
import type { PageMeta } from "@/types/meta";

export enum InvoiceStatusEnum {
  PENDING = "pending",
  SUCCESS = "success",
  CANCELLED = "cancelled",
  FAILED = "failed",
}

export enum InvoicePaymentMethodEnum {
  Zarinpal = "zarinpal",
  Zibal = "zibal",
  Free = "Free",
  ByAdmin = "byAdmin",
}

/** One stacked-bar segment: revenue for a status within a time-bucket. */
export interface RevenueSeriesPoint {
  bucket: string; // ISO 8601
  status: InvoiceStatusEnum;
  amount: number; // Toman
}

export interface RevenueSeries {
  resolution: SeriesResolution;
  from: string;
  to: string;
  points: RevenueSeriesPoint[];
}

export interface FinanceSummary {
  collectedRevenue: number;
  nonSuccessAmount: number;
  successCount: number;
  nonSuccessCount: number;
  totalCount: number;
  successRate: number; // percent (0..100)
}

/**
 * A single subscription payment row in the finance table. Mirrors the lean
 * column set selected by `FinanceService.readPayments` — only what the table
 * renders, not the full Invoice/Plan/User entities.
 */
export interface Payment {
  id: number;
  createDate: string;
  amount: number;
  status: InvoiceStatusEnum;
  paymentMethod: InvoicePaymentMethodEnum;
  subscription?: {
    id: string;
    planDuration?: {
      id: number;
      plan?: { id: number; name: string } | null;
    } | null;
  } | null;
  workspace?: {
    id: string;
    owner?: {
      id: string;
      firstname: string | null;
      lastname: string | null;
      mobile: string | null;
    } | null;
  } | null;
}

export interface PaymentsResponse {
  items: Payment[];
  meta: PageMeta;
}
