"use client";

import { useAccount } from "wagmi";
import CreditScoreCard from "@/components/CreditScoreCard";
import QRCode from "react-qr-code";
import { truncateAddress } from "@/lib/utils";

export default function ScorePage() {
  const { address, isConnected } = useAccount();
  const scanUrl = address ? `https://amoy.polygonscan.com/address/${address}` : "";

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
        <p className="text-[var(--text-secondary)]">Connect to view your CreditLoop score.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">CreditLoop Score</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Your on-chain credit reputation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreditScoreCard walletAddress={address} />

        <div className="space-y-6">
          {/* QR Code */}
          <div className="glass-card p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-4">Share Your Score</h3>
            <div className="p-4 bg-white rounded-xl mb-4">
              <QRCode value={scanUrl} size={160} level="M" />
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center">
              Scan to view {truncateAddress(address || "")} on PolygonScan
            </p>
            <a href={scanUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-[var(--accent-teal)] hover:underline mt-2">
              Open in browser →
            </a>
          </div>

          {/* Scoring Rules */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Scoring Rules</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold">+10</span>
                <span className="text-[var(--text-secondary)]">On-time contribution</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 font-bold">-20</span>
                <span className="text-[var(--text-secondary)]">Missed contribution</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">+15</span>
                <span className="text-[var(--text-secondary)]">Loan fully repaid</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
