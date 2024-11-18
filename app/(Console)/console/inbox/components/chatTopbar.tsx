import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Info, Phone, Video } from "lucide-react";
import { leadNamespace } from "@/types/lead";
import LoadingSpinner from "@/components/ui/loadingSpinner";
// import { Spinner } from "@nextui-org/react";

interface ChatTopbarProps {
  lead?: leadNamespace.GET["One"];
}

export const TopbarIcons = [{ icon: Phone }, { icon: Video }, { icon: Info }];

export default function ChatTopbar({ lead }: ChatTopbarProps) {
  if (!lead) {
    return (
      <div>
        {/* <LoadingSpinner size="sm" className="w-4 h-4 mx-auto" /> */}
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-t-2xl flex p-4 justify-between items-center border-b">
      <div className="flex  items-center gap-2">
        <Avatar className="flex justify-center items-center bg-gray-400">
          <AvatarImage
            src={lead.leadInstagram.profilePicture.url}            
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
    </div>
  );
}
