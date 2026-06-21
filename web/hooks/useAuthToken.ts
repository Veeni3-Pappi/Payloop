"use client";

// Read-only access to the stored auth token without triggering the
// wallet sign-in side effects in useAuth. Safe to mount globally.

import { useEffect, useState } from "react";

const AUTH_TOKEN_KEY = "payloop_auth_token";

export function useAuthToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setToken(localStorage.getItem(AUTH_TOKEN_KEY));
    read();
    window.addEventListener("storage", read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("focus", read);
    };
  }, []);

  return token;
}
