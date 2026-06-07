"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useTranslations } from "next-intl";
import dayjs from "@/lib/dayjs-jalali";
import { fetcher } from "@/hooks/swr/api-client";
import { Loading } from "@/components/loading";
import { FetchError } from "@/components/fetch-error";
import { LayoutPage } from "@/components/layout/LayoutPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubscriptionStatusBadge } from "@/components/table/subscription-status-badge";
import { formatNumber } from "@/lib/formatNumber";
import { WorkspaceDetail } from "@/types/workspace";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";

export default function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("Workspaces");

  const { data, isLoading, error } = useSWR(`/workspaces/${id}`, fetcher);
  const workspace: WorkspaceDetail | undefined = data?.data;

  if (isLoading) return <Loading />;
  if (error) return <FetchError />;
  if (!workspace) return <div className="p-6">{t("notFound")}</div>;

  const { meta, members, subscription, resourceCounts, instagrams } = workspace;

  const counts: { key: keyof typeof resourceCounts; label: string }[] = [
    { key: "instagrams", label: t("instagrams") },
    { key: "leads", label: t("leads") },
    { key: "products", label: t("products") },
    { key: "orders", label: t("orders") },
  ];

  return (
    <LayoutPage>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="rounded-xl border bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold">{meta.name}</h1>
              {meta.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {meta.description}
                </p>
              )}
            </div>
            <Badge variant={meta.isPersonal ? "secondary" : "default"}>
              {meta.isPersonal ? t("personal") : t("team")}
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">{t("owner")}: </span>
              <span>{meta.owner.name || "—"}</span>
              {meta.owner.mobile && (
                <span className="text-muted-foreground">
                  {" "}
                  ({meta.owner.mobile})
                </span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">{t("createDate")}: </span>
              <span>
                {dayjs(meta.createDate).calendar("jalali").format("YYYY/MM/DD")}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold">{t("subscription")}</h2>
          {subscription ? (
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <div>
                <span className="text-muted-foreground">{t("plan")}: </span>
                <span>{subscription.plan?.name ?? "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {t("planDuration")}:{" "}
                </span>
                <span>{subscription.planDuration?.name ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {t("subscriptionStatus")}:{" "}
                </span>
                <SubscriptionStatusBadge status={subscription.status} />
              </div>
              <div>
                <span className="text-muted-foreground">{t("expire")}: </span>
                <span>
                  {dayjs(subscription.expire)
                    .calendar("jalali")
                    .format("YYYY/MM/DD")}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("noSubscription")}
            </p>
          )}
        </div>

        {/* Resource counts */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {counts.map((c) => (
            <div
              key={c.key}
              className="rounded-xl border bg-white p-4 text-center"
            >
              <div className="text-2xl font-bold">
                {formatNumber(resourceCounts[c.key])}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Instagram accounts */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold">
            {t("instagramAccounts")}
          </h2>
          {instagrams.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="flex flex-col gap-3">
              {instagrams.map((ig) => (
                <div
                  key={ig.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">@{ig.username}</span>
                    {ig.name && (
                      <span className="text-xs text-muted-foreground">
                        {ig.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      {formatNumber(ig.followersCount)} {t("followers")}
                    </span>
                    <span>
                      {formatNumber(ig.followsCount)} {t("follows")}
                    </span>
                    <span>
                      {formatNumber(ig.mediaCount)} {t("media")}
                    </span>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`https://instagram.com/${ig.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ArrowSquareOutIcon className="ml-1" />
                      {t("viewPage")}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold">{t("members")}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-right text-muted-foreground">
                  <th className="p-2 font-medium">{t("name")}</th>
                  <th className="p-2 font-medium">{t("mobile")}</th>
                  <th className="p-2 font-medium">{t("role")}</th>
                  <th className="p-2 font-medium">{t("joinedAt")}</th>
                  <th className="p-2 font-medium">{t("permissions")}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.userId} className="border-b align-top">
                    <td className="p-2">{m.name || "—"}</td>
                    <td className="p-2">{m.mobile || "—"}</td>
                    <td className="p-2">
                      <Badge
                        variant={m.role === "owner" ? "default" : "secondary"}
                      >
                        {m.role === "owner" ? t("role_owner") : t("role_member")}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {dayjs(m.joinedAt).calendar("jalali").format("YYYY/MM/DD")}
                    </td>
                    <td className="p-2">
                      {m.role === "owner" ? (
                        <span className="text-xs text-muted-foreground">
                          {t("role_owner")}
                        </span>
                      ) : m.permissions.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {t("noPermissions")}
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {m.permissions.map((p) => (
                            <Badge
                              key={p.slug}
                              variant="secondary"
                              className="text-[11px]"
                            >
                              {p.slug}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LayoutPage>
  );
}
