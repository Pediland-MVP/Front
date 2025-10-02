import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Info, Phone, Video } from "lucide-react";
import { leadNamespace } from "@/types/lead";
import { ArrowLeft, X } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";

interface ChatTopbarProps {
  lead?: leadNamespace.GET["One"];
}

export const TopbarIcons = [{ icon: Phone }, { icon: Video }, { icon: Info }];

export default function ChatTopbar({ lead }: ChatTopbarProps) {

  const router = useRouter()

  if (!lead) {
    return (
      <div>
        {/* <LoaderSpin size="sm" className="w-4 h-4 mx-auto" /> */}
      </div>
    );
  }

  return (
    <div className="w-full rounded-t-2xl flex pb-5 justify-between items-center border-b mb-2">
      <div className="flex  items-center gap-4">
        <Avatar className="flex justify-center items-center bg-gray-400">
          <AvatarImage
            src={lead.leadInstagram.profilePicture?.url}
            alt={lead.firstname}
            width={6}
            height={6}
            className="w-10 h-10 "
          />
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">
            {lead.firstname} {lead.lastname && lead.lastname}
          </span>
          <span className="text-xs">
            {lead.instagram && "کاربر اینستاگرام"}
          </span>
        </div>
      </div>
      <X
        onClick={() => router.push('/directs')}
        className="text-gray-300 cursor-pointer hover:text-gray-700 duration-300"
        height={24}
        width={24} />
    </div>
  );
}
