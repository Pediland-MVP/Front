import { io } from 'socket.io-client';



export const messagesSocket = io(process.env.NEXT_PUBLIC_WS_MESSAGE, {
    withCredentials: true,
});

export const commentsSocket = io(process.env.NEXT_PUBLIC_WS_COMMENTS, {
    withCredentials: true,
});