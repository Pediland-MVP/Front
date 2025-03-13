import api, { getAccessToken } from '@/hooks/swr/api-client';
import { AxiosResponse } from 'axios';
import { io } from 'socket.io-client';

let isRefreshing = false;
let refreshPromise: Promise<AxiosResponse<any>> | null = null;

async function ensureValidToken() {
    if (isRefreshing) {
        await refreshPromise;
        return;
    }

    isRefreshing = true;
    refreshPromise = api.get('/users/me').finally(() => {
        isRefreshing = false;
        refreshPromise = null;
    });

    await refreshPromise;
}

function createSocket(url: string) {
    return io(url, {
        withCredentials: true,
        extraHeaders: {
            Authorization: `Bearer ${getAccessToken()}`
        }
    });
}

export let messagesSocket = createSocket(process.env.NEXT_PUBLIC_WS_MESSAGE);

messagesSocket.on('exception', async (data) => {
    if (data.code === 401) {
        await ensureValidToken();
        messagesSocket.disconnect();
        messagesSocket = createSocket(process.env.NEXT_PUBLIC_WS_MESSAGE);
        messagesSocket.connect();
    }
});

export let commentsSocket = createSocket(process.env.NEXT_PUBLIC_WS_COMMENTS);

commentsSocket.on('exception', async (data) => {
    if (data.code === 401) {
        await ensureValidToken();
        commentsSocket.disconnect();
        commentsSocket = createSocket(process.env.NEXT_PUBLIC_WS_COMMENTS);
        commentsSocket.connect();
    }
});
