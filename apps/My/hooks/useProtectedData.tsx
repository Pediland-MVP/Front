import useSWR from 'swr';
import api, { getAccessToken } from './swr/api-client';

export function useProtectedData(endpoint: string, options = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    // Only fetch if we have an access token
    getAccessToken() ? endpoint : null, 
    options
  );
  
  return {
    data: data?.data,
    isLoading,
    isError: !!error,
    mutate,
    // Add a helper for common API operations
    update: async (updatedData: any) => {
      try {
        const response = await api.put(endpoint, updatedData);
        mutate(response.data, false);
        return response.data;
      } catch (error) {
        throw error;
      }
    }
  };
}

