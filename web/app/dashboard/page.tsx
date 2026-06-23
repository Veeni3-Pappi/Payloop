"use client";

import { useAccount } from "wagmi";
import { useVaultBalance, useMemberCount, useContribution } from "@/hooks/useCircleVault";
import { useLoanCount } from "@/hooks/useLendingPool";
import { useCreditScore } from "@/hooks/useCreditScore";
import { formatMatic, scoreColor, truncateAddress } from "@/lib/utils";
import VaultChart from "@/components/VaultChart";
import ContributeModal from "@/components/ContributeModal";
import { useState } from "react";
import {
  Wallet,
  Users,
  Landmark,
  Gauge,
  ArrowDownToLine,
  HandCoins,
  TrendingUp,
  Plus,
  ArrowUpRight,
  PiggyBank,
} from "lucide-react";
import { MetaMaskLogo } from "@/components/icons/BrandIcons";

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
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-purple)]/20 to-[var(--accent-teal)]/20 border border-[var(--glass-border)] flex items-center justify-center mb-5">
          <MetaMaskLogo size={44} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-[var(--text-secondary)] max-w-sm">
          Connect MetaMask to access your chama dashboard, contributions, and CreditLoop score.
        </p>
      </div>
    );
  }

  const stats = [
    {
      label: "Vault Balance",
      value: balance ? `${formatMatic(balance)} MATIC` : "—",
      glow: "stat-glow-purple",
      icon: Wallet,
      accent: "var(--accent-purple)",
    },
    {
      label: "Members",
      value: memberCount !== undefined ? Number(memberCount).toString() : "—",
      glow: "stat-glow-teal",
      icon: Users,
      accent: "var(--accent-teal)",
    },
    {
      label: "Active Loans",
      value: loanCount !== undefined ? Number(loanCount).toString() : "—",
      glow: "stat-glow-blue",
      icon: Landmark,
      accent: "var(--accent-blue)",
    },
    {
      label: "Credit Score",
      value: score !== undefined ? Number(score).toString() : "—",
      glow: "stat-glow-amber",
      icon: Gauge,
      accent: "#f59e0b",
      isScore: true,
    },
  ];

  const actions = [
    {
      title: "Make Contribution",
      desc: "Deposit MATIC to the vault",
      icon: ArrowDownToLine,
      accent: "var(--accent-purple)",
      onClick: () => setShowContribute(true),
    },
    {
      title: "Request Loan",
      desc: "Borrow from the circle pool",
      icon: HandCoins,
      accent: "var(--accent-teal)",
      href: "/loans",
    },
    {
      title: "View Score",
      desc: "Check your CreditLoop score",
      icon: TrendingUp,
      accent: "var(--accent-blue)",
      href: "/score",
    },
  ];

  const sharePct =
    balance && myContribution && Number(balance) > 0
      ? ((Number(myContribution) / Number(balance)) * 100).toFixed(1) + "%"
      : "0%";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <div className="flex items-center gap-2 mt-1.5 text-sm text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono">{truncateAddress(address || "")}</span>
            <span className="text-[var(--text-muted)]">· Mama Wanjiku&apos;s Chama</span>
          </div>
        </div>
        <button
          onClick={() => setShowContribute(true)}
          className="btn-glow text-sm flex items-center gap-2 self-start"
        >
          <Plus size={16} strokeWidth={2.5} />
          Contribute
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`glass-card p-5 ${stat.glow} animate-fade-in-up`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `color-mix(in srgb, ${stat.accent} 16%, transparent)` }}
              >
                <Icon size={20} style={{ color: stat.accent }} strokeWidth={2} />
              </div>
              <div className="text-xs text-[var(--text-secondary)] mb-1">{stat.label}</div>
              <div
                className={`text-2xl font-bold ${
                  stat.isScore && score ? scoreColor(Number(score)) : "text-[var(--text-primary)]"
                }`}
              >
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VaultChart />
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-purple)]/15 flex items-center justify-center">
              <PiggyBank size={18} className="text-[var(--accent-purple)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Your Contributions</h3>
          </div>
          <div className="text-3xl font-bold gradient-text mb-1">
            {myContribution ? formatMatic(myContribution) : "0.0000"} MATIC
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-6">Total contributed to this circle</p>

          <div className="mt-auto space-y-3 pt-4 border-t border-[var(--glass-border)]">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Circle Vault</span>
              <span className="font-mono text-[var(--text-primary)]">
                {balance ? formatMatic(balance) : "0"} MATIC
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Your Share</span>
              <span className="font-semibold text-[var(--accent-teal)]">{sharePct}</span>
            </div>
            {/* Share bar */}
            <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-teal)] transition-all duration-700"
                style={{ width: sharePct }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            const inner = (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `color-mix(in srgb, ${action.accent} 16%, transparent)` }}
                  >
                    <Icon size={22} style={{ color: action.accent }} strokeWidth={2} />
                  </div>
                  <ArrowUpRight
                    size={18}
                    className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors"
                  />
                </div>
                <div className="font-semibold text-sm transition-colors">{action.title}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">{action.desc}</div>
              </>
            );
            const cls =
              "glass-card p-5 text-left transition-all group hover:-translate-y-0.5";
            return action.href ? (
              <a key={action.title} href={action.href} className={cls}>
                {inner}
              </a>
            ) : (
              <button key={action.title} onClick={action.onClick} className={cls}>
                {inner}
              </button>
            );
          })}
        </div>
      </div>

      <ContributeModal
        isOpen={showContribute}
        onClose={() => setShowContribute(false)}
        onSuccess={() => refetchBalance()}
      />
    </div>
  );
}
