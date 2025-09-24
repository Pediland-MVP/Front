declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_BACK_API_URL: string;
      NEXT_PUBLIC_WS_MESSAGE: string;
      NEXT_PUBLIC_WS_COMMENTS: string;
      NEXT_PUBLIC_DL_URL: string;
      NEXT_PUBLIC_MAIN_SITE_URL: string;
      BACK_API_URL: string;
      JWT_SECRET: string;
      NEXT_PUBLIC_LANDING_URL: string;
    }
  }
}


export {};
