"use client";
// ═══════════════════════════════════════════════════════════
// ConnectWallet — MetaMask connect button with network check
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { truncateAddress } from "@/lib/utils";
import { polygonAmoy } from "@/lib/wagmi";
import { useAuth } from "@/hooks/useAuth";
import { MetaMaskLogo } from "@/components/icons/BrandIcons";
import { AlertTriangle, LogOut } from "lucide-react";

export default function ConnectWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending } = useConnect();
  const { switchChain } = useSwitchChain();
  const { logout, isAuthenticating } = useAuth();

  // Wallet/network state only exists in the browser. Render a stable
  // placeholder until mounted so server HTML matches the first client
  // render (avoids a hydration mismatch + reload loop).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isWrongNetwork = isConnected && chain?.id !== polygonAmoy.id;

  // Check if MetaMask is available
  const hasEthereum = typeof window !== "undefined" && typeof window.ethereum !== "undefined";

  if (!mounted) {
    return (
      <button
        disabled
        className="btn-glow text-sm flex items-center gap-2 opacity-70"
      >
        <MetaMaskLogo />
        Connect Wallet
      </button>
    );
  }

  if (!hasEthereum) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-glow text-sm flex items-center gap-2"
      >
        <MetaMaskLogo />
        Install MetaMask
      </a>
    );
  }

  if (isConnected && isWrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: polygonAmoy.id })}
        className="btn-glow text-sm flex items-center gap-2 !bg-gradient-to-r !from-amber-500 !to-orange-500"
      >
        <AlertTriangle size={16} strokeWidth={2.5} />
        Switch to Amoy
      </button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-mono text-[var(--text-secondary)]">
            {truncateAddress(address || "")}
          </span>
        </div>
        <button
          onClick={() => logout()}
          className="btn-outline text-sm !px-4 !py-2 flex items-center gap-2"
          disabled={isAuthenticating}
        >
          <LogOut size={15} strokeWidth={2.5} />
          {isAuthenticating ? "Signing..." : "Disconnect"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending || isAuthenticating}
      className="btn-glow text-sm flex items-center gap-2"
    >
      {isPending || isAuthenticating ? (
        <Spinner />
      ) : (
        <MetaMaskLogo />
      )}
      {isPending ? "Connecting…" : isAuthenticating ? "Authenticating…" : "Connect Wallet"}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
