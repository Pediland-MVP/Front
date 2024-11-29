// Custom error class to include additional properties
export class FetchError extends Error {
  data?: any;
  status?: number;

  constructor(message: string, data?: any, status?: number) {
    super(message);
    this.name = 'FetchError';
    this.data = data;
    this.status = status;
    
    // This is necessary for proper prototype chain setup in TypeScript
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}

export const fetcher = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new FetchError(
        'An error occurred while fetching the data.',
        data, // The error info from the response
        res.status
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof FetchError) {
      throw error; // Re-throw our custom error
    }
    if (error instanceof Error) {
      throw new FetchError(`Failed to fetch data: ${error.message}`);
    }
    throw new FetchError('An unexpected error occurred while fetching data');
  }
};