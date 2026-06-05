"use client";

import useUser from "@/hooks/useUser";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui";
import { ButtonLoading } from "../ui-custom/ButtonLoading";
import { PlugsIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  CopyIcon,
  PlugIcon,
  Trash2Icon,
  TvMinimalPlayIcon,
} from "lucide-react";
import SupportButton from "@/app/(Auth)/auth/supportButton";
import useSWRImmutable from "swr/immutable";
import { InstagramNamespace } from "@/types/instagram";
import { DeleteConfirmationDialog } from "../Global/DeleteConfirmationDialog";
import api from "@/hooks/swr/api-client";
import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import { HelpMeDialog } from "../Global/HelpMeDialog";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const INSTAGRAM_CLIENT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

export const InstagramInvalidDialog = () => {
  const router = useRouter();
  const t = useTranslations("instagramTokenError");
  const [isNavigationLoading, setIsNavigationLoading] = useState(false);
  const { user } = useUser();
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const apiUrl = `${API_URL}/instagram/accounts`;
  const {
    data: instagramPages,
    isLoading: isInstagramPagesLoading,
    error: instagramPagesError,
    mutate,
  } = useSWRImmutable<InstagramNamespace.GET["Accounts"]>(apiUrl, {
    revalidateOnMount: true,
  });
  const accounts = instagramPages?.data;

  const handleReLogin = () => {
    // router.push(`${API_URL}/instagram/connectIG`);
    router.push(
      `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${API_URL}/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`,
    );
    setIsNavigationLoading(true);
    // setShowPopup(false)
  };

  const handleDelete = useCallback((id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleteLoading(true);

    if (itemToDelete) {
      await api
        .delete(`/instagram/${itemToDelete}`)
        .then(async (res) => {
          toast.success(t("deleteSuccess"));
          await mutate(mutateIncludeStringKey("me"));
          await mutate(mutateIncludeStringKey("instagram"));
          router.push("/connect");
        })
        .catch((error) => {
          console.error("Delete Instagram Account Error:", error);
          toast.error(t("deleteError"));
        })
        .finally(() => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        });
    }
  };

  // Show the popup only once when the component mounts
  if (user && user.instagrams) {
    if (
      user.instagrams.find(
        (ig) =>
          ig.isIgTokenValid === false || ig.isIgWebhookSubscribed === false,
      )
    ) {
      return (
        <div className="mt-7 flex w-full max-w-md flex-col items-center justify-center">
          <DeleteConfirmationDialog
            isOpen={deleteDialogOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            instagram
          />

          <div>
            <PlugsIcon
              size={46}
              weight="duotone"
              className="text-destructive mx-auto"
            />
            <p className="my-4 text-base sm:justify-center">
              {t.rich("title", {
                username: accounts?.[0]?.username,
              })}
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-blue-200/75 bg-blue-50/60 p-2">
              <p className="text-secondary text-[13px]">{t("description")}</p>
            </div>
          </div>

          <HelpMeDialog
            title={t("how_to_connect")}
            videoSrc="https://befroosh.s3.ir-thr-at1.arvanstorage.ir/learn%2Ff54e8c002432b82b23a046865a9e9f1067430006-720p.mp4?versionId="
            videoPoster="/images/photo_2025-02-26_22-00-50.jpg"
            noAbsolute
          >
            <Button
              type="button"
              variant="link"
              size="lg"
              className="text-muted-foreground mt-3"
            >
              <TvMinimalPlayIcon className="size-6" />
              {t("how_to_connect")}
            </Button>
          </HelpMeDialog>

          <div className="mt-4 flex w-full items-center justify-center gap-x-1">
            <Button
              onClick={() => handleDelete(accounts?.[0]?.id ?? "")}
              className="w-1/2 sm:flex-1 text-red-500 hover:text-500"
              variant="outline"
            >
              <TrashIcon className="text-red-500" />
              {t("delete")}
            </Button>

            <Button
              variant="outline"
              className="w-1/2 sm:flex-1"
              onClick={() => {
                navigator.clipboard.writeText(
                  "https://www.instagram.com/oauth/authorize?client_id=2349711835364274&redirect_uri=https://api.befroosh.app/v1/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments",
                );
                toast.success("لینک اتصال با موفقیت کپی شد!");
              }}
            >
              <CopyIcon />
              کپی لینک اتصال
            </Button>
          </div>

          <ButtonLoading
            isLoading={isNavigationLoading}
            onClick={handleReLogin}
            className="mt-2 bg-primary hover:bg-purple-500 w-full text-white sm:flex-1"
          >
            <PlugIcon />
            {t("relogin")}
          </ButtonLoading>

          <SupportButton type='internal' className="text-sm" />
          <p
            onClick={() => handleDelete(accounts?.[0]?.id ?? "")}
            className="mt-20 text-xs text-gray-500"
          ></p>
        </div>
      );
    }
  }

  return null;
};
