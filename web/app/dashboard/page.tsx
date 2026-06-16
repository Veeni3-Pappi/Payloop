"use client";

import { useAccount } from "wagmi";
import { useVaultBalance, useMemberCount, useContribution } from "@/hooks/useCircleVault";
import { useLoanCount } from "@/hooks/useLendingPool";
import { useCreditScore } from "@/hooks/useCreditScore";
import { formatMatic, scoreColor } from "@/lib/utils";
import VaultChart from "@/components/VaultChart";
import ContributeModal from "@/components/ContributeModal";
import { useState } from "react";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: balance, refetch: refetchBalance } = useVaultBalance();
  const { data: memberCount } = useMemberCount();
  const { data: myContribution } = useContribution(address);
  const { data: loanCount } = useLoanCount();
  const { data: score } = useCreditScore(address);
  const [showContribute, setShowContribute] = useState(false);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-6xl mb-4">🦊</div>
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-[var(--text-secondary)]">Connect MetaMask to access your dashboard.</p>
      </div>
    );
  }

  const stats = [
    { label: "Vault Balance", value: balance ? `${formatMatic(balance)} MATIC` : "—", glow: "stat-glow-purple", icon: "💰" },
    { label: "Members", value: memberCount !== undefined ? Number(memberCount).toString() : "—", glow: "stat-glow-teal", icon: "👥" },
    { label: "Active Loans", value: loanCount !== undefined ? Number(loanCount).toString() : "—", glow: "stat-glow-blue", icon: "📄" },
    { label: "Credit Score", value: score !== undefined ? Number(score).toString() : "—", glow: "stat-glow-amber", icon: "⭐" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Here&apos;s your circle overview</p>
        </div>
        <button onClick={() => setShowContribute(true)} className="btn-glow text-sm">
          + Contribute
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`glass-card p-5 ${stat.glow} animate-fade-in-up`} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--text-secondary)]">{stat.label}</span>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${stat.label === "Credit Score" && score ? scoreColor(Number(score)) : "text-[var(--text-primary)]"}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VaultChart />
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Your Contributions</h3>
          <div className="text-3xl font-bold gradient-text mb-2">
            {myContribution ? formatMatic(myContribution) : "0.0000"} MATIC
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-6">Total contributed to this circle</p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Circle Vault</span>
              <span className="font-mono text-[var(--text-primary)]">{balance ? formatMatic(balance) : "0"} MATIC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Your Share</span>
              <span className="font-mono text-[var(--text-primary)]">
                {balance && myContribution && Number(balance) > 0
                  ? ((Number(myContribution) / Number(balance)) * 100).toFixed(1) + "%"
                  : "0%"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={() => setShowContribute(true)} className="glass-card p-5 text-left hover:border-[var(--accent-purple)] transition-all group">
          <div className="text-2xl mb-2">💸</div>
          <div className="font-semibold text-sm group-hover:text-[var(--accent-purple)] transition-colors">Make Contribution</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Deposit MATIC to the vault</div>
        </button>
        <a href="/loans" className="glass-card p-5 text-left hover:border-[var(--accent-teal)] transition-all group">
          <div className="text-2xl mb-2">📋</div>
          <div className="font-semibold text-sm group-hover:text-[var(--accent-teal)] transition-colors">Request Loan</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Borrow from circle pool</div>
        </a>
        <a href="/score" className="glass-card p-5 text-left hover:border-[var(--accent-blue)] transition-all group">
          <div className="text-2xl mb-2">📊</div>
          <div className="font-semibold text-sm group-hover:text-[var(--accent-blue)] transition-colors">View Score</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Check your CreditLoop score</div>
        </a>
      </div>

      <ContributeModal isOpen={showContribute} onClose={() => setShowContribute(false)} onSuccess={() => refetchBalance()} />
    </div>
  );
}
