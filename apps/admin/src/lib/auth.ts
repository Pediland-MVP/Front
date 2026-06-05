// src/lib/auth.ts

import api, { setAccessToken } from "@/hooks/swr/api-client";
import { mutate } from "swr";

export async function signIn(payload: { username: string; password: string }) {
  const res = await api.post("/auth/signIn", payload);

  const token = res.data?.data?.accessToken;

  if (token) {
    setAccessToken(token);
    await mutate("/auth/me");
  }

  return res.data;
}
