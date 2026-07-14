import useSWR from 'swr';
import { fetcher } from '@/hooks/swr/api-client';

export interface ActiveBannerButton {
  id: string;
  textEn: string;
  textFa: string;
  url: string;
  isExternal: boolean;
}

export interface ActiveBanner {
  id: string;
  titleEn: string;
  titleFa: string;
  descriptionEn: string;
  descriptionFa: string;
  color: string;
  buttons: ActiveBannerButton[];
}

export function useActiveBanners() {
  const { data, error, isLoading } = useSWR<ActiveBanner[] | { data: ActiveBanner[] }>(
    '/banners/active',
    fetcher,
  );

  const banners: ActiveBanner[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  return { banners, isLoading, error };
}
