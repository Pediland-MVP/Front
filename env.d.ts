declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BACK_API_URL: string;
      JWT_SECRET: string;
      NEXT_PUBLIC_BACK_API_URL: string;
      NEXT_PUBLIC_DL_URL: string;
      NEXT_PUBLIC_INSTAGRAM_CLIENT_ID: string;
      NEXT_PUBLIC_LANDING_URL: string;
      NEXT_PUBLIC_MAIN_SITE_URL: string;
      NEXT_PUBLIC_WS_COMMENTS: string;
      NEXT_PUBLIC_WS_MESSAGE: string;
    }
  }
}


export {};
