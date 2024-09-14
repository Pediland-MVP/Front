declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_BACK_API_URL: string;
      BACK_API_URL: string;
      NEXT_PUBLIC_WS_MESSAGE: string;
    }
  }
}

export {};
