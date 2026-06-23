"use client";

import { useAccount } from "wagmi";
import { useVaultBalance, useMemberCount } from "@/hooks/useCircleVault";
import { useLoanCount } from "@/hooks/useLendingPool";
import { formatMatic, truncateAddress } from "@/lib/utils";
import { CIRCLE_VAULT_ADDRESS, LENDING_POOL_ADDRESS, CREDIT_SCORE_ADDRESS, LOOP_TOKEN_ADDRESS } from "@/lib/contracts";
import ContributeModal from "@/components/ContributeModal";
import { useState } from "react";
import { Plus, ExternalLink, Vault, Landmark, Gauge, Coins, type LucideIcon } from "lucide-react";

export default function CirclesPage() {
  const { address } = useAccount();
  const { data: balance, refetch } = useVaultBalance();
  const { data: memberCount } = useMemberCount();
  const { data: loanCount } = useLoanCount();
  const [showContribute, setShowContribute] = useState(false);

  const contracts: { name: string; addr: string; desc: string; icon: LucideIcon; accent: string }[] = [
    { name: "CircleVault", addr: CIRCLE_VAULT_ADDRESS, desc: "Group savings vault", icon: Vault, accent: "var(--accent-purple)" },
    { name: "LendingPool", addr: LENDING_POOL_ADDRESS, desc: "Loan management", icon: Landmark, accent: "var(--accent-teal)" },
    { name: "CreditScore", addr: CREDIT_SCORE_ADDRESS, desc: "Credit reputation", icon: Gauge, accent: "var(--accent-blue)" },
    { name: "LoopToken", addr: LOOP_TOKEN_ADDRESS, desc: "LOOP rewards", icon: Coins, accent: "#f59e0b" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Circle Overview</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Your chama smart contract details</p>
        </div>
        <button onClick={() => setShowContribute(true)} className="btn-glow text-sm flex items-center gap-2 self-start">
          <Plus size={16} strokeWidth={2.5} />
          Contribute
        </button>
      </div>

      {/* Circle Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-6 stat-glow-purple">
          <div className="text-sm text-[var(--text-secondary)] mb-2">Vault Balance</div>
          <div className="text-3xl font-bold gradient-text">{balance ? formatMatic(balance) : "0"}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">MATIC</div>
        </div>
        <div className="glass-card p-6 stat-glow-teal">
          <div className="text-sm text-[var(--text-secondary)] mb-2">Total Members</div>
          <div className="text-3xl font-bold text-teal-400">{memberCount !== undefined ? Number(memberCount) : 0}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Active members</div>
        </div>
        <div className="glass-card p-6 stat-glow-blue">
          <div className="text-sm text-[var(--text-secondary)] mb-2">Loan Requests</div>
          <div className="text-3xl font-bold text-blue-400">{loanCount !== undefined ? Number(loanCount) : 0}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Total submitted</div>
        </div>
      </div>

      {/* Smart Contracts */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Deployed Contracts</h3>
        <div className="space-y-3">
          {contracts.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.name} className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)] hover:border-[var(--border-glow)] transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in srgb, ${c.accent} 16%, transparent)` }}
                  >
                    <Icon size={20} style={{ color: c.accent }} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{c.desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--text-secondary)] hidden sm:inline">{truncateAddress(c.addr, 6)}</span>
                  {c.addr && c.addr !== "0x" && (
                    <a href={`https://amoy.polygonscan.com/address/${c.addr}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[var(--accent-teal)] hover:underline flex items-center gap-1 whitespace-nowrap">
                      View <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ContributeModal isOpen={showContribute} onClose={() => setShowContribute(false)} onSuccess={() => refetch()} />
    </div>
  );
}
