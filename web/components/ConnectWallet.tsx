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
        <MetaMaskIcon />
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
        <MetaMaskIcon />
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
        <span className="text-lg">⚠️</span>
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
          className="btn-outline text-sm !px-4 !py-2"
          disabled={isAuthenticating}
        >
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
        <MetaMaskIcon />
      )}
      {isPending ? "Connecting…" : isAuthenticating ? "Authenticating…" : "Connect Wallet"}
    </button>
  );
}

function MetaMaskIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.28 1L13.37 7.62l1.65-3.92L22.28 1z"
        fill="#E17726"
        stroke="#E17726"
        strokeWidth="0.25"
      />
      <path
        d="M1.72 1l8.82 6.68-1.56-3.98L1.72 1zM19.16 17.12l-2.37 3.63 5.07 1.4 1.46-4.93-4.16-.1zM.7 17.22l1.44 4.93 5.07-1.4-2.37-3.63-4.14.1z"
        fill="#E27625"
        stroke="#E27625"
        strokeWidth="0.25"
      />
      <path
        d="M6.92 10.5l-1.42 2.14 5.06.23-.18-5.43-3.46 3.06zM17.08 10.5l-3.51-3.12-.12 5.49 5.05-.23-1.42-2.14zM7.21 20.75l3.04-1.48-2.62-2.05-.42 3.53zM13.75 19.27l3.04 1.48-.42-3.53-2.62 2.05z"
        fill="#E27625"
        stroke="#E27625"
        strokeWidth="0.25"
      />
    </svg>
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
