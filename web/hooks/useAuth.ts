"use client";

import { useEffect, useState } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { verifyWallet } from "@/lib/api";
import { toast } from "sonner";

const AUTH_TOKEN_KEY = "payloop_auth_token";
const AUTH_ADDRESS_KEY = "payloop_auth_address";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Load token from localStorage on mount or address change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedAddress = localStorage.getItem(AUTH_ADDRESS_KEY);

      if (isConnected && address && storedAddress?.toLowerCase() === address.toLowerCase()) {
        setToken(storedToken);
      } else {
        setToken(null);
      }
    }
  }, [address, isConnected]);

  const login = async () => {
    if (!address) return;
    setIsAuthenticating(true);
    try {
      const message = `Welcome to PayLoop! Sign this message to verify ownership of your wallet: ${address.toLowerCase()}`;
      
      const signature = await signMessageAsync({ message });
      
      const data = await verifyWallet(address, signature, message);
      
      if (data.access_token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
        localStorage.setItem(AUTH_ADDRESS_KEY, address);
        setToken(data.access_token);
        toast.success("Wallet authenticated successfully!");
      } else {
        throw new Error("No token returned");
      }
    } catch (err: any) {
      console.error("Authentication failed:", err);
      toast.error("Authentication failed", {
        description: err.message || "Failed to sign message / verify wallet",
      });
      // If signature/auth failed, disconnect the wallet so they can try again
      disconnect();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_ADDRESS_KEY);
    setToken(null);
    disconnect();
  };

  // Auto-login when connected but no token is present
  useEffect(() => {
    if (isConnected && address && !token && !isAuthenticating) {
      const storedAddress = localStorage.getItem(AUTH_ADDRESS_KEY);
      if (storedAddress?.toLowerCase() !== address.toLowerCase()) {
        login();
      }
    }
  }, [isConnected, address, token]);

  return {
    token,
    isAuthenticated: !!token,
    isAuthenticating,
    login,
    logout,
  };
}
