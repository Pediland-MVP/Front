export const fetcher2 = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const error: any = new Error("An error occurred while fetching the data.");
    // Attach extra info to the error object.
    error.data = data;
    error.status = res.status;
    throw error;
  }

  return data;
};
