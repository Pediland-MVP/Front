import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Info, Phone, Video } from 'lucide-react';
import { leadNamespace } from '@/types/lead';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import { useRouter } from 'next/navigation';

interface ChatTopbarProps {
  lead?: leadNamespace.GET['One'];
}

export const TopbarIcons = [{ icon: Phone }, { icon: Video }, { icon: Info }];

export default function ChatTopbar({ lead }: ChatTopbarProps) {
  const router = useRouter();

  if (!lead) {
    return <div>{/* <LoaderSpin size="sm" className="w-4 h-4 mx-auto" /> */}</div>;
  }

  return (
    <div className="mb-2 flex w-full items-center justify-between rounded-t-2xl border-b pb-5">
      <div className="flex items-center gap-4">
        <Avatar className="flex items-center justify-center bg-gray-400">
          <AvatarImage
            src={lead.leadInstagram.profilePicture?.url}
            alt={lead.firstname}
            width={6}
            height={6}
            className="h-10 w-10"
          />
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">
            {lead.firstname} {lead.lastname && lead.lastname}
          </span>
          <span className="text-xs">{lead.instagram && 'کاربر اینستاگرام'}</span>
        </div>
      </div>
      <X
        onClick={() => router.push('/directs')}
        className="cursor-pointer text-gray-300 duration-300 hover:text-gray-700"
        height={24}
        width={24}
      />
    </div>
  );
}
