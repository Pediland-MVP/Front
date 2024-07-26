export const fetcher = (
    ...args: [RequestInfo] | [URL, init?: RequestInit] | any[]
) => fetch(...args, {credentials: 'include'}).then((res) => res.json());
