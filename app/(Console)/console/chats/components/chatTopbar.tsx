import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Info, Phone, Video } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { leadNamespace } from "@/types/lead";

interface ChatTopbarProps {
  lead?: leadNamespace.GET["One"];
}

export const TopbarIcons = [{ icon: Phone }, { icon: Video }, { icon: Info }];

export default function ChatTopbar({ lead }: ChatTopbarProps) {

  if (!lead) {
    return <div>Loading</div>
  }
  
  return (
    <div className="w-full h-20 flex p-4 justify-between items-center border-b">
      <div className="flex items-center gap-2">
        <Avatar className="flex justify-center items-center">
          <AvatarImage
            src={lead.profilePic}
            alt={lead.firstname}
            width={6}
            height={6}
            className="w-10 h-10 "
          />
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">{lead.firstname} {lead.lastname && lead.lastname}</span>
          <span className="text-xs">{lead.instagram && 'کاربر اینستاگرام'}</span>
        </div>
      </div>

      <div>
        {TopbarIcons.map((icon, index) => (
          <Link
            key={index}
            href="#"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-9 w-9",
              "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
            )}
          >
            <icon.icon size={20} className="text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
