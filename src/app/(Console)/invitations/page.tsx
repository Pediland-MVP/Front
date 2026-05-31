"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import api from "@/hooks/swr/api-client";
import { useInvitations, Invitation } from "@/hooks/useInvitations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button
} from "@/components/ui";
import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";

export default function InvitationsPage() {
  const t = useTranslations("Settings.Invitations");

  const { invitations, isLoading, mutate } = useInvitations();

  const handleAction = async (id: string, action: "accept" | "deny") => {
    try {
      await api.post(`/invitations/${id}/${action}`);
      toast.success(t(`${action}_success`));
      mutate();
      if (action === "accept") {
        window.location.href = "/";
      }
    } catch (e) {
      toast.error(t(`${action}_error`));
    }
  };

  if (isLoading) return <LoaderSpin />;

  return (
    <div className="_invitations-page flex-1 rounded-t-3xl bg-white md:rounded-t-none md:rounded-b-xl">
      <div className="flex h-full flex-col border-gray-100 px-4 py-5 md:pt-0">
        <div className="mb-5">
          <h2 className="text-primary mb-1 font-semibold">{t("title")}</h2>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
        <div className="flex-1">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("workspace")}</TableHead>
                  <TableHead>{t("invited_by")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      {t("no_invitations")}
                    </TableCell>
                  </TableRow>
                ) : (
                  invitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.workspace?.name || t("workspace")}</TableCell>
                      <TableCell>
                        {inv.inviter?.firstname} {inv.inviter?.lastname}
                      </TableCell>
                      <TableCell className="text-right space-x-2 space-x-reverse">
                        <Button
                          variant="outline"
                          onClick={() => handleAction(inv.id, "deny")}
                        >
                          {t("deny")}
                        </Button>
                        <Button
                          onClick={() => handleAction(inv.id, "accept")}
                        >
                          {t("accept")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
