import { useState } from 'react';
import api from '@/hooks/swr/api-client';
import { InstagramNamespace } from '@/types/instagram';

export function useInstagramFollowersLookup() {
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  const lookup = async (username: string) => {
    setIsLookupLoading(true);
    try {
      const res = await api.get<InstagramNamespace.GET.FollowersLookup>(
        `/instagram/lookup-followers?username=${encodeURIComponent(username)}`,
      );
      return res.data.data;
    } finally {
      setIsLookupLoading(false);
    }
  };

  return { lookup, isLookupLoading };
}
