import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Info, Phone, Video } from "lucide-react";
import { leadNamespace } from "@/types/lead";
import { ArrowLeft, X } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { CommentNamespace } from "@/types/comments/comment.namespace";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

interface CommentTopbarProps {
  instagramPost: CommentNamespace.GET.Comment["instagramPost"];
}

export const TopbarIcons = [{ icon: Phone }, { icon: Video }, { icon: Info }];

export default function CommentTopBar({ instagramPost }: CommentTopbarProps) {
  const t = useTranslations("Comments");
  const router = useRouter();

  if (!instagramPost) {
    return (
      <div>
        {/* <LoadingSpinner size="sm" className="w-4 h-4 mx-auto" /> */}
      </div>
    );
  }

  return (
    <div className="w-full rounded-t-2xl pb-5 flex justify-between items-center border-b mb-2">
      <Link href={instagramPost.permalink} target="_blank">
        <div className="flex  items-center gap-4">
          <Image
            width={12}
            height={12}
            quality={40}
            className="w-10 h-10 rounded-sm"
            alt={instagramPost.caption}
            src={instagramPost.picture?.url || ""}
          />
          <div className="flex flex-col">
            <span className="font-medium truncate w-[20ch] lg:w-[50ch]">
              {t("commentsOf", { caption: instagramPost.caption })}
            </span>
            <span className="text-xs"></span>
          </div>
        </div>
      </Link>
        <X
          onClick={() => router.push("/console/comments")}
          className="text-gray-300 cursor-pointer hover:text-gray-700 duration-300"
          height={24}
          width={24}
        />
    </div>
  );
}
