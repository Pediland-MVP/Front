"use client";

import { useTranslations } from "next-intl";
import { fetcher } from "@/hooks/swr/fetcher";
import { InstagramNamespace } from "@/types/instagram";
import Link from "next/link";
import { MouseEvent, useEffect, useState } from "react";
import useSWR from "swr";
import { SelectInstagram } from "./selectInstagram";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
// Just UI Imports Below
import { Button } from "@/components/theme/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/theme/ui/alert-dialog";
import {
  DotsThreeOutlineVertical,
  Eye,
  InstagramLogo,
  Spinner,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/theme/ui/dropdown-menu";
import { ArrowClockwise } from "@phosphor-icons/react";
import LoadingSpinner from "@/components/theme/ui/loadingSpinner";
import useSWRImmutable from "swr/immutable";
import api from "@/hooks/swr/api-client";

type AccountsProps = {
  filteredInstagramPages: InstagramNamespace.GET["Accounts"] | null | undefined;
  setFilteredInstagramPages: React.Dispatch<
    React.SetStateAction<InstagramNamespace.GET["Accounts"] | null | undefined>
  >;
};

export default function Accounts({
  filteredInstagramPages,
  setFilteredInstagramPages,
}: AccountsProps) {
  const t = useTranslations("Settings.Accounts");
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFromFacebook: boolean = !!searchParams.get("facebookAccountId");
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: instagramPages,
    isLoading: isInstagramPagesLoading,
    error: instagramPagesError,
    mutate,
  } = useSWRImmutable<InstagramNamespace.GET["Accounts"]>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/accounts`,
    {
      revalidateOnMount: true,
    }
  );

  useEffect(() => {
    if (!instagramPages) return;

    setFilteredInstagramPages(
      isFromFacebook
        ? instagramPages?.filter(
            (page) =>
              page.facebookAccountId ===
                searchParams.get("facebookAccountId") && !page.instagramId
          )
        : !!instagramPages?.length
          ? instagramPages.filter((account) => account.instagramId)
          : null
    );
  }, [instagramPages]);

  useEffect(() => {
    if (isFromFacebook) {
      if (filteredInstagramPages?.length === 0) {
        toast({
          title: t("errorOccurred"),
          description: t("tryAgain"),
        });
        router.push("/console/accounts");
        return;
      }
      setOpenSelectInstagramDialog(true);
    }
  }, [filteredInstagramPages]);

  const [openSelectInstagramDialog, setOpenSelectInstagramDialog] =
    useState<boolean>(false);
  const [facebookAccountId, setFacebookAccountId] = useState<string>();

  useEffect(() => {
    if (isFromFacebook) {
      setFacebookAccountId(searchParams.get("facebookAccountId")!);
    }
  }, [filteredInstagramPages]);

  const handleDelete = async (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    setIsDeleteLoading(true);

    api
      .delete(`/instagram/${id}`)
      .then((res) => {
        toast({
          title: t("deleteSuccess"),
          description: t("accountDeletedSuccess"),
        });

        mutate();
      })
      .catch(() => {
        toast({
          title: t("deleteError"),
          description: t("deleteErrorDescription"),
          variant: "destructive",
        });
      })
      .finally(() => {
        setShowDeleteModal(false);
        setIsDeleteLoading(false);
      });
  };

  if (isInstagramPagesLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {filteredInstagramPages && filteredInstagramPages.length > 0 ? (
        filteredInstagramPages?.map((instagram) => {
          return (
            <div
              key={instagram.id}
              className="_card bg-blue-50/35 shadow hover:shadow-lg duration-200 border rounded-lg"
            >
              <div className="flex flex-row items-center justify-between gap-4 p-3 md:p-4 group h-full hover:cursor-pointer">
                <div className="flex gap-3 md:gap-4 items-center">
                  <div className="_avatar">
                    {instagram.profilePictureUrl ? (
                      <Image
                        className="rounded-full"
                        src={instagram.profilePictureUrl || "/placeholder.svg"}
                        width={75}
                        height={75}
                        alt={instagram.name}
                      />
                    ) : (
                      <InstagramLogo size={75} />
                    )}
                  </div>

                  <div className="_info flex flex-col justify-center">
                    <span>{instagram.name}</span>
                    <span className="text-[15px] text-gray-500">
                      {instagram.username}@
                    </span>
                  </div>
                </div>

                <div className="_tools flex gap-2">
                  <div className="w-full flex justify-end">
                    <DropdownMenu dir="rtl">
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-6">
                          <DotsThreeOutlineVertical className="h-6 w-6 text-primary" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          {instagram.instagramId ? (
                            <Link
                              className="flex items-center gap-2"
                              href={`https://instagram.com/${instagram.username}`}
                              target="_blank"
                            >
                              <Eye size={18} />
                              {t("view")}
                            </Link>
                          ) : (
                            <Button
                              onClick={() => {
                                setOpenSelectInstagramDialog(true);
                                setFacebookAccountId(
                                  instagram.facebookAccountId
                                );
                              }}
                              variant={"outline"}
                            >
                              {t("connectAccount")}
                            </Button>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link
                            className="flex items-center gap-2"
                            href={`${process.env.NEXT_PUBLIC_BACK_API_URL}/instagram/connectIG`}
                          >
                            <ArrowClockwise size={18} />
                            {t("relogin")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`#`}>
                            <AlertDialog
                              open={showDeleteModal}
                              onOpenChange={setShowDeleteModal}
                            >
                              <AlertDialogTrigger asChild>
                                <div className="flex items-center gap-2 text-red-600">
                                  <Trash size={18} />
                                  {t("delete")}
                                </div>
                              </AlertDialogTrigger>

                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t("areYouSure")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("deleteConfirmation")}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogAction
                                    type="button"
                                    onClick={(e) =>
                                      handleDelete(e, instagram.id)
                                    }
                                  >
                                    {isDeleteLoading ? (
                                      <Spinner className="h-5 w-5 animate-spin" />
                                    ) : (
                                      t("delete")
                                    )}
                                  </AlertDialogAction>
                                  <AlertDialogCancel>
                                    {t("cancel")}
                                  </AlertDialogCancel>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>{" "}
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="w-full flex items-center justify-center">
          <p className="text-gray-600 text-[15px]">{t("noAccountsFound")}</p>
        </div>
      )}

      <SelectInstagram
        facebookAccountId={facebookAccountId!}
        open={openSelectInstagramDialog}
        setOpen={setOpenSelectInstagramDialog}
      />
    </>
  );
}
