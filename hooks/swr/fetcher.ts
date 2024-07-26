
export const fetcher = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch data: ${error.message}`);
    } else {
      throw new Error('An unexpected error occurred while fetching data');
    }
  }
};