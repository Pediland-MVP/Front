"use client";

import api from "@/hooks/swr/api-client";
import { cn } from "@/lib/utils";
import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import useSWRImmutable from "swr/immutable";
// TODO: Refactor Types & Schemas
import { InstagramNamespace } from "@/types/instagram";

import {
  Button,
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui";
import { InstagramLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { EyeIcon, Plug2Icon, Trash2Icon } from "lucide-react";
import { LoaderSpin } from "../ui-custom/LoaderSpin";
import { DeleteConfirmationDialog } from "../Global/DeleteConfirmationDialog";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const INSTAGRAM_CLIENT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

export const InstagramAccounts = () => {
  const router = useRouter();
  const t = useTranslations("Settings.Accounts");
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const apiUrl = `${API_URL}/instagram/accounts`;
  const {
    data: instagramPages,
    isLoading: isInstagramPagesLoading,
    error: instagramPagesError,
    mutate,
  } = useSWRImmutable<InstagramNamespace.GET["Accounts"]>(apiUrl, {
    revalidateOnMount: true,
  });

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

  if (isInstagramPagesLoading || isDeleteLoading) {
    return <LoaderSpin />;
  }

  if (instagramPages.filter(i => !i.isIgTokenValid)) {
    return null
  }

  return (
    <>
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        instagram
      />

      
        {instagramPages?.map((instagram) => {
          return (
            <Card
              className={cn(
                "w-full max-w-md gap-0 border-violet-200 p-0 shadow-violet-200",
                !instagram.isIgTokenValid &&
                  "border-destructive/30 shadow-destructive/10 bg-red-50/50",
              )}
              key={instagram.id}
            >
              <CardContent className="flex-1 p-4">
                <div className="flex gap-3">
                  <div className="_avatar">
                    {instagram.profilePictureUrl ? (
                      <Image
                        className="aspect-square rounded-full"
                        src={
                          !imgError && instagram.profilePictureUrl
                            ? instagram.profilePictureUrl
                            : "/images/placeholder.webp"
                        }
                        width={60}
                        height={60}
                        alt={instagram.name}
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <InstagramLogoIcon size={60} />
                    )}
                  </div>

                  <div className="_info flex flex-col justify-center">
                    <span>{instagram.name}</span>
                    <span className="text-sm text-gray-500">
                      {instagram.username}@
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex rounded-b-xl bg-gray-100 p-0">
                <Button
                  className={cn(
                    "text-muted-foreground hover:text-primary h-9 w-full flex-1 rounded-none rounded-br-xl hover:bg-violet-100",
                  )}
                  variant="ghost"
                  type="button"
                  size="sm"
                  asChild
                >
                  <Link
                    href={`https://instagram.com/${instagram.username}`}
                    target="_blank"
                  >
                    <EyeIcon className="text-primary" />
                    {t("view")}
                  </Link>
                </Button>
                <Button
                  className={cn(
                    "text-muted-foreground hover:text-secondary h-9 w-full flex-1 rounded-none hover:bg-blue-100",
                    !instagram.isIgTokenValid &&
                      "bg-destructive hover:bg-destructive text-white hover:text-white",
                  )}
                  variant="ghost"
                  type="button"
                  size="sm"
                  onClick={() => {
                    router.push(
                      `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${API_URL}/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`,
                    );
                  }}
                >
                  <Plug2Icon
                    className={cn(
                      "text-secondary",
                      !instagram.isIgTokenValid && "text-white",
                    )}
                  />
                  {t("relogin")}
                </Button>
                <Button
                  className="text-muted-foreground hover:text-destructive h-9 w-full flex-1 rounded-none rounded-bl-xl hover:bg-rose-100"
                  variant="ghost"
                  type="button"
                  size="sm"
                  onClick={() => handleDelete(instagram.id)}
                >
                  <Trash2Icon className="text-destructive" />
                  {t("delete")}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
    </>
  );
};
