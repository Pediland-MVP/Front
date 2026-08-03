import { Info, Phone, Video } from 'lucide-react';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import { useRouter } from 'next/navigation';
import { CommentNamespace } from '@/types/comments/comment.namespace';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

interface CommentTopbarProps {
  instagramPost: CommentNamespace.GET.Comment['instagramPost'];
}

export const TopbarIcons = [{ icon: Phone }, { icon: Video }, { icon: Info }];

export default function CommentTopBar({ instagramPost }: CommentTopbarProps) {
  const t = useTranslations('Comments');
  const router = useRouter();

  if (!instagramPost) {
    return <div>{/* <LoaderSpin size="sm" className="w-4 h-4 mx-auto" /> */}</div>;
  }

  return (
    <div className="mb-2 flex w-full items-center justify-between rounded-t-2xl border-b pb-5">
      <Link href={instagramPost.permalink} target="_blank">
        <div className="flex items-center gap-4">
          <Image
            width={25}
            height={25}
            quality={100}
            className="h-10 w-10 rounded-sm"
            alt={instagramPost.caption || 'پست اینستاگرام'}
            src={instagramPost.picture?.url || ''}
          />
          <div className="flex flex-col">
            <span className="w-[20ch] truncate font-medium lg:w-[50ch]">
              {t('commentsOf', { caption: instagramPost.caption })}
            </span>
            <span className="text-xs"></span>
          </div>
        </div>
      </Link>
      <X
        onClick={() => router.push('/comments')}
        className="cursor-pointer text-gray-300 duration-300 hover:text-gray-700"
        height={24}
        width={24}
      />
    </div>
  );
}
