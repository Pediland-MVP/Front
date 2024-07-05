declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BACK_API_URL: string;
    }
  }
}

export {};
