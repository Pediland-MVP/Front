'use client'
import Image from "next/image";
import InfiniteSlider from "@/components/ui/infinite-carousel";

interface InstagramPage {
  name: string;
  followersLabel: string;
  profileImage: string;
}

const instagramPages: InstagramPage[] = [
  { name: "فکر بازیا", followersLabel: "720K", profileImage: "/images/customers/01.jpg" },
  { name: "بازیاتو", followersLabel: "600K", profileImage: "/images/customers/02.jpg" },
  { name: "امپراتوری علیخانی", followersLabel: "470K", profileImage: "/images/customers/03.jpg" },
  { name: "حس تازگی", followersLabel: "200K", profileImage: "/images/customers/04.jpg" },
  { name: "بازی شو", followersLabel: "600K", profileImage: "/images/customers/05.jpg" },
  { name: "یوهوتویز", followersLabel: "190K", profileImage: "/images/customers/06.jpg" },
  { name: "لیوا فارما", followersLabel: "125K", profileImage: "/images/customers/07.jpg" },
  { name: "روشا هوم", followersLabel: "160K", profileImage: "/images/customers/08.jpg" },
  { name: "مهرگرد", followersLabel: "105K", profileImage: "/images/customers/09.jpg" },
  { name: "سمیه علی‌محمدی", followersLabel: "425K", profileImage: "/images/customers/10.jpg" },
  { name: "املاک کرمی", followersLabel: "130K", profileImage: "/images/customers/11.jpg" },
  { name: "تازه نفس", followersLabel: "75K", profileImage: "/images/customers/13.jpg" },
];

function ProfileCard({ page }: { page: InstagramPage }) {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="relative h-16 w-16 sm:h-[72px] sm:w-[72px] overflow-hidden rounded-full">
        <Image
          src={page.profileImage}
          alt={page.name}
          fill
          className="object-cover"
          sizes="72px"
          unoptimized
        />
      </div>
      <div className="flex flex-col items-center text-center">
        <span className="text-xs sm:text-sm font-medium text-foreground leading-tight line-clamp-1 max-w-[90px] sm:max-w-[110px]">
          {page.name}
        </span>
        <span className="text-[13px]">
          {page.followersLabel}
        </span>
      </div>
    </div>
  );
}

export function CustomersSlider() {
  return (
    <div dir='ltr' className="w-full max-w-lvw py-6" role="region" aria-label="Customer profiles">
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 md:w-5 sm:w-16 bg-linear-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 md:w-5 sm:w-16 bg-linear-to-l from-background to-transparent" />

        <InfiniteSlider
          gap={24}
          speed={40}
          speedOnHover={10}
        >
          {instagramPages.map((page) => (
            <ProfileCard key={page.name} page={page} />
          ))}
        </InfiniteSlider>
      </div>
    </div>
  );
}
