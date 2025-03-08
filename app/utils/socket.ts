import api, { getAccessToken } from '@/hooks/swr/api-client';
import { io } from 'socket.io-client';


export let messagesSocket = io(process.env.NEXT_PUBLIC_WS_MESSAGE, {
    withCredentials: true,
    extraHeaders: {
        Authorization: `Bearer ${getAccessToken()}`
    }
})

messagesSocket.on('exception', async (data) => {
    if (data.code === 401) {
        await api.get('/users/me').then(() => {
            messagesSocket.disconnect();
            messagesSocket = io(process.env.NEXT_PUBLIC_WS_MESSAGE, {
                withCredentials: true,
                extraHeaders: {
                    Authorization: `Bearer ${getAccessToken()}`
                }
            })
            messagesSocket.connect();
        })
    }
})



export let commentsSocket = io(process.env.NEXT_PUBLIC_WS_COMMENTS, {
    withCredentials: true,
    extraHeaders: {
        Authorization: `Bearer ${getAccessToken()}`
    }
})

commentsSocket.on('exception', async (data) => {
    if (data.code === 401) {
        await api.get('/users/me').then(() => {
            commentsSocket.disconnect();
            commentsSocket = io(process.env.NEXT_PUBLIC_WS_COMMENTS, {
                withCredentials: true,
                extraHeaders: {
                    Authorization: `Bearer ${getAccessToken()}`
                }
            })
            commentsSocket.connect();
        })
    }
})