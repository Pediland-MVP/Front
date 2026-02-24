'use client'
import Image from "next/image";
import InfiniteSlider from "@/components/ui/infinite-carousel";
import { useTranslations } from "next-intl";

interface InstagramPage {
  name: string;
  followersLabel: string;
  profileImage: string;
}

const instagramPages: InstagramPage[] = [
  {
    name: "baziyato",
    followersLabel: "575k",
    profileImage: "001",
  },
  {
    name: "fitnesskiyani",
    followersLabel: "335k",
    profileImage: "002"
  }, 
  {
    name: "filmak",
    followersLabel: "2M",
    profileImage: "003",
  },
  {
    name: "kababiq",
    followersLabel: "555k",
    profileImage: "004"
  },
  {
    name: "iranteb",
    followersLabel: "530k",
    profileImage: "005"
  },
  {
    name: "emperatorialikhani",
    followersLabel: "720k",
    profileImage: "006"
  },
  {
    name: "khanemojalal",
    followersLabel: "440k",
    profileImage: "007"
  },
  {
    name: "fekrbaziya",
    followersLabel: "730k",
    profileImage: "008"
  },
  {
    name: "aghilesoltanpor",
    followersLabel: "505k",
    profileImage: "009"
  },
  {
    name: "khanombeauty",
    followersLabel: "145k",
    profileImage: "010"
  },
  {
    name: "javidkhodro",
    followersLabel: "365k",
    profileImage: "011"
  }, 
  {
    name: "hesetazegi",
    followersLabel: "240k",
    profileImage: "012"
  },
  {
    name: "roshaacessory",
    followersLabel: "175k",
    profileImage: "014"
  },
  {
    name: "maryshop",
    followersLabel: "190k",
    profileImage: "015"
  },
  {
    name: "ronakfarhadi",
    followersLabel: "295k",
    profileImage: "016"
  },
  {
    name: "shopishop",
    followersLabel: "250k",
    profileImage: "017"
  },
  {
    name: "persianemarati",
    followersLabel: "235k",
    profileImage: "018"
  },
  {
    name: "pasatejarat",
    followersLabel: "140k",
    profileImage: "020"
  },
  {
    name: "parchealmas",
    followersLabel: "155k",
    profileImage: "021"
  }
];

function ProfileCard({ page }: { page: InstagramPage }) {
  const t = useTranslations('Onboarding.customersSlider.customers')
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="relative h-16 w-16 sm:h-[72px] sm:w-[72px] overflow-hidden rounded-full">
        <Image
          src={`/images/customers/${page.profileImage}.jpg`}
          alt={t(page.name)}
          fill
          className="object-cover"
          sizes="72px"
          unoptimized
        />
      </div>
      <div className="flex flex-col items-center text-center">
        <span className="text-xs sm:text-sm font-medium text-foreground leading-tight line-clamp-1 max-w-[90px] sm:max-w-[110px]">
          {t(page.name)}
        </span>
        <span className="text-[14px] text-primary">
          {page.followersLabel}
        </span>
      </div>
    </div>
  );
}

export function CustomersSlider() {
  const t = useTranslations("Onboarding.customersSlider")
  return (
    <div className="w-full max-w-lvw py-6" role="region" aria-label="Customer profiles">
      <div className="mb-5 px-4 text-center">
        <p className="font-bold text-md">{t('trustedByTitle')}</p>
        <p className="text-xs text-gray-500 mt-1">{t('trustedByDesc')}</p>
      </div>
      <div dir='ltr' className="relative">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 md:w-5 sm:w-16 bg-linear-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 md:w-5 sm:w-16 bg-linear-to-l from-background to-transparent" />

        <InfiniteSlider
          gap={24}
          speed={100}
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
